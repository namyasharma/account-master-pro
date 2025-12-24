import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HsnRecord {
  hsn_code: string
  description: string
  gst_rate: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authentication check - require admin role
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await authClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || userRole?.role !== 'admin') {
      console.error('Authorization failed: User does not have admin role')
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Admin authentication successful, starting HSN data sync from Razorpay dataset...')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch CSV from Razorpay GitHub
    const csvUrl = 'https://raw.githubusercontent.com/razorpay/razorpay-tax-data/master/data/gst_hsn_sac_master.csv'
    const response = await fetch(csvUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`)
    }

    const csvText = await response.text()
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    console.log('CSV Headers:', headers)

    const records: HsnRecord[] = []

    // Parse CSV rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      
      // The CSV has columns: HSN/SAC Code, Description, and various GST rate columns
      // We'll use the first GST rate column that has a value
      const hsnCode = values[0]
      const description = values[1] || ''
      
      // Try to find GST rate from various columns (CGST, SGST, IGST, Rate, etc.)
      let gstRate = 0
      for (let j = 2; j < values.length; j++) {
        const value = parseFloat(values[j])
        if (!isNaN(value) && value > 0) {
          // For CGST/SGST, we need to double it to get total GST
          // Assuming IGST column gives us the total rate directly
          gstRate = value
          break
        }
      }
      
      if (hsnCode && hsnCode.length > 0) {
        records.push({
          hsn_code: hsnCode,
          description: description,
          gst_rate: gstRate
        })
    }
    }

    console.log(`Parsed ${records.length} HSN records`)

    const batchSize = 100
    let upsertedCount = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      const { error } = await supabaseClient
        .from('hsn_code')
        .upsert(
          batch.map(record => ({
            hsn_code: record.hsn_code,
            description: record.description,
            gst_rate: record.gst_rate,
            updated_at: new Date().toISOString()
          })),
          { 
            onConflict: 'hsn_code',
            ignoreDuplicates: false 
          }
      )

      if (error) {
        console.error(`Error upserting batch ${i / batchSize + 1}:`, error)
        throw error
    }

      upsertedCount += batch.length
      console.log(`Upserted batch ${i / batchSize + 1}: ${batch.length} records (${upsertedCount}/${records.length})`)
    }

    console.log(`Successfully synced ${upsertedCount} HSN codes`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${upsertedCount} HSN codes`,
        recordsProcessed: records.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in sync-hsn-data function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})