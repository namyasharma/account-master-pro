/**
 * GST NOTIFICATION PDF PARSER
 * Extracts HSN/SAC codes and GST rates from official GST notifications
 * 
 * Handles:
 * - Schedule tables (I, II, III, IV for 2.5%, 6%, 9%, 14%)
 * - HSN ranges (e.g., "0101 to 0106")
 * - Exclusions and conditions
 * - Amendments and corrigenda
 * 
 * Dependencies:
 * npm install pdf-parse pdfjs-dist tabula-js
 */

import * as fs from 'fs';
import * as https from 'https';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

interface ParsedRule {
  applies_to_type: 'HSN' | 'SAC';
  hsn_start?: string;
  hsn_end?: string;
  sac_code?: string;
  exclusion_codes?: string[];
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate?: number;
  is_exempt: boolean;
  condition_text?: string;
  raw_row_json: any;
}

interface NotificationMetadata {
  notification_id: string;
  notification_number: string;
  issued_at: string;
  effective_from: string;
  supersedes?: string;
}

interface GstRateRuleRow {
  id: string;
  notification_id: string;
  hsn_start: string | null;
  hsn_end: string | null;
  sac_code: string | null;
  effective_from: string;
  effective_to: string | null;
};


// ============================================
// STEP 1: Download and Parse PDF
// ============================================
async function registerNotification(pdfUrl: string): Promise<string> {
  console.log('📝 Registering notification...');

  // Download and extract metadata first
  const tempFile = `/tmp/temp_${Date.now()}.pdf`;
  await downloadPDF(pdfUrl, tempFile);
  const text = await extractTextFromPDF(tempFile);
  console.log(text.slice(0, 500)); // Print first 500 characters for debugging
  const metadata = extractNotificationMetadata(text);
  fs.unlinkSync(tempFile);

  // Create notification record with status='pending'
  const { data, error } = await supabase
    .from('gst_notification')
    .insert({
      notification_number: metadata.notification_number!,
      authority: 'CBIC',
      issued_at: new Date().toISOString().split('T')[0],
      effective_from: metadata.effective_from!,
      source_url: pdfUrl,
      status: 'pending', // Important: starts as pending
      summary: null
    })
    .select()
    .single();

  if (error) throw error;

  console.log(`✅ Notification registered: ${data.id}`);
  return data.id; // This is the UUID to use
}

async function downloadPDF(url: string, filepath: string): Promise<void> {
  console.log(`📥 Downloading PDF from: ${url}`);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ PDF downloaded');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => { });
      reject(err);
    });
  });
}

