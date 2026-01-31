/**
 * HSN/SAC Classification Loader
 * Loads ONLY classification data from tutorial.gst.gov Excel
 * NO TAX RATES - This is just the dictionary
 * 
 * Run once: ts-node load-hsn-sac.ts
 */
import 'dotenv/config';
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as https from 'https';
import * as fs from 'fs';
import * as crypto from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const OFFICIAL_URL = 'https://tutorial.gst.gov.in/downloads/HSN_SAC.xlsx';
const LOCAL_FILE = './HSN_SAC.xlsx';

// interface ClassificationRecord {
//   code: string;
//   type: 'HSN' | 'SAC';
//   description: string;
//   code_length: number;
//   is_active: boolean;
//   introduced_on?: string;
//   parent_code?: string;
// }

// ============================================
// Step 1: Download Excel from Government
// ============================================

async function downloadExcel() {
  if (fs.existsSync(LOCAL_FILE)) {
    console.log('📁 Using existing HSN_SAC.xlsx');
    return;
  }

  console.log('📥 Downloading from tutorial.gst.gov...');

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(LOCAL_FILE);

    https.get(OFFICIAL_URL, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ Downloaded successfully');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(LOCAL_FILE, () => { });
      reject(err);
    });
  });
}

// ============================================
// Step 2: Parse Excel - Preserve Government Wording
// ============================================

function parseExcel() {
  console.log('📖 Reading Excel file...');

  const workbook = XLSX.readFile(LOCAL_FILE);
  const records = [];

  // Process HSN sheet (if exists)
  const hsnSheet = workbook.SheetNames.find(name =>
    name.toUpperCase().includes('HSN') || name === 'HSN_MSTR'
  );

  if (hsnSheet) {
    console.log(`📊 Processing HSN sheet: ${hsnSheet}`);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[hsnSheet]);
    console.log('First 3 rows from HSN sheet:', XLSX.utils.sheet_to_json(workbook.Sheets[hsnSheet]).slice(0, 3));

    data.forEach((row) => {
      const code = String(row['HSN_CD'] || '').trim();
      const description = String(row['HSN_Description'] || '').trim();

      if (code && description && /^\d+$/.test(code)) {
        records.push({
          code: code,
          type: 'HSN',
          description: description,
          code_length: code.length,
          is_active: true,
          parent_code: code.length > 4 ? code.substring(0, 4) : undefined
        });
      }
    });

    console.log(`✅ Parsed ${records.length} HSN codes`);
  }

  // Process SAC sheet (if exists)
  const sacSheet = workbook.SheetNames.find(name =>
    name.toUpperCase().includes('SAC') || name === 'SAC_MSTR'
  );

  if (sacSheet) {
    console.log(`📊 Processing SAC sheet: ${sacSheet}`);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sacSheet]);
    console.log('First 3 rows from SAC sheet:', XLSX.utils.sheet_to_json(workbook.Sheets[sacSheet]).slice(0, 3));

    data.forEach((row) => {
      const code = String(row['SAC_CD'] || '').trim();
      const description = String(row['SAC_Description'] || '').trim();

      if (code && description && /^\d+$/.test(code)) {
        records.push({
          code: code,
          type: 'SAC',
          description: description,
          code_length: code.length,
          is_active: true,
          parent_code: code.length > 4 ? code.substring(0, 4) : undefined
        });
      }
    });

    console.log(`✅ Parsed ${records.filter(r => r.type === 'SAC').length} SAC codes`);
  }

  if (records.length === 0) {
    console.error('❌ No valid data found!');
    console.log('Available sheets:', workbook.SheetNames);
    console.log('Check the Excel structure and adjust column names.');
    throw new Error('Failed to parse any records');
  }

  return records;
}

// ============================================
// Step 3: Validate Data
// ============================================

