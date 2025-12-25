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
    const invoiceId = url.searchParams.get('invoice_id');

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: 'invoice_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    const { data: lineItems } = await supabaseClient
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoice.id);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${invoice.invoice_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    
    .invoice-container {
      border: 2px solid #2c3e50;
      padding: 0;
    }
    
    .invoice-header {
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .invoice-title {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 5px;
    }
    
    .invoice-subtitle {
      font-size: 14px;
      opacity: 0.9;
      letter-spacing: 1px;
    }
    
    .content-section {
      padding: 30px;
    }
    
    .business-info {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #ecf0f1;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 10px;
    }
    
    .info-row {
      display: flex;
      gap: 10px;
      margin: 5px 0;
      font-size: 14px;
      color: #555;
    }
    
    .info-label {
      font-weight: 600;
      min-width: 80px;
    }
    
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #ecf0f1;
    }
    
    .column-header {
      font-size: 16px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3498db;
    }
    
    .detail-row {
      margin: 8px 0;
      font-size: 14px;
    }
    
    .detail-label {
      font-weight: 600;
      color: #555;
      display: inline-block;
      min-width: 120px;
    }
    
    .detail-value {
      color: #333;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    
    thead {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
    }
    
    th {
      padding: 15px 10px;
      text-align: left;
      font-weight: 600;
      letter-spacing: 0.5px;
      border: none;
    }
    
    th:last-child,
    td:last-child {
      text-align: right;
    }
    
    tbody tr {
      border-bottom: 1px solid #ecf0f1;
    }
    
    tbody tr:hover {
      background-color: #f8f9fa;
    }
    
    td {
      padding: 12px 10px;
      color: #555;
    }
    
    .item-description {
      font-weight: 500;
      color: #2c3e50;
    }
    
    .totals-section {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }
    
    .totals-box {
      min-width: 350px;
      border: 2px solid #ecf0f1;
      border-radius: 4px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid #ecf0f1;
    }
    
    .total-row:last-child {
      border-bottom: none;
    }
    
    .total-label {
      font-weight: 600;
      color: #555;
    }
    
    .total-value {
      font-weight: 600;
      color: #2c3e50;
    }
    
    .grand-total {
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      color: white;
      font-size: 18px;
      font-weight: 700;
    }
    
    .grand-total .total-label,
    .grand-total .total-value {
      color: white;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ecf0f1;
      text-align: center;
      font-size: 12px;
      color: #7f8c8d;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .invoice-container {
        border: none;
      }
      
      tbody tr:hover {
        background-color: transparent;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div class="invoice-title">TAX INVOICE</div>
      <div class="invoice-subtitle">GST Compliant Invoice</div>
    </div>
    
    <div class="content-section">
      <div class="business-info">
        <div class="company-name">${invoice.businesses.name}</div>
        ${invoice.businesses.address ? `<div class="info-row"><span class="info-label">Address:</span> ${invoice.businesses.address}</div>` : ''}
        ${invoice.businesses.gstin ? `<div class="info-row"><span class="info-label">GSTIN:</span> ${invoice.businesses.gstin}</div>` : ''}
        ${invoice.businesses.phone ? `<div class="info-row"><span class="info-label">Phone:</span> ${invoice.businesses.phone}</div>` : ''}
        ${invoice.businesses.email ? `<div class="info-row"><span class="info-label">Email:</span> ${invoice.businesses.email}</div>` : ''}
      </div>
      
      <div class="two-column">
        <div>
          <div class="column-header">Invoice Details</div>
          <div class="detail-row">
            <span class="detail-label">Invoice Number:</span>
            <span class="detail-value">${invoice.invoice_number}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Invoice Date:</span>
            <span class="detail-value">${new Date(invoice.invoice_date).toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}</span>
          </div>
        </div>
        
        <div>
          <div class="column-header">Bill To</div>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${invoice.buyer_name}</span>
          </div>
          ${invoice.buyer_gstin ? `
          <div class="detail-row">
            <span class="detail-label">GSTIN:</span>
            <span class="detail-value">${invoice.buyer_gstin}</span>
          </div>` : ''}
          ${invoice.buyer_address ? `
          <div class="detail-row">
            <span class="detail-label">Address:</span>
            <span class="detail-value">${invoice.buyer_address}</span>
          </div>` : ''}
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 35%">Description</th>
            <th style="width: 10%">Qty</th>
            <th style="width: 12%">Rate</th>
            <th style="width: 12%">Amount</th>
            <th style="width: 10%">GST %</th>
            <th style="width: 12%">GST Amt</th>
            <th style="width: 14%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(lineItems || []).map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td class="item-description">${item.description || '-'}</td>
              <td>${Number(item.quantity).toFixed(2)}</td>
              <td>₹${Number(item.unit_price).toFixed(2)}</td>
              <td>₹${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
              <td>${Number(item.gst_rate).toFixed(2)}%</td>
              <td>₹${Number(item.gst_amount).toFixed(2)}</td>
              <td>₹${Number(item.line_total).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals-section">
        <div class="totals-box">
          <div class="total-row">
            <span class="total-label">Subtotal</span>
            <span class="total-value">₹${Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span class="total-label">GST Amount</span>
            <span class="total-value">₹${Number(invoice.gst_amount).toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span class="total-label">Grand Total</span>
            <span class="total-value">₹${Number(invoice.total).toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>This is a computer-generated invoice and does not require a signature.</p>
        <p>Thank you for your business!</p>
      </div>
    </div>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
    `;

    console.log('[Export Event]', {
      user_id: user.id,
      business_id: invoice.business_id,
      export_type: 'invoice_pdf',
      invoice_id: invoiceId,
      timestamp: new Date().toISOString()
    });

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