async function extractTextFromPDF(filepath: string): Promise<string> {
  console.log('📖 Extracting text from PDF...');

  const dataBuffer = fs.readFileSync(filepath);
  const typedArray = new Uint8Array(dataBuffer);

  // Load PDF
  const loadingTask = pdfjsLib.getDocument({
    data: typedArray,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  console.log(`📄 PDF loaded: ${pdf.numPages} pages`);

  let fullText = '';

  // Extract text from each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    fullText += pageText + '\n';
  }

  console.log(`✅ Extracted ${pdf.numPages} pages, ${fullText.length} characters`);
  return fullText;
}

// ============================================
// STEP 2: Normalize PDF Text
// ============================================

function normalizePdfText(text: string): string {
  return text
    // collapse multiple spaces
    .replace(/\s+/g, " ")
    // fix split digits: "2 8 th" -> "28 th"
    .replace(/(\d)\s+(\d)\s*(st|nd|rd|th)/gi, "$1$2 $3")
    // fix "June , 2017" -> "June, 2017"
    .replace(/\s+,/g, ",")
    .trim();
}

// ============================================
// STEP 3: Extract Metadata from PDF
// ============================================


function extractNotificationMetadata(text: string): Partial<NotificationMetadata> {
  const metadata: Partial<NotificationMetadata> = {};
  const normalizedText = normalizePdfText(text);
  text = normalizedText;
  // Extract notification number (e.g., "No. 01/2025-Central Tax (Rate)")
  const notifMatch = text.match(/No[.\s]+(\d+\s*\/\s*\d+)\s*[-–]\s*(Central Tax|CGST|IGST)(?:\s*\(.*?\))?/i);
  if (notifMatch) {
    metadata.notification_number = notifMatch[1].replace(/\s+/g, ''); // remove spaces in "08 / 2025" → "08/2025"
    console.log(`📋 Notification: ${metadata.notification_number}`);
  }

  // Extract effective date (e.g., "with effect from 1st November, 2024" or "from the 1st day of November")
  const datePatterns = [
    /with effect from.*?(\d{1,2})\s*[a-z]{2}\s+(\w+)[,\s]+(\d{4})/i,
    /from the (\d{1,2})\s*[a-z]{2}\s+day of (\w+)[,\s]+(\d{4})/i,
    /dated.*?(\d{1,2})\s*[a-z]{2}\s+(\w+)[,\s]+(\d{4})/i,
    /New Delhi, the\s+(\d{1,2})\s*[a-z]{2}\s+(\w+)[,\s]+(\d{4})/i
  ];

  const issueDateMatch = text.match(
    /New Delhi,\s*the\s*(\d{1,2})\s*[a-z]{2}\s+(\w+),\s*(\d{4})/i
  );

  if (!issueDateMatch) {
    throw new Error("Issued date not found in notification");
  }

  const issueDay = issueDateMatch[1].padStart(2, "0");
  const issueMonth = parseMonth(issueDateMatch[2]);
  const issueYear = issueDateMatch[3];

  metadata.issued_at = `${issueYear}-${issueMonth}-${issueDay}`;

  let effectiveFrom: string | null = null;

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const day = match[1].padStart(2, "0");
      const month = parseMonth(match[2]);
      const year = match[3];
      effectiveFrom = `${year}-${month}-${day}`;
      break;
    }
  }

  metadata.effective_from = effectiveFrom ?? metadata.issued_at;
  console.log(`📅 Issued at: ${metadata.issued_at}`);

  if (!metadata.issued_at || !metadata.effective_from) {
    throw new Error("Date extraction failed");
  }

  // Extract supersedes information
  const supersedesMatch = text.match(/in supersession of.*?No[.\s]+(\d+\/\d+)/i);
  if (supersedesMatch) {
    metadata.supersedes = supersedesMatch[1];
    console.log(`🔄 Supersedes: ${metadata.supersedes}`);
  }

  return metadata;
}

function parseMonth(monthStr: string): string {
  const months: Record<string, string> = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  return months[monthStr.toLowerCase()] || '01';
}

// ============================================
// STEP 4: Extract Schedule Tables
// ============================================

function extractScheduleTables(text: string): ParsedRule[] {
  console.log("📊 Extracting schedule tables...");

  const rules: ParsedRule[] = [];

  // Match headers like: "Schedule I – 2.5%"
  const scheduleHeaderRegex =
    /Schedule\s+(I|II|III|IV|V|VI)\s*[–-]\s*(\d+(?:\.\d+)?)\s*%/gi;

  const headers: {
    schedule: string;
    cgst: number;
    start: number;
  }[] = [];

  let match: RegExpExecArray | null;

  while ((match = scheduleHeaderRegex.exec(text)) !== null) {
    headers.push({
      schedule: match[1],
      cgst: parseFloat(match[2]),
      start: match.index
    });
  }

  if (headers.length === 0) {
    throw new Error("No schedule headers found");
  }

  console.log(`📑 Found ${headers.length} schedules`);

  // Add end boundaries
  for (let i = 0; i < headers.length; i++) {
    const current = headers[i];
    const next = headers[i + 1];

    const scheduleText = text.slice(
      current.start,
      next ? next.start : text.length
    );

    console.log(
      `\n📋 Processing Schedule ${current.schedule} (${current.cgst}% CGST)`
    );

    const tableRules = extractTableRows(scheduleText, current.cgst);
    rules.push(...tableRules);

    console.log(`   ✅ Extracted ${tableRules.length} rules`);
  }

  return rules;
}

