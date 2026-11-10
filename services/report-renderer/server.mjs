/**
 * Crawllex report renderer. Turns one HTML document into one A4 PDF.
 *
 * Contract (the only interface to Crawllex):
 *   GET  /health                 → 200 { ok: true }
 *   POST /render                 → body: text/html (≤ MAX_HTML_BYTES)
 *                                  header: Authorization: Bearer <REPORT_RENDERER_TOKEN>
 *                                  response: application/pdf
 *
 * Env:
 *   REPORT_RENDERER_TOKEN  required. Shared secret; must match Crawllex REPORT_RENDERER_TOKEN.
 *   CHROME_PATH            path to Chromium/Chrome binary (required on servers without a bundled browser).
 *   PORT                   default 8788.
 *   HOST                   default 127.0.0.1 (put a reverse proxy or tunnel in front; do not expose raw).
 *   MAX_CONCURRENT_PAGES   default 2.
 *   RENDER_TIMEOUT_MS      default 45000.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import http from "node:http";

import puppeteer from "puppeteer-core";

const PORT = Number(process.env.PORT ?? 8788);
const HOST = process.env.HOST ?? "127.0.0.1";
const TOKEN = process.env.REPORT_RENDERER_TOKEN ?? "";
const CHROME_PATH = process.env.CHROME_PATH ?? "";
const MAX_CONCURRENT_PAGES = Number(process.env.MAX_CONCURRENT_PAGES ?? 2);
const RENDER_TIMEOUT_MS = Number(process.env.RENDER_TIMEOUT_MS ?? 45_000);
const MAX_HTML_BYTES = 5 * 1024 * 1024;

if (!TOKEN) {
  console.error("REPORT_RENDERER_TOKEN is required.");
  process.exit(1);
}
if (!CHROME_PATH) {
  console.error("CHROME_PATH is required (path to chromium).");
  process.exit(1);
}

let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ["--no-sandbox", "--disable-gpu", "--font-render-hinting=none", "--disable-dev-shm-usage"],
      })
      .then((browser) => {
        browser.on("disconnected", () => {
          browserPromise = null;
        });
        return browser;
      })
      .catch((error) => {
        browserPromise = null;
        throw error;
      });
  }
  return browserPromise;
}

// Simple FIFO limiter so a burst of requests cannot open unlimited pages.
let active = 0;
const waiting = [];
function acquire() {
  if (active < MAX_CONCURRENT_PAGES) {
    active += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => waiting.push(resolve));
}
function release() {
  const next = waiting.shift();
  if (next) {
    next();
  } else {
    active -= 1;
  }
}

async function renderPdf(html) {
  await acquire();
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);
    // The report is self-contained: block every network request.
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.url().startsWith("data:") || request.url().startsWith("about:")) {
        request.continue();
      } else {
        request.abort();
      }
    });
    await page.setContent(html, { waitUntil: "load", timeout: RENDER_TIMEOUT_MS });
    // The report script splits sections into A4 pages and sets window.reportReady when done.
    await page.waitForFunction("window.reportReady === true", { timeout: RENDER_TIMEOUT_MS });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      timeout: RENDER_TIMEOUT_MS,
    });
  } finally {
    if (page) await page.close().catch(() => {});
    release();
  }
}

function tokenMatches(header) {
  const expected = `Bearer ${TOKEN}`;
  // Compare digests so the length of the secret is not leaked by an early return.
  const a = createHash("sha256").update(header ?? "").digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_HTML_BYTES) {
        reject(new HttpError(413, "Payload Too Large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url === "/render") {
      if (!tokenMatches(req.headers.authorization)) {
        return sendJson(res, 401, { ok: false, message: "Unauthorized." });
      }
      const contentType = req.headers["content-type"] ?? "";
      if (!contentType.startsWith("text/html")) {
        return sendJson(res, 415, { ok: false, message: "Expected text/html." });
      }
      const html = await readBody(req);
      const pdf = await renderPdf(html);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Length": pdf.length,
        "Cache-Control": "no-store",
      });
      return res.end(Buffer.from(pdf));
    }

    return sendJson(res, 404, { ok: false, message: "Not found." });
  } catch (error) {
    if (error instanceof HttpError) {
      return sendJson(res, error.status, { ok: false, message: error.message });
    }
    console.error("[report-renderer] render failed:", error?.message ?? error);
    return sendJson(res, 500, { ok: false, message: "Render failed." });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[report-renderer] listening on http://${HOST}:${PORT}`);
});

async function shutdown() {
  server.close();
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    await browser?.close().catch(() => {});
  }
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
