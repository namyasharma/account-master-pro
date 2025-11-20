import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authenticate the request - admin only
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await authClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin authentication successful for user:', user.id);

    // Initialize Supabase client with service role key for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting backfill of suppliers and customers...');

    // Fetch all businesses
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id');

    if (businessError) throw businessError;

    let suppliersCreated = 0;
    let customersCreated = 0;
    let purchasesUpdated = 0;
    let invoicesUpdated = 0;

    for (const business of businesses || []) {
      console.log(`Processing business ${business.id}`);

      // Process suppliers from purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchase_entries')
        .select('id, supplier_name, supplier_gstin')
        .eq('business_id', business.id)
        .is('supplier_id', null)
        .not('supplier_name', 'is', null)
        .neq('supplier_name', '');

      if (purchasesError) {
        console.error(`Error fetching purchases for business ${business.id}:`, purchasesError);
        continue;
      }

      // Group by unique supplier names
      const uniqueSuppliers = new Map();
      for (const purchase of purchases || []) {
        const name = purchase.supplier_name.trim();
        if (name && !uniqueSuppliers.has(name)) {
          uniqueSuppliers.set(name, {
            name,
            gstin: purchase.supplier_gstin,
          });
        }
      }

      // Create suppliers
      for (const [name, data] of uniqueSuppliers) {
        const { data: existingSupplier } = await supabase
          .from('suppliers')
          .select('id')
          .eq('business_id', business.id)
          .eq('name', name)
          .maybeSingle();

        let supplierId;

        if (!existingSupplier) {
          const { data: newSupplier, error: supplierError } = await supabase
            .from('suppliers')
            .insert({
              business_id: business.id,
              name: data.name,
              gstin: data.gstin,
            })
            .select('id')
            .single();

          if (supplierError) {
            console.error(`Error creating supplier ${name}:`, supplierError);
            continue;
          }

          supplierId = newSupplier.id;
          suppliersCreated++;
          console.log(`Created supplier: ${name}`);
        } else {
          supplierId = existingSupplier.id;
        }

        // Update purchases with supplier_id
        const { error: updateError } = await supabase
          .from('purchase_entries')
          .update({ supplier_id: supplierId })
          .eq('business_id', business.id)
          .eq('supplier_name', name)
          .is('supplier_id', null);

        if (updateError) {
          console.error(`Error updating purchases for supplier ${name}:`, updateError);
        } else {
          purchasesUpdated++;
        }
      }

      // Process customers from invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, buyer_name, buyer_gstin')
        .eq('business_id', business.id)
        .is('customer_id', null)
        .not('buyer_name', 'is', null)
        .neq('buyer_name', '');

      if (invoicesError) {
        console.error(`Error fetching invoices for business ${business.id}:`, invoicesError);
        continue;
      }

      // Group by unique customer names
      const uniqueCustomers = new Map();
      for (const invoice of invoices || []) {
        const name = invoice.buyer_name.trim();
        if (name && !uniqueCustomers.has(name)) {
          uniqueCustomers.set(name, {
            name,
            gstin: invoice.buyer_gstin,
          });
        }
      }

      // Create customers
      for (const [name, data] of uniqueCustomers) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('business_id', business.id)
          .eq('name', name)
          .maybeSingle();

        let customerId;

        if (!existingCustomer) {
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              business_id: business.id,
              name: data.name,
              gstin: data.gstin,
            })
            .select('id')
            .single();

          if (customerError) {
            console.error(`Error creating customer ${name}:`, customerError);
            continue;
          }

          customerId = newCustomer.id;
          customersCreated++;
          console.log(`Created customer: ${name}`);
        } else {
          customerId = existingCustomer.id;
        }

        // Update invoices with customer_id
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ customer_id: customerId })
          .eq('business_id', business.id)
          .eq('buyer_name', name)
          .is('customer_id', null);

        if (updateError) {
          console.error(`Error updating invoices for customer ${name}:`, updateError);
        } else {
          invoicesUpdated++;
        }
      }
    }

    const result = {
      success: true,
      suppliersCreated,
      customersCreated,
      purchasesUpdated,
      invoicesUpdated,
    };

    console.log('Backfill completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Backfill error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