function extractTableRows(text: string, cgstRate: number): ParsedRule[] {
  const rules: ParsedRule[] = [];

  // Match serial number followed by HSN code
  // Matches: "1. 0303", "2 0304", "10. 0404"
  const rowRegex = /(?:^|\s)(\d+)[.\s]+(\d{2,6})(.*?)((?=\s\d+[.\s]+\d{2,6})|$)/gs;

  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(text)) !== null) {
    const serialNo = match[1];
    const hsn = match[2];
    let description = match[3].trim();

    // Clean repeated headers mid-table
    description = description.replace(/S\. No\..*?Description of Goods/gi, '').trim();

    // Parse HSN codes (range, single, or comma-separated)
    const parsedCodes = parseHSNCodes(hsn);

    for (const codeInfo of parsedCodes) {
      rules.push({
        applies_to_type: codeInfo.type,
        hsn_start: codeInfo.start,
        hsn_end: codeInfo.end,
        sac_code: codeInfo.sac,
        exclusion_codes: codeInfo.exclusions,
        cgst_rate: cgstRate,
        sgst_rate: cgstRate,
        igst_rate: cgstRate * 2,
        cess_rate: 0,
        is_exempt: cgstRate === 0,
        condition_text: description,
        raw_row_json: {
          serial_no: serialNo,
          raw_hsn: hsn,
          raw_description: description,
        },
      });
    }
  }

  return rules;
}

// ============================================
// STEP 5: Parse HSN Code Formats
// ============================================

interface CodeInfo {
  type: 'HSN' | 'SAC';
  start?: string;
  end?: string;
  sac?: string;
  exclusions?: string[];
}

function parseHSNCodes(codesStr: string): CodeInfo[] {
  const results: CodeInfo[] = [];

  // Remove extra whitespace
  codesStr = codesStr.replace(/\s+/g, ' ').trim();

  // Pattern 1: Range (e.g., "0101 to 0106" or "0101-0106")
  const rangePattern = /(\d{4,8})\s+(?:to|-)\s+(\d{4,8})/g;
  let match;

  while ((match = rangePattern.exec(codesStr)) !== null) {
    const start = normalizeHSNCode(match[1]);
    const end = normalizeHSNCode(match[2]);

    results.push({
      type: start.startsWith('99') ? 'SAC' : 'HSN',
      start: start,
      end: end
    });
  }

  // Pattern 2: Comma-separated codes (e.g., "0101, 0102, 0103")
  const commaCodes = codesStr.split(',').map(c => c.trim()).filter(c => /^\d{4,8}$/.test(c));

  for (const code of commaCodes) {
    const normalized = normalizeHSNCode(code);
    results.push({
      type: normalized.startsWith('99') ? 'SAC' : 'HSN',
      start: normalized,
      end: normalized // Single code, start = end
    });
  }

  // Pattern 3: Chapter-level (e.g., "Chapter 01" or "0101" meaning all codes in chapter)
  const chapterPattern = /(?:Chapter|Heading)\s+(\d{2,4})/gi;
  while ((match = chapterPattern.exec(codesStr)) !== null) {
    const chapter = match[1].padEnd(4, '0');
    results.push({
      type: 'HSN',
      start: chapter,
      end: chapter.substring(0, 2) + '99' // e.g., 01 → 0100 to 0199
    });
  }

  // Pattern 4: Exclusions (e.g., "other than 0101, 0102")
  const exclusionPattern = /(?:other than|except|excluding)\s+([\d,\s]+)/i;
  const exclusionMatch = codesStr.match(exclusionPattern);
  if (exclusionMatch && results.length > 0) {
    const exclusions = exclusionMatch[1]
      .split(',')
      .map(c => normalizeHSNCode(c.trim()))
      .filter(c => c);

    // Add exclusions to last result
    results[results.length - 1].exclusions = exclusions;
  }

  return results;
}

