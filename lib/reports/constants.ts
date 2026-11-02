/**
 * Monthly client report settings. See doc/reports.md.
 *
 * The report is a standalone print document (HTML → PDF), so it carries its own brand palette
 * instead of the app theme tokens (AGENTS.md rule 10 covers the app UI only).
 */

/** Agency that issues the report. Values from the "LC New Report Template" (Canva, 2026-11-02). */
export const REPORT_BRAND = {
  name: "Logical Creations",
  website: "www.logicalcreations.net",
  email: "info@logicalcreations.net",
  phones: ["+92 333 1413510", "+966 55 358 0527"],
  addresses: ["Johar Town, Lahore", "Wadi Laban Riyadh, Saudi Arabia"],
} as const;

/** Palette from the LC template. The report is a print document, so it does not use app theme tokens. */
export const REPORT_PALETTE = {
  accent: "#0A3EC5",
  accentDark: "#0B2298",
  accentBright: "#0671DF",
  cyan: "#7FF2FF",
  ink: "#1F2138",
  muted: "#5568B7",
  line: "#D6DCEB",
  surface: "#EFFDFF",
  positive: "#15803d",
  negative: "#b91c1c",
  neutral: "#5568B7",
  series: ["#0A3EC5", "#0671DF", "#7FF2FF", "#0B2298"],
} as const;

/** Rows per ranked table (queries, pages, channels, countries). */
export const REPORT_TOP_ROWS = 10;

/** Blog titles listed in the content section. */
export const REPORT_MAX_BLOG_ROWS = 20;

/** Highlight notes accepted per report. */
export const REPORT_MAX_HIGHLIGHTS = 8;

export const REPORT_RENDER_TIMEOUT_MS = 60_000;

/** Max HTML size sent to the renderer (bytes). */
export const REPORT_MAX_HTML_BYTES = 5 * 1024 * 1024;

/** Relative change below this share counts as flat in narrative wording. */
export const REPORT_FLAT_CHANGE_RATIO = 0.03;

/** Position change (in ranking places) below this counts as stable. */
export const REPORT_STABLE_POSITION_DELTA = 0.5;
