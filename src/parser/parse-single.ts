import { parseGSTNotification, parseGSTNotificationFromURL } from './parse-gst-notification';

async function main() {
  const args = process.argv.slice(2);

  // if (args.length < 2) {
  //   console.log('Arguments:', args);
  //   console.log('Usage: ts-node parse-single.ts <notification-id> <pdf-url>');
  //   console.log('\nExample:');
  //   console.log('ts-node parse-single.ts abc-123 https://cbic-gst.gov.in/pdf/notification.pdf');
  //   process.exit(1);
  // }

  const pdfUrl = "https://gstcouncil.gov.in/sites/default/files/2025-01/ctr08-2025.pdf";
  const pdfUrl2 = "https://gstcouncil.gov.in/sites/default/files/2024-05/download_4_0.pdf"

  console.log('📋 Parsing notification:');
  // console.log(`   ID: ${notificationId}`);
  console.log(`   URL: ${pdfUrl}\n`);

  try {
    await parseGSTNotificationFromURL(pdfUrl2);
    console.log('\n✅ Success! Rules have been inserted into database.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  }
}

main();