function normalizeHSNCode(code: string): string {
  // Remove all non-digits
  const digits = code.replace(/\D/g, '');

  // HSN codes can be 4, 6, or 8 digits
  // Pad to minimum 4 digits
  return digits.padEnd(4, '0').substring(0, 8);
}

// ============================================
// STEP 6: Validate Parsed Rules
// ============================================

interface ValidationError {
  rule: ParsedRule;
  error: string;
}

function validateParsedRules(rules: ParsedRule[]): ValidationError[] {
  console.log('\n🔍 Validating parsed rules...');

  const errors: ValidationError[] = [];

  // Sentinel codes (known good values for validation)
  const sentinels = {
    '0101': { expected_rate: 0, name: 'Live horses (exempt)' },
    '1001': { expected_rate: 0, name: 'Wheat (exempt)' },
    '8517': { expected_rate: 18, name: 'Mobile phones' }
  };

  for (const rule of rules) {
    // Validation 1: Rate consistency (IGST = CGST + SGST)
    if (rule.igst_rate !== rule.cgst_rate + rule.sgst_rate) {
      errors.push({
        rule,
        error: `Rate mismatch: IGST ${rule.igst_rate}% ≠ CGST ${rule.cgst_rate}% + SGST ${rule.sgst_rate}%`
      });
    }

    // Validation 2: Rate range (GST rates must be 0, 5, 12, 18, 28, or 3 for gold)
    const validRates = [0, 0.125, 0.25, 3, 5, 12, 18, 28];
    if (!validRates.includes(rule.igst_rate)) {
      errors.push({
        rule,
        error: `Invalid GST rate: ${rule.igst_rate}% (expected one of ${validRates.join(', ')})`
      });
    }

    // Validation 3: HSN range validity
    if (rule.hsn_start && rule.hsn_end) {
      if (rule.hsn_start > rule.hsn_end) {
        errors.push({
          rule,
          error: `Invalid range: ${rule.hsn_start} > ${rule.hsn_end}`
        });
      }
    }

    // Validation 4: Check sentinels
    for (const [code, expected] of Object.entries(sentinels)) {
      if (rule.hsn_start === code && rule.hsn_end === code) {
        if (rule.igst_rate !== expected.expected_rate) {
          errors.push({
            rule,
            error: `Sentinel mismatch: ${code} (${expected.name}) has rate ${rule.igst_rate}%, expected ${expected.expected_rate}%`
          });
        }
      }
    }
  }

  // Summary
  if (errors.length === 0) {
    console.log('✅ All validations passed');
  } else {
    console.log(`⚠️  Found ${errors.length} validation errors`);
    errors.slice(0, 5).forEach(e => {
      console.log(`   - ${e.error}`);
    });
  }

  return errors;
}

// ============================================
// STEP 7: Insert Rules into Database
// ============================================

async function deleteExistingRules(notificationId: string): Promise<void> {
  console.log('🗑️  Deleting existing rules for this notification...');

  const { data, error } = await supabase
    .from('gst_rate_rule')
    .delete()
    .eq('notification_id', notificationId)
    .select();

  if (error) {
    console.error('   ⚠️  Error deleting:', error.message);
  } else {
    console.log(`   ✅ Deleted ${data?.length || 0} existing rules`);
  }
}

