import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Get HSN code for a specific GST rate
const getHSNForRate = (lineItems: any[], rate: number): string => {
  const item = lineItems.find((item) => Number(item.gst_rate) === rate);
  return item?.hsn_sac_code || "";
};

serve(async (req) => {
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
    const businessId = url.searchParams.get("business_id");
    const month = url.searchParams.get("month"); // YYYY-MM format
    const year = url.searchParams.get("year"); // YYYY format

    if (!businessId) {
      return new Response(
        JSON.stringify({ error: "business_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check access
    const { data: business } = await supabaseClient
      .from("businesses")
      .select("owner_id, name, gstin")
      .eq("id", businessId)
      .single();

    if (!business || business.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build date filter
    let query = supabaseClient
      .from("invoices")
      .select(
        `
        *,
        invoice_line_items(*)
      `,
      )
      .eq("business_id", businessId);

    if (month && year) {
      // Ensure month is 2 digits
      const monthStr = month.padStart(2, "0");
      const startDate = `${year}-${monthStr}-01`;

      // Get last day of the month correctly
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, "0")}`;

      console.log("Date filter:", { startDate, endDate }); // Debug log

      query = query.gte("invoice_date", startDate).lte("invoice_date", endDate);
    } else if (year) {
      query = query
        .gte("invoice_date", `${year}-01-01`)
        .lte("invoice_date", `${year}-12-31`);
    }
    const { data: invoices, error } = await query.order("invoice_date");

    if (error) throw error;

    // Generate CSV for B2B invoices
    const b2bInvoices = invoices?.filter((inv) => inv.buyer_gstin) || [];

    const csvRows = [];

    // Header
    csvRows.push(
      [
        "GSTIN of Recipient",
        "Receiver Name",
        "Invoice Number",
        "Invoice Date",
        "Invoice Value",
        "Place Of Supply",
        "Reverse Charge",
        "Invoice Type",
        "E-Commerce GSTIN",
        "Rate",
        "Taxable Value",
        "Integrated Tax Amount",
        "Central Tax Amount",
        "State/UT Tax Amount",
        "Cess Amount",
        "HSN",
      ].join(","),
    );

    // Data rows - one row per GST rate per invoice
    for (const invoice of b2bInvoices) {
      const lineItems = invoice.invoice_line_items || [];

      // Group line items by GST rate AND HSN code
      const rateHsnGroups: Record<
        string,
        { taxable: number; gst: number; hsn: string }
      > = {};

      lineItems.forEach((item: any) => {
        const rate = Number(item.gst_rate);
        const hsn = item.hsn_sac_code || "";
        const key = `${rate}-${hsn}`; // Combine rate + HSN as unique key

        if (!rateHsnGroups[key]) {
          rateHsnGroups[key] = { taxable: 0, gst: 0, hsn };
        }
        rateHsnGroups[key].taxable += Number(item.line_total);
        rateHsnGroups[key].gst += Number(item.gst_amount);
      });

      Object.entries(rateHsnGroups).forEach(([key, values]) => {
        const rate = parseFloat(key.split("-")[0]);
        const isInterstate = Number(invoice.igst_amount) > 0;
        const igst = isInterstate ? values.gst : 0;
        const cgst = isInterstate ? 0 : values.gst / 2;
        const sgst = isInterstate ? 0 : values.gst / 2;

        const invoiceDate = new Date(invoice.invoice_date);
        const formattedDate = `${invoiceDate.getDate().toString().padStart(2, "0")}-${(invoiceDate.getMonth() + 1).toString().padStart(2, "0")}-${invoiceDate.getFullYear()}`;

        csvRows.push(
          [
            invoice.buyer_gstin, // GSTIN of Recipient
            `"${invoice.buyer_name}"`, // Receiver Name
            invoice.invoice_number, // Invoice Number
            formattedDate, // Invoice Date
            (values.taxable + values.gst).toFixed(2), // Invoice Value
            invoice.place_of_supply || "", // Place Of Supply
            "N", // Reverse Charge
            "Regular", // Invoice Type
            "", // E-Commerce GSTIN
            rate, // Rate
            values.taxable.toFixed(2), // Taxable Value
            igst.toFixed(2), // Integrated Tax Amount
            cgst.toFixed(2), // Central Tax Amount
            sgst.toFixed(2), // State/UT Tax Amount
            "0.00", // Cess Amount
            values.hsn, // HSN
          ].join(","),
        );
      });
    }

    const csv = csvRows.join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="GSTR1_B2B_${business.name}_${month || year}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