function validateRecords(records) {
  console.log('\n🔍 Validating data...');

  // Check for sentinel codes (known good codes)
  const sentinels = {
    '0101': 'Live horses',
    '999111': 'Educational services'
  };

  let validationPassed = true;

  for (const [code, expectedDesc] of Object.entries(sentinels)) {
    const found = records.find(r => r.code === code);
    if (found) {
      console.log(`✅ Sentinel ${code} found: ${found.description.substring(0, 50)}...`);
    } else {
      console.log(`⚠️  Sentinel ${code} not found (expected: ${expectedDesc})`);
      validationPassed = false;
    }
  }

  // Check for reasonable distribution
  const hsnCount = records.filter(r => r.type === 'HSN').length;
  const sacCount = records.filter(r => r.type === 'SAC').length;

  console.log(`\n📊 Data Distribution:`);
  console.log(`   HSN codes: ${hsnCount}`);
  console.log(`   SAC codes: ${sacCount}`);
  console.log(`   Total: ${records.length}`);

  if (hsnCount < 100) {
    console.log(`⚠️  HSN count seems low (expected 1000+)`);
    validationPassed = false;
  }

  if (sacCount < 50) {
    console.log(`⚠️  SAC count seems low (expected 100+)`);
    validationPassed = false;
  }

  // Check for duplicates
  const codes = records.map(r => r.code);
  const uniqueCodes = new Set(codes);
  if (codes.length !== uniqueCodes.size) {
    console.log(`⚠️  Found ${codes.length - uniqueCodes.size} duplicate codes`);
    validationPassed = false;
  } else {
    console.log(`✅ No duplicates found`);
  }

  return validationPassed;
}

// ============================================
// Step 4: Idempotent Insert/Update (Optimized Batch Upsert)
// ============================================

async function upsertRecords(records) {
  console.log('\n💾 Upserting to Supabase (batch mode)...');
  console.log('This is idempotent - safe to run multiple times\n');

  const batchSize = 500;
  let totalInserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(records.length / batchSize);

    console.log(`Processing batch ${batchNum}/${totalBatches}...`);

    // Use Supabase upsert with onConflict='code' to update existing rows
    const { error } = await supabase
      .from('hsn_sac')
      .upsert(batch.map(r => ({
        ...r,
        code: r.code.trim(),
        description: r.description.trim(),
        type: r.type,
        code_length: r.code_length,
        is_active: r.is_active,
        parent_code: r.parent_code
      })), { onConflict: 'code' });

    if (error) {
      console.error(`  ❌ Error in batch ${batchNum}: ${error.message}`);
    } else {
      totalInserted += batch.length;
      console.log(`  ✅ Batch ${batchNum} inserted/updated ${batch.length} records`);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('✅ Upsert complete!');
  console.log(`📊 Total processed: ${totalInserted} records`);
}


// ============================================
// Step 5: Post-Import Verification
// ============================================

async function verifyImport() {
  console.log('\n🔍 Verifying import in database...');

  // Count total
  const { count, error } = await supabase
    .from('hsn_sac')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Verification failed:', error.message);
    return;
  }

  console.log(`✅ Total codes in database: ${count}`);

  // Test searches
  const tests = [
    { code: '0101', expected: 'horse' },
    { code: '1001', expected: 'wheat' },
    { code: '999111', expected: 'educational' }
  ];

  console.log('\n🧪 Testing searches:');
  for (const test of tests) {
    const { data } = await supabase
      .from('hsn_sac')
      .select('code, description')
      .eq('code', test.code)
      .single();

    if (data) {
      const match = data.description.toLowerCase().includes(test.expected);
      console.log(`  ${match ? '✅' : '⚠️ '} ${test.code}: ${data.description.substring(0, 60)}...`);
    } else {
      console.log(`  ❌ ${test.code}: Not found`);
    }
  }
}

// ============================================
// Main Execution
// ============================================

async function main() {
  console.log('🚀 HSN/SAC Classification Loader');
  console.log('═══════════════════════════════════════\n');
  console.log('📌 Remember: This loads ONLY classification data');
  console.log('📌 NO TAX RATES - Those come from notifications\n');

  try {
    // Step 1: Download
    await downloadExcel();

    // Step 2: Parse
    const records = parseExcel();

    // Step 3: Validate
    const isValid = validateRecords(records);
    if (!isValid) {
      console.log('\n Validation warnings detected.');
      console.log('Continue anyway? (Ctrl+C to cancel, wait 5s to continue)');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Step 4: Upsert
    await upsertRecords(records);

    // Step 5: Verify
    await verifyImport();

    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Classification data loaded successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\nNext steps:');
    console.log('1. Build the notification watchdog');
    console.log('2. Build the PDF parser');
    console.log('3. Never touch this table again (unless govt changes classification)\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

main();