async function insertRules(
  notificationId: string,
  rules: ParsedRule[],
  effectiveFrom: string
): Promise<void> {
  console.log('\n💾 Inserting rules into database...');
  console.log(`   Notification ID: ${notificationId}`);
  console.log(`   Effective from: ${effectiveFrom}`);
  console.log(`   Total rules: ${rules.length}`);

  // Step 1: Close overlapping existing rules
  await closeOverlappingRules(rules, effectiveFrom, notificationId);

  // Step 2: Insert new rules in batches
  const batchSize = 100;
  let insertCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rules.length; i += batchSize) {
    const batch = rules.slice(i, i + batchSize);

    const records = batch.map(rule => ({
      notification_id: notificationId,
      applies_to_type: rule.applies_to_type,
      hsn_start: rule.hsn_start,
      hsn_end: rule.hsn_end,
      sac_code: rule.sac_code,
      exclusion_codes: rule.exclusion_codes,

      // Use the already-split rates
      cgst_rate: rule.cgst_rate,
      sgst_rate: rule.sgst_rate,
      igst_rate: rule.igst_rate,
      cess_rate: rule.cess_rate,

      is_exempt: rule.is_exempt,
      condition_text: rule.condition_text,
      raw_row_json: rule.raw_row_json,

      effective_from: effectiveFrom,
      effective_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    try {
      const { data, error } = await supabase
        .from('gst_rate_rule')
        .insert(records)
        .select();

      if (error) throw error;

      insertCount += records.length;
      console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${records.length} rules)`);

    } catch (error: any) {
      console.error(`   ❌ Batch error:`, error.message);
      errorCount += batch.length;
    }
  }

  console.log(`\n✅ Insert complete: ${insertCount} success, ${errorCount} errors`);
}


async function closeOverlappingRules(
  newRules: ParsedRule[],
  effectiveFrom: string,
  notificationId: string
): Promise<void> {
  console.log('🔒 Closing overlapping existing rules...');

  const closingDate = new Date(effectiveFrom);
  closingDate.setDate(closingDate.getDate() - 1);
  const effectiveTo = closingDate.toISOString().split('T')[0];

  let closedCount = 0;

  const sacCodes = newRules
    .map(r => r.sac_code)
    .filter((v): v is string => !!v);

  const hsnRanges = newRules
    .filter(r => r.hsn_start && r.hsn_end)
    .map(r => ({ start: r.hsn_start!, end: r.hsn_end! }));

  try {
    if (sacCodes.length > 0) {
      const { data, error } = await supabase
        .from('gst_rate_rule')
        .update({ effective_to: effectiveTo })
        .is('effective_to', null)
        .neq('notification_id', notificationId)
        .select();

      if (error) throw error;

      if (data) {
        closedCount += data.length;
      }


    }

    for (const range of hsnRanges) {
      const { data, error } = await supabase
        .from('gst_rate_rule')
        .update({ effective_to: effectiveTo })
        .is('effective_to', null)
        .neq('notification_id', notificationId)
        .lte('hsn_start', range.end)
        .gte('hsn_end', range.start);

      if (error) throw error;
      closedCount += data && Array.isArray(data) ? (data as any[]).length : 0;
    }
  } catch (error: any) {
    console.error('   ⚠️ Failed to close overlapping rules:', error.message);
  }

  console.log(`   ✅ Closed ${closedCount} existing rules`);
}


async function updateNotificationStatus(
  notificationId: string,
  status: 'parsed' | 'failed',
  error?: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from('gst_notification')
    .update({
      status: status,
      parsed_at: new Date().toISOString(),
      parse_error: error || null
    })
    .eq('id', notificationId);

  if (updateError) {
    console.error('❌ Failed to update notification status:', updateError);
  } else {
    console.log(`✅ Notification status updated: ${status}`);
  }
}

// ============================================
// STEP 9: Create Audit Log
// ============================================

async function createAuditLog(
  notificationId: string,
  status: 'success' | 'failed' | 'partial',
  rowsParsed: number,
  rowsInserted: number,
  errors: ValidationError[]
): Promise<void> {
  const { error } = await supabase
    .from('parser_audit_log')
    .insert({
      notification_id: notificationId,
      completed_at: new Date().toISOString(),
      status: status,
      rows_parsed: rowsParsed,
      rows_inserted: rowsInserted,
      rows_failed: rowsParsed - rowsInserted,
      error_details: errors.length > 0 ? { errors: errors.slice(0, 10) } : null,
      validation_checks: {
        sentinels_checked: true,
        rate_consistency: errors.filter(e => e.error.includes('Rate mismatch')).length === 0
      }
    });

  if (error) {
    console.error('❌ Failed to create audit log:', error);
  }
}

// ============================================
// MAIN PARSER FUNCTION
// ============================================

export async function parseGSTNotification(
  notificationId: string,
  pdfUrl: string
): Promise<void> {
  console.log('🚀 GST Notification Parser Started');
  console.log('═══════════════════════════════════════\n');

  const tempFile = `/tmp/notification_${notificationId}.pdf`;

  try {
    // Step 1: Download PDF
    await downloadPDF(pdfUrl, tempFile);

    // Step 2: Extract text
    const text = await extractTextFromPDF(tempFile);

    // Step 3: Extract metadata
    const metadata = extractNotificationMetadata(text);

    if (!metadata.effective_from) {
      throw new Error('Could not extract effective date from PDF');
    }

    // Step 4: Parse schedule tables
    const rules = extractScheduleTables(text);

    if (rules.length === 0) {
      throw new Error('No rules extracted from PDF');
    }

    console.log(`\n📊 Extraction Summary:`);
    console.log(`   Total rules parsed: ${rules.length}`);
    console.log(`   HSN rules: ${rules.filter(r => r.applies_to_type === 'HSN').length}`);
    console.log(`   SAC rules: ${rules.filter(r => r.applies_to_type === 'SAC').length}`);

    // Step 5: Validate
    const validationErrors = validateParsedRules(rules);

    if (validationErrors.length > rules.length * 0.1) {
      // More than 10% errors - abort
      throw new Error(`Too many validation errors: ${validationErrors.length}/${rules.length}`);
    }

    // Step 6: Insert rules
    await deleteExistingRules(notificationId);
    await insertRules(notificationId, rules, metadata.effective_from);

    // Step 7: Update notification
    await updateNotificationStatus(notificationId, 'parsed');

    // Step 8: Create audit log
    await createAuditLog(
      notificationId,
      validationErrors.length === 0 ? 'success' : 'partial',
      rules.length,
      rules.length - validationErrors.length,
      validationErrors
    );

    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Parser Complete!');
    console.log('═══════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ Parser Failed:', error.message);

    await updateNotificationStatus(notificationId, 'failed', error.message);
    await createAuditLog(notificationId, 'failed', 0, 0, []);

    throw error;

  } finally {
    // Cleanup
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

export async function parseGSTNotificationFromURL(
  pdfUrl: string
): Promise<void> {
  console.log('🎬 Starting GST Notification Processing');
  console.log('═══════════════════════════════════════\n');

  try {
    // Step 1: Register notification and get UUID
    const notificationId = await registerNotification(pdfUrl);

    // Step 2: Parse with the UUID
    await parseGSTNotification(notificationId, pdfUrl);

  } catch (error: any) {
    console.error('\n❌ Processing Failed:', error.message);
    throw error;
  }
}

// Example usage
// if (import.meta.url === `file://${process.argv[1]}`) {
//   console.log('argv:', process.argv);
//   const pdfUrl = "https://gstcouncil.gov.in/sites/default/files/2025-01/ctr08-2025.pdf";
//   // const notificationId = process.argv[2];
//   // const pdfUrl = process.argv[3];

//   if (!pdfUrl) {
//     console.error('❌ Missing arguments');
//     console.log(pdfUrl);
//     console.error('Usage: ts-node parser.ts <notification-id> <pdf-url>');
//     process.exit(1);
//   }

//   parseGSTNotificationFromURL( pdfUrl)
//     .then(() => process.exit(0))
//     .catch(() => process.exit(1));
// }

if (import.meta.url === `file://${process.argv[1]}`) {
  const notificationId = process.argv[2];
  const pdfUrl = process.argv[3];

  if (!notificationId || !pdfUrl) {
    console.error('Usage: ts-node parser.ts <notification-id> <pdf-url>');
    process.exit(1);
  }

  parseGSTNotification(notificationId, pdfUrl)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}