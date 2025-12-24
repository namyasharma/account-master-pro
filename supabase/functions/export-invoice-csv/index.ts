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
      .from('invoices')
      .select('invoice_number, invoice_date, buyer_name, buyer_gstin, subtotal, gst_amount, total, created_at')
      .eq('business_id', businessId)
      .order('invoice_date', { ascending: false });

    if (periodStart) {
      query = query.gte('invoice_date', periodStart);
    }
    if (periodEnd) {
      query = query.lte('invoice_date', periodEnd);
    }

    const { data: invoices, error } = await query;

    if (error) throw error;

    // Get line items for each invoice
    const invoiceIds = invoices.map(inv => inv.invoice_number);
    const { data: lineItems } = await supabaseClient
      .from('invoice_line_items')
      .select('invoice_id, description, quantity, unit_price, gst_rate, line_total')
      .in('invoice_id', invoiceIds);

    // Generate CSV
    const csvRows = [
      'invoice_number,invoice_date,buyer_name,buyer_gstin,line_items,subtotal,gst_amount,total,created_by'
    ];

    for (const invoice of invoices) {
      const items = lineItems?.filter(li => li.invoice_id === invoice.invoice_number) || [];
      const lineItemsJson = JSON.stringify(items).replace(/"/g, '""');
      
      csvRows.push(
        `"${invoice.invoice_number}","${invoice.invoice_date}","${invoice.buyer_name}","${invoice.buyer_gstin || ''}","${lineItemsJson}",${invoice.subtotal},${invoice.gst_amount},${invoice.total},"${user.email}"`
      );
    }

    const csv = csvRows.join('\n');
    const filename = `invoices-${business.name.replace(/[^a-z0-9]/gi, '_')}-${periodStart || 'all'}-${periodEnd || 'all'}.csv`;

    // Log export event
    console.log('[Export Event]', {
      user_id: user.id,
      business_id: businessId,
      export_type: 'invoices_csv',
      timestamp: new Date().toISOString(),
      record_count: invoices.length
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
