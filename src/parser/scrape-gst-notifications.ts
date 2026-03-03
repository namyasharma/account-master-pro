import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

interface GSTNotification {
  notificationNumber: string;
  title: string;
  pdfUrl: string;
  page: number;
}

const BASE_URL = "https://gstcouncil.gov.in";
const LIST_URL = `${BASE_URL}/cgst-rate-notification`;

const OUTPUT_FILE = path.join(process.cwd(), "gst_notifications.json");

async function fetchPage(page: number): Promise<string> {
  const url = `${LIST_URL}?page=${page}`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html",
    },
    timeout: 20000,
  });

  return res.data;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractTotalPages(html: string): number {
  const $ = cheerio.load(html);

  let maxPage = 0;

  $(".pager__item a").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const match = href.match(/page=(\d+)/);
    if (match) {
      maxPage = Math.max(maxPage, Number(match[1]));
    }
  });

  return maxPage + 1;
}

function extractNotifications(html: string, page: number): GSTNotification[] {
  const $ = cheerio.load(html);
  const results: GSTNotification[] = [];

  $("table.customdatatable tbody tr").each((_, row) => {
    const notificationNumber = normalize(
      $(row)
        .find(".views-field-field-ntfn-no-date-of-issue")
        .text()
    );

    if (!notificationNumber) return;

    const englishPdf = $(row)
      .find(".views-field-field-rate-notification-english a[href$='.pdf']")
      .first()
      .attr("href");

    if (!englishPdf) return;

    const pdfUrl = englishPdf.startsWith("http")
      ? englishPdf
      : `${BASE_URL}${englishPdf}`;

    results.push({
      notificationNumber,
      title: notificationNumber,
      pdfUrl,
      page,
    });
  });

  return results;
}

function dedupe(notifications: GSTNotification[]): GSTNotification[] {
  const seen = new Map<string, GSTNotification>();

  for (const n of notifications) {
    const key = `${n.notificationNumber}|${n.pdfUrl}`;
    seen.set(key, n);
  }

  return Array.from(seen.values());
}

async function scrapeGSTNotifications(): Promise<GSTNotification[]> {
  console.log("Fetching first page…");
  const firstHtml = await fetchPage(0);

  const totalPages = extractTotalPages(firstHtml);
  console.log(`Total pages: ${totalPages}`);

  let all: GSTNotification[] = [];

  for (let page = 0; page < totalPages; page++) {
    console.log(`Scraping page ${page}`);
    const html = page === 0 ? firstHtml : await fetchPage(page);
    const items = extractNotifications(html, page);
    all.push(...items);

    await new Promise(r => setTimeout(r, 500));
  }

  const deduped = dedupe(all);
  console.log(`Total notifications: ${deduped.length}`);

  return deduped;
}

(async () => {
  try {
    const data = await scrapeGSTNotifications();
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
  } catch (err: any) {
    console.error("Scraping failed:", err.message);
    process.exit(1);
  }
})();
