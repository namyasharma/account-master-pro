/**
 * Notification Watchdog - Supabase Edge Function (Production-ready)
 * Detects new or updated GST notifications from CBIC
 * 
 * Features:
 * - Robust DOM parsing using deno_dom instead of fragile regex
 * - Handles network errors and PDF download failures
 * - Detects duplicates and corrigenda using document hash
 * - Safe insertion into Supabase DB
 * - Logs all edge cases for monitoring
 * - Ready to trigger downstream parser
 * 
 * Run as cron job: 0 9 * * * (daily at 9 AM)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// -----------------------
// Type Definitions
// -----------------------
interface NotificationEntry {
  number: string;
  title: string;
  date: string;  // DD/MM/YYYY
  url: string;
}

// -----------------------
// Step 1: Scrape Notifications
// -----------------------
async function scrapeNotifications(): Promise<NotificationEntry[]> {
  console.log('🔍 Scraping CBIC GST notifications...');
  const url = 'https://cbic-gst.gov.in/gst-notifications.html';
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!response.ok) throw new Error(`Failed to fetch notifications page: ${response.status}`);
    
    const html = await response.text();

    // Parse HTML using DOMParser
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) throw new Error('Failed to parse HTML from CBIC');

    const notifications: NotificationEntry[] = [];

    // Select all links containing "Notification" in the text
    const links = doc.querySelectorAll('a');
    for (const link of links) {
      const text = link.textContent?.trim() || '';
      if (/Notification\sNo\./i.test(text)) {
        // Attempt to extract number and date from nearby text
        const numberMatch = text.match(/Notification\sNo\.\s*(\d+\/\d+)/i);
        const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/); // DD/MM/YYYY
        const href = link.getAttribute('href');
        if (numberMatch && dateMatch && href) {
          notifications.push({
            number: numberMatch[1],
            title: text,
            date: dateMatch[1],
            url: href.startsWith('http') ? href : `https://cbic-gst.gov.in${href}`
          });
        }
      }
    }

    console.log(`✅ Found ${notifications.length} notifications`);
    return notifications;
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    return [];
  }
}

// -----------------------
// Step 2: Compute SHA-256 Hash of PDF
// -----------------------
async function computeDocumentHash(url: string): Promise<string | null> {
  try {
    console.log(`📄 Downloading PDF: ${url}`);

    // Set a 30-second timeout to avoid hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`❌ PDF download failed: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('❌ Hash computation failed:', error);
    return null;
  }
}

// -----------------------
// Step 3: Check if Notification Already Exists
// -----------------------
async function notificationExists(
  supabase: SupabaseClient<any, 'public', any>,
  number: string,
  hash: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('gst_notification')
      .select('id, document_hash')
      .eq('notification_number', number)
      .single();

    // Handle non-existent row
    if (error && error.code === 'PGRST116') return false;
    if (error) {
      console.error('Database error while checking notification:', error);
      return false;
    }

    if (!data) return false;

    // Existing document unchanged
    if (data.document_hash === hash) return true;

    console.log(`⚠️ Document hash changed for ${number} - possible corrigendum`);
    return false; // hash differs, treat as new
  } catch (err) {
    console.error('❌ notificationExists failed:', err);
    return false;
  }
}

// -----------------------
// Step 4: Insert New Notification
// -----------------------
async function insertNotification(
  supabase: SupabaseClient<any, 'public', any>,
  notification: NotificationEntry,
  hash: string
): Promise<string | null> {
  try {
    // Convert DD/MM/YYYY → YYYY-MM-DD
    const [day, month, year] = notification.date.split('/');
    const issuedDate = `${year}-${month}-${day}`;

    const { data, error } = await supabase
      .from('gst_notification')
      .insert({
        notification_number: notification.number,
        authority: 'CBIC',
        issued_at: issuedDate,
        effective_from: issuedDate, // will be updated by parser
        source_url: notification.url,
        document_hash: hash,
        summary: notification.title,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Insert failed:', error);
      return null;
    }

    console.log(`✅ Inserted notification: ${data.id}`);
    return data.id;
  } catch (err) {
    console.error('❌ insertNotification failed:', err);
    return null;
  }
}

// -----------------------
// Step 5: Trigger Parser (stub)
// -----------------------
async function triggerParser(notificationId: string): Promise<void> {
  console.log(`🚀 Triggering parser for notification: ${notificationId}`);
  // Implement actual trigger: webhook, queue, or Supabase function call
}

// -----------------------
// Main Edge Function Handler
// -----------------------
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔔 Notification Watchdog Started');

    const notifications = await scrapeNotifications();
    if (notifications.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No notifications found or scraping failed',
        processed: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    let newCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const notification of notifications) {
      console.log(`\n📋 Processing: ${notification.number}`);
      try {
        const hash = await computeDocumentHash(notification.url);
        if (!hash) {
          errors.push(`Failed to compute hash for ${notification.number}`);
          continue;
        }

        const exists = await notificationExists(supabase, notification.number, hash);
        if (exists) {
          console.log(`⏭ Skipped: ${notification.number} (already exists)`);
          skippedCount++;
          continue;
        }

        const notificationId = await insertNotification(supabase, notification, hash);
        if (!notificationId) {
          errors.push(`Failed to insert ${notification.number}`);
          continue;
        }

        await triggerParser(notificationId);
        newCount++;

      } catch (err) {
        console.error(`❌ Error processing ${notification.number}:`, err);
        errors.push(`${notification.number}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 Watchdog Run Complete');
    console.log(`✅ New: ${newCount}, ⏭ Skipped: ${skippedCount}, ❌ Errors: ${errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      notifications_found: notifications.length,
      new_notifications: newCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});

  } catch (err) {
    console.error('❌ Watchdog failed:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString()
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }
});
