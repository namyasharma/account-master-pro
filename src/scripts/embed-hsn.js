import { createClient } from '@supabase/supabase-js'
import { pipeline } from '@xenova/transformers'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

const BATCH_SIZE = 100
const run = async () => {
  console.log('Loading embedding model...')
  const extractor = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  )
  console.log('Model loaded!')

  // Get total count
  const { count } = await supabase
    .from('hsn_code')
    .select('*', { count: 'exact', head: true })
    .is('embedding', null)

  console.log(`Found ${count} rows to process`)

  let processed = 0

  while (processed < count) {
    // Fetch batch
    const { data: rows, error } = await supabase
      .from('hsn_code')
      .select('id, hsn_code, name')
      .is('embedding', null)
      .limit(BATCH_SIZE)

    if (error) {
      console.error('Fetch error:', error)
      process.exit(1)
    }

    if (!rows || rows.length === 0) break

    // Process batch
    const updates = []
    for (const row of rows) {
      const text = `${row.hsn_code} ${row.name}`
      const output = await extractor(text, { pooling: 'mean', normalize: true })
      const embedding = Array.from(output.data)
      updates.push({ id: row.id, embedding })
    }

    // Update all at once
    for (const update of updates) {
      console.log(`Embedding dimensions: ${update.embedding.length}`)

      const { error: updateError } = await supabase
        .from('hsn_code')
        .update({ embedding: update.embedding })
        .eq('id', update.id)

      if (updateError) {
        console.error(`Error updating ${update.id}:`, updateError)
        console.error(`Embedding sample:`, update.embedding.slice(0, 5))
        console.error(`Embedding length:`, update.embedding.length)
      }
    }

    processed += rows.length
    console.log(`Progress: ${processed}/${count} (${((processed / count) * 100).toFixed(1)}%)`)
  }

  console.log('Done! All embeddings generated.')
}

run().catch(console.error)