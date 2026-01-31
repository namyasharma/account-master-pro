import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: { method: string; headers: { get: (arg0: string) => any; }; url: string | URL; }) => {
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
    const invoiceId = url.searchParams.get('invoice_id');

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: 'invoice_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch invoice with business details
    const { data: invoice } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        businesses:business_id (name, gstin, address, phone, email)
      `)
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check access
    const { data: business } = await supabaseClient
      .from('businesses')
      .select('owner_id')
      .eq('id', invoice.business_id)
      .single();

    if (!business || business.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch line items
    const { data: lineItems } = await supabaseClient
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoice.id);

    // Generate HTML invoice
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .company { font-size: 24px; font-weight: bold; }
    .invoice-details { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #4CAF50; color: white; }
    .totals { text-align: right; margin-top: 20px; }
    .total-row { font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">${invoice.businesses.name}</div>
    <div>GSTIN: ${invoice.businesses.gstin || 'N/A'}</div>
    <div>${invoice.businesses.address || ''}</div>
    <div>${invoice.businesses.phone || ''} | ${invoice.businesses.email || ''}</div>
  </div>
  
  <h2>TAX INVOICE</h2>
  
  <div class="invoice-details">
    <div><strong>Invoice Number:</strong> ${invoice.invoice_number}</div>
    <div><strong>Invoice Date:</strong> ${invoice.invoice_date}</div>
    <div><strong>Buyer:</strong> ${invoice.buyer_name}</div>
    <div><strong>Buyer GSTIN:</strong> ${invoice.buyer_gstin || 'N/A'}</div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>GST Rate</th>
        <th>GST Amount</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${(lineItems || []).map((item: { description: any; quantity: any; unit_price: number; gst_rate: any; gst_amount: number; line_total: number; }) => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>₹${item.unit_price.toFixed(2)}</td>
          <td>${item.gst_rate}%</td>
          <td>₹${item.gst_amount.toFixed(2)}</td>
          <td>₹${item.line_total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div>Subtotal: ₹${invoice.subtotal.toFixed(2)}</div>
    <div>GST: ₹${invoice.gst_amount.toFixed(2)}</div>
    <div class="total-row">Total: ₹${invoice.total.toFixed(2)}</div>
  </div>
</body>
</html>
    `;

    // Log export event
    console.log('[Export Event]', {
      user_id: user.id,
      business_id: invoice.business_id,
      export_type: 'invoice_pdf',
      invoice_id: invoiceId,
      timestamp: new Date().toISOString()
    });

    // Return HTML (client can use print or html2pdf)
    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
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
