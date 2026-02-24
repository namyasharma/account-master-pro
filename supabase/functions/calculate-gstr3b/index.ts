import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Invoice {
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  gst_amount: number;
}

interface Purchase {
  subtotal: number;
  gst_amount: number;
}

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
      const businessId = url.searchParams.get("business_id");
      const month = url.searchParams.get("month"); // MM format (01-12)
      const year = url.searchParams.get("year"); // YYYY format

      if (!businessId || !month || !year) {
        return new Response(
          JSON.stringify({
            error: "business_id, month, and year are required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Check access
      const { data: business } = await supabaseClient
        .from("businesses")
        .select("owner_id")
        .eq("id", businessId)
        .single();

      if (!business || business.owner_id !== user.id) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate date range
      const monthStr = month.padStart(2, "0");
      const startDate = `${year}-${monthStr}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, "0")}`;

      // Fetch all invoices (sales) for the month
      const { data: invoices, error: invoicesError } = await supabaseClient
        .from<Invoice>("invoices")
        .select("subtotal, cgst_amount, sgst_amount, igst_amount, gst_amount")
        .eq("business_id", businessId)
        .gte("invoice_date", startDate)
        .lte("invoice_date", endDate);

      if (invoicesError) throw invoicesError;

      // Fetch all purchases for the month
      const { data: purchases, error: purchasesError } = await supabaseClient
        .from<Purchase>("purchase_entries")
        .select("subtotal, gst_amount")
        .eq("business_id", businessId)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate);

      if (purchasesError) throw purchasesError;

      // Calculate output tax (from sales/invoices)
      const outputTax = {
        taxableValue:
          invoices?.reduce(
            (sum: number, inv: Invoice) => sum + Number(inv.subtotal),
            0,
          ) || 0,
        cgst:
          invoices?.reduce(
            (sum: number, inv: Invoice) => sum + Number(inv.cgst_amount),
            0,
          ) || 0,
        sgst:
          invoices?.reduce(
            (sum: number, inv: Invoice) => sum + Number(inv.sgst_amount),
            0,
          ) || 0,
        igst:
          invoices?.reduce(
            (sum: number, inv: Invoice) => sum + Number(inv.igst_amount),
            0,
          ) || 0,
        totalTax:
          invoices?.reduce(
            (sum: number, inv: Invoice) => sum + Number(inv.gst_amount),
            0,
          ) || 0,
      };

      // Calculate input tax (from purchases)
      const inputTax = {
        taxableValue:
          purchases?.reduce(
            (sum: number, pur: Purchase) => sum + Number(pur.subtotal),
            0,
          ) || 0,
        totalGST:
          purchases?.reduce(
            (sum: number, pur: Purchase) => sum + Number(pur.gst_amount),
            0,
          ) || 0,
      };

      // Calculate net liability
      const netLiability = outputTax.totalTax - inputTax.totalGST;

      // Prepare response
      const summary = {
        period: {
          month: parseInt(month),
          year: parseInt(year),
          startDate,
          endDate,
        },
        outwardSupplies: {
          taxableValue: outputTax.taxableValue.toFixed(2),
          cgst: outputTax.cgst.toFixed(2),
          sgst: outputTax.sgst.toFixed(2),
          igst: outputTax.igst.toFixed(2),
          totalOutputTax: outputTax.totalTax.toFixed(2),
          invoiceCount: invoices?.length || 0,
        },
        inwardSupplies: {
          taxableValue: inputTax.taxableValue.toFixed(2),
          totalInputTax: inputTax.totalGST.toFixed(2),
          purchaseCount: purchases?.length || 0,
        },
        netTaxLiability: {
          outputTax: outputTax.totalTax.toFixed(2),
          inputTax: inputTax.totalGST.toFixed(2),
          netPayable: netLiability.toFixed(2),
          status: netLiability >= 0 ? "payable" : "refundable",
        },
      };

      return new Response(JSON.stringify(summary), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("GSTR-3B calculation error:", error);
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
);
