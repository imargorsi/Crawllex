import { readFileSync } from "node:fs";

/**
 * Lens local API settings. Server-side only; nothing here reaches the browser.
 *
 *   LENS_API_URL         e.g. http://127.0.0.1:3025 (local). A non-loopback address must be https.
 *   LENS_API_TOKEN       the Lens admin token (hosted: Vercel, Hostinger). Preferred on hosts with no local files.
 *   LENS_API_TOKEN_FILE  path to the Lens admin token file (mode 600), for local dev. Read at call time.
 * If both are set, LENS_API_TOKEN wins.
 */
export type LensConfig = { baseUrl: string; token: string };

const LOOPBACK = new Set(["127.0.0.1", "localhost"]);

export function lensConfig(): LensConfig | null {
  const baseUrl = process.env.LENS_API_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) return null;

  const url = new URL(baseUrl);
  if (url.username || url.password || url.search || url.hash) return null;
  if (!LOOPBACK.has(url.hostname) && url.protocol !== "https:") return null;

  const token = readToken();
  return token ? { baseUrl, token } : null;
}

function readToken(): string | null {
  const direct = process.env.LENS_API_TOKEN?.trim();
  if (direct) return direct;
  const tokenFile = process.env.LENS_API_TOKEN_FILE?.trim();
  if (!tokenFile) return null;
  try {
    return readFileSync(tokenFile, "utf8").trim() || null;
  } catch {
    return null;
  }
}
