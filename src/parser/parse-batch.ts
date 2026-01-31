import { supabase } from '@/integrations/supabase/client';
import { parseGSTNotification } from './parse-gst-notification';

async function processPendingNotifications() {
  console.log('🔄 Processing pending notifications...\n');
  
  // Get all pending notifications
  const { data: notifications, error } = await supabase
    .from('gst_notification')
    .select('id, notification_number, source_url')
    .eq('status', 'pending')
    .order('issued_at', { ascending: true })
    .limit(10); // Process 10 at a time
  
  if (error) {
    console.error('❌ Failed to fetch notifications:', error);
    return;
  }
  
  if (!notifications || notifications.length === 0) {
    console.log('✅ No pending notifications');
    return;
  }
  
  console.log(`📋 Found ${notifications.length} pending notifications\n`);
  
  for (const notif of notifications) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`Processing: ${notif.notification_number}`);
    console.log(`${'═'.repeat(60)}\n`);
    
    try {
      await parseGSTNotification(notif.id, notif.source_url);
      console.log(`✅ ${notif.notification_number} complete`);
      
      // Small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error: any) {
      console.error(`❌ ${notif.notification_number} failed:`, error.message);
      // Continue with next notification
    }
  }
  
  console.log('\n✅ Batch processing complete');
}

processPendingNotifications();