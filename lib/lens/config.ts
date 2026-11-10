import { readFileSync } from "node:fs";

/**
 * Lens local API settings. Server-side only; nothing here reaches the browser.
 *
 *   LENS_API_URL         e.g. http://127.0.0.1:3025 (local). A non-loopback address must be https.
 *   LENS_API_TOKEN_FILE  path to the Lens admin token file (mode 600). The token is read at call time, never stored in env.
 */
export type LensConfig = { baseUrl: string; token: string };

const LOOPBACK = new Set(["127.0.0.1", "localhost"]);

export function lensConfig(): LensConfig | null {
  const baseUrl = process.env.LENS_API_URL?.trim().replace(/\/+$/, "");
  const tokenFile = process.env.LENS_API_TOKEN_FILE?.trim();
  if (!baseUrl || !tokenFile) return null;

  const url = new URL(baseUrl);
  if (url.username || url.password || url.search || url.hash) return null;
  if (!LOOPBACK.has(url.hostname) && url.protocol !== "https:") return null;

  let token: string;
  try {
    token = readFileSync(tokenFile, "utf8").trim();
  } catch {
    return null;
  }
  return token ? { baseUrl, token } : null;
}
