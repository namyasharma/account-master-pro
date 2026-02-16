import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STATE_NAMES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",
  "26": "Dadra and Nagar Haveli",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
  "99": "Centre Jurisdiction",
};

serve(
  async (req: {
    method: string;
    headers: { get: (arg0: string) => any };
    url: string | URL;
  }) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: { Authorization: req.headers.get("Authorization")! },
          },
        },
      );

      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = new URL(req.url);
      const invoiceId = url.searchParams.get("invoice_id");

      if (!invoiceId) {
        return new Response(
          JSON.stringify({ error: "invoice_id is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { data: invoice } = await supabaseClient
        .from("invoices")
        .select(
          `*, businesses:business_id (name, gstin, address, phone, email, state_code)`,
        )
        .eq("id", invoiceId)
        .single();

      if (!invoice) {
        return new Response(JSON.stringify({ error: "Invoice not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: business } = await supabaseClient
        .from("businesses")
        .select("owner_id")
        .eq("id", invoice.business_id)
        .single();

      if (!business || business.owner_id !== user.id) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: lineItems } = await supabaseClient
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", invoice.id);

      // Determine if interstate or intrastate
      const isInterstate = invoice.igst_amount > 0;
      const placeOfSupplyName =
        STATE_NAMES[invoice.place_of_supply] ||
        invoice.place_of_supply ||
        "N/A";
      const sellerStateName = STATE_NAMES[invoice.businesses.state_code] || "";

      // Format date nicely
      const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        },
      );

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 12px; 
      color: #1a1a1a;
      background: #fff;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      border: 2px solid #1a1a1a;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 2px solid #1a1a1a;
      margin-bottom: 16px;
    }
    .company-name {
      font-size: 22px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .company-details { 
      color: #444; 
      line-height: 1.6;
      font-size: 11px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 20px;
      font-weight: bold;
      color: #1a1a1a;
      letter-spacing: 2px;
    }
    .invoice-title .original-copy {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }

    /* Invoice Meta */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .meta-box {
      border: 1px solid #ddd;
      padding: 10px 12px;
      border-radius: 4px;
    }
    .meta-box h3 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #eee;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .meta-label { color: #666; }
    .meta-value { font-weight: 600; text-align: right; }

    /* Buyer / Seller boxes */
    .party-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .party-box {
      border: 1px solid #ddd;
      padding: 10px 12px;
      border-radius: 4px;
    }
    .party-box h3 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #eee;
    }
    .party-name {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .party-detail {
      color: #444;
      line-height: 1.6;
      font-size: 11px;
    }
    .gstin-badge {
      display: inline-block;
      background: #f0f7ff;
      border: 1px solid #c0d8f0;
      color: #1a5a9a;
      font-family: monospace;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      margin-top: 4px;
    }

    /* Supply type badge */
    .supply-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .supply-interstate {
      background: #fff3e0;
      color: #e65100;
      border: 1px solid #ffcc80;
    }
    .supply-intrastate {
      background: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #a5d6a7;
    }

    /* Line Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11px;
    }
    .items-table th {
      background: #1a1a1a;
      color: white;
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .items-table th.right { text-align: right; }
    .items-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    .items-table td.right { text-align: right; }
    .items-table tbody tr:nth-child(even) { background: #f9f9f9; }
    .items-table tbody tr:last-child td { border-bottom: 2px solid #1a1a1a; }
    .hsn-code {
      font-family: monospace;
      font-size: 10px;
      color: #666;
      display: block;
      margin-top: 2px;
    }

    /* Totals */
    .bottom-section {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 16px;
      margin-bottom: 16px;
    }
    .amount-words {
      border: 1px solid #ddd;
      padding: 10px 12px;
      border-radius: 4px;
      align-self: start;
    }
    .amount-words h3 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 6px;
    }
    .amount-words p {
      font-weight: 600;
      font-size: 12px;
      text-transform: capitalize;
    }
    .totals-box {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      border-bottom: 1px solid #eee;
      font-size: 11px;
    }
    .totals-row:last-child { border-bottom: none; }
    .totals-row.subtotal { color: #444; }
    .totals-row.gst { color: #444; }
    .totals-row.total {
      background: #1a1a1a;
      color: white;
      font-weight: bold;
      font-size: 13px;
      padding: 10px 12px;
    }
    .totals-label { }
    .totals-value { font-weight: 600; }

    /* GST Summary Table */
    .gst-summary {
      margin-bottom: 16px;
    }
    .gst-summary h3 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 6px;
    }
    .gst-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .gst-table th {
      background: #f5f5f5;
      padding: 6px 10px;
      text-align: right;
      font-size: 10px;
      color: #444;
      border: 1px solid #ddd;
    }
    .gst-table th:first-child { text-align: left; }
    .gst-table td {
      padding: 6px 10px;
      text-align: right;
      border: 1px solid #ddd;
    }
    .gst-table td:first-child { text-align: left; }

    /* Footer */
    .footer {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid #ddd;
      margin-top: 8px;
    }
    .footer-note {
      font-size: 10px;
      color: #666;
      line-height: 1.6;
    }
    .signature-box {
      text-align: right;
    }
    .signature-box .company-sig {
      font-weight: bold;
      margin-bottom: 40px;
    }
    .signature-line {
      border-top: 1px solid #1a1a1a;
      padding-top: 4px;
      font-size: 10px;
      color: #666;
    }

    @media print {
      body { margin: 0; }
      .page { border: none; padding: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div>
        <div class="company-name">${invoice.businesses.name}</div>
        <div class="company-details">
          ${invoice.businesses.gstin ? `GSTIN: <strong>${invoice.businesses.gstin}</strong>` : ""}
          ${invoice.businesses.address ? `<br>${invoice.businesses.address}` : ""}
          ${sellerStateName ? `<br>${sellerStateName}` : ""}
          ${invoice.businesses.phone ? `<br>Phone: ${invoice.businesses.phone}` : ""}
          ${invoice.businesses.email ? `<br>Email: ${invoice.businesses.email}` : ""}
        </div>
      </div>
      <div class="invoice-title">
        <h1>TAX INVOICE</h1>
        <div class="original-copy">ORIGINAL FOR RECIPIENT</div>
        <div style="margin-top: 8px;">
          <span class="supply-badge ${isInterstate ? "supply-interstate" : "supply-intrastate"}">
            ${isInterstate ? "⇄ INTERSTATE SUPPLY" : "⇅ INTRASTATE SUPPLY"}
          </span>
        </div>
      </div>
    </div>

    <!-- Invoice Meta + Party Details -->
    <div class="meta-grid">
      <div class="meta-box">
        <h3>Invoice Details</h3>
        <div class="meta-row">
          <span class="meta-label">Invoice No.</span>
          <span class="meta-value">${invoice.invoice_number}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Invoice Date</span>
          <span class="meta-value">${invoiceDate}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Place of Supply</span>
          <span class="meta-value">${invoice.place_of_supply || "N/A"} - ${placeOfSupplyName}</span>
        </div>
      </div>
      <div class="meta-box">
        <h3>Tax Details</h3>
        <div class="meta-row">
          <span class="meta-label">Tax Type</span>
          <span class="meta-value">${isInterstate ? "IGST" : "CGST + SGST"}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Taxable Amount</span>
          <span class="meta-value">₹${Number(invoice.subtotal).toFixed(2)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Total Tax</span>
          <span class="meta-value">₹${Number(invoice.gst_amount).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Buyer / Seller -->
    <div class="party-grid">
      <div class="party-box">
        <h3>Seller (Bill From)</h3>
        <div class="party-name">${invoice.businesses.name}</div>
        ${invoice.businesses.gstin ? `<div class="gstin-badge">GSTIN: ${invoice.businesses.gstin}</div>` : ""}
        <div class="party-detail" style="margin-top: 6px;">
          ${invoice.businesses.address || ""}
          ${sellerStateName ? `<br>${sellerStateName}` : ""}
        </div>
      </div>
      <div class="party-box">
        <h3>Buyer (Bill To)</h3>
        <div class="party-name">${invoice.buyer_name}</div>
        ${invoice.buyer_gstin ? `<div class="gstin-badge">GSTIN: ${invoice.buyer_gstin}</div>` : '<div style="font-size:10px;color:#999;margin-top:4px;">Unregistered Buyer (B2C)</div>'}
        <div class="party-detail" style="margin-top: 6px;">
          ${placeOfSupplyName}
        </div>
      </div>
    </div>

    <!-- Line Items -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:30px">#</th>
          <th>Description</th>
          <th>HSN/SAC</th>
          <th class="right">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Taxable Amt</th>
          <th class="right">GST%</th>
          <th class="right">GST Amt</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(lineItems || [])
          .map(
            (item: any, index: number) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.description}</td>
            <td style="font-family:monospace">${item.hsn_sac_code || "-"}</td>
            <td class="right">${item.quantity}</td>
            <td class="right">₹${Number(item.unit_price).toFixed(2)}</td>
            <td class="right">₹${Number(item.line_total).toFixed(2)}</td>
            <td class="right">${item.gst_rate}%</td>
            <td class="right">₹${Number(item.gst_amount).toFixed(2)}</td>
            <td class="right">₹${(Number(item.line_total) + Number(item.gst_amount)).toFixed(2)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>

    <!-- GST Summary Table -->
    <div class="gst-summary">
      <h3>GST Summary</h3>
      <table class="gst-table">
        <thead>
          <tr>
            <th>GST Rate</th>
            <th>Taxable Amount</th>
            ${
              isInterstate
                ? "<th>IGST Amount</th>"
                : "<th>CGST Amount</th><th>SGST Amount</th>"
            }
            <th>Total Tax</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            // Group line items by GST rate
            const grouped: Record<number, { taxable: number; gst: number }> =
              {};
            (lineItems || []).forEach((item: any) => {
              const rate = Number(item.gst_rate);
              if (!grouped[rate]) grouped[rate] = { taxable: 0, gst: 0 };
              grouped[rate].taxable += Number(item.line_total);
              grouped[rate].gst += Number(item.gst_amount);
            });
            return Object.entries(grouped)
              .map(
                ([rate, vals]) => `
              <tr>
                <td>${rate}%</td>
                <td>₹${vals.taxable.toFixed(2)}</td>
                ${
                  isInterstate
                    ? `<td>₹${vals.gst.toFixed(2)}</td>`
                    : `<td>₹${(vals.gst / 2).toFixed(2)}</td><td>₹${(vals.gst / 2).toFixed(2)}</td>`
                }
                <td>₹${vals.gst.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("");
          })()}
        </tbody>
      </table>
    </div>

    <!-- Bottom Section: Amount in Words + Totals -->
    <div class="bottom-section">
      <div class="amount-words">
        <h3>Amount in Words</h3>
        <p>₹${numberToWords(Number(invoice.total))} Only</p>
      </div>
      <div class="totals-box">
        <div class="totals-row subtotal">
          <span class="totals-label">Subtotal (Taxable)</span>
          <span class="totals-value">₹${Number(invoice.subtotal).toFixed(2)}</span>
        </div>
        ${
          isInterstate
            ? `
        <div class="totals-row gst">
          <span class="totals-label">IGST</span>
          <span class="totals-value">₹${Number(invoice.igst_amount).toFixed(2)}</span>
        </div>
        `
            : `
        <div class="totals-row gst">
          <span class="totals-label">CGST</span>
          <span class="totals-value">₹${Number(invoice.cgst_amount).toFixed(2)}</span>
        </div>
        <div class="totals-row gst">
          <span class="totals-label">SGST</span>
          <span class="totals-value">₹${Number(invoice.sgst_amount).toFixed(2)}</span>
        </div>
        `
        }
        <div class="totals-row total">
          <span class="totals-label">TOTAL</span>
          <span class="totals-value">₹${Number(invoice.total).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-note">
        <strong>Terms & Conditions:</strong><br>
        1. Goods once sold will not be taken back.<br>
        2. Interest @ 18% p.a. will be charged on delayed payments.<br>
        3. Subject to local jurisdiction.
      </div>
      <div class="signature-box">
        <div class="company-sig">For ${invoice.businesses.name}</div>
        <div class="signature-line">Authorised Signatory</div>
      </div>
    </div>

  </div>
</body>
</html>`;

      console.log("[Export Event]", {
        user_id: user.id,
        business_id: invoice.business_id,
        export_type: "invoice_pdf",
        invoice_id: invoiceId,
        timestamp: new Date().toISOString(),
      });

      return new Response(html, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    } catch (error) {
      console.error("Export error:", error);
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
);

// Simple number to words converter for Indian numbering
function numberToWords(amount: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (amount === 0) return "Zero";

  const numToWords = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000)
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + numToWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        numToWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + numToWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        numToWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + numToWords(n % 100000) : "")
      );
    return (
      numToWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + numToWords(n % 10000000) : "")
    );
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = numToWords(rupees) + " Rupees";
  if (paise > 0) result += " and " + numToWords(paise) + " Paise";
  return result;
}
