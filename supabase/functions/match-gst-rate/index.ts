// edge-function.ts
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Initialize Supabase client with service role key (server-side only)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const { itemName } = await req.json();
    if (!itemName) {
      return new Response(JSON.stringify({ error: "Item name missing" }), { status: 400 });
    }

    // Search for the closest match using ILIKE (case-insensitive, partial match)
    const { data, error } = await supabase
      .from("hsn_code")
      .select("hsn_code, name, tax_rate")
      .ilike("name", `%${itemName}%`)  // fuzzy match
      .limit(1); // return only top match

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ message: "No match found" }), { status: 404 });
    }

    // Return the matched item and tax rate
    return new Response(JSON.stringify({ matchedItem: data[0] }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
