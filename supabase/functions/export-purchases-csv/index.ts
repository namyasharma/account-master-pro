import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const businessId = url.searchParams.get('business_id');
    const periodStart = url.searchParams.get('period_start');
    const periodEnd = url.searchParams.get('period_end');

    if (!businessId) {
      return new Response(JSON.stringify({ error: 'business_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check business access
    const { data: business } = await supabaseClient
      .from('businesses')
      .select('id, name, owner_id')
      .eq('id', businessId)
      .single();

    if (!business || business.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build query
    let query = supabaseClient
      .from('purchase_entries')
      .select('entry_number, entry_date, supplier_name, supplier_gstin, subtotal, gst_amount, total, created_at')
      .eq('business_id', businessId)
      .order('entry_date', { ascending: false });

    if (periodStart) {
      query = query.gte('entry_date', periodStart);
    }
    if (periodEnd) {
      query = query.lte('entry_date', periodEnd);
    }

    const { data: purchases, error } = await query;

    if (error) throw error;

    // Generate CSV
    const csvRows = [
      'entry_number,entry_date,supplier_name,supplier_gstin,subtotal,gst_amount,total,created_by'
    ];

    for (const purchase of purchases) {
      csvRows.push(
        `"${purchase.entry_number}","${purchase.entry_date}","${purchase.supplier_name}","${purchase.supplier_gstin || ''}",${purchase.subtotal},${purchase.gst_amount},${purchase.total},"${user.email}"`
      );
    }

    const csv = csvRows.join('\n');
    const filename = `purchases-${business.name.replace(/[^a-z0-9]/gi, '_')}-${periodStart || 'all'}-${periodEnd || 'all'}.csv`;

    // Log export event
    console.log('[Export Event]', {
      user_id: user.id,
      business_id: businessId,
      export_type: 'purchases_csv',
      timestamp: new Date().toISOString(),
      record_count: purchases.length
    });

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
