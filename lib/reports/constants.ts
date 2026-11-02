/**
 * Monthly client report settings. See doc/reports.md.
 *
 * The report is a standalone print document (HTML → PDF), so it carries its own brand palette
 * instead of the app theme tokens (AGENTS.md rule 10 covers the app UI only).
 */

/** Agency that issues the report. Confirm these values before the first client send. */
export const REPORT_BRAND = {
  name: "Logical Creations",
  website: "www.logicalcreations.net",
  email: "info@logicalcreation.net",
  phone: "+966 55 358 0527",
} as const;

export const REPORT_PALETTE = {
  accent: "#e0362c",
  accentDark: "#9e1f18",
  ink: "#1f2328",
  muted: "#6b7280",
  line: "#e5e7eb",
  surface: "#f7f7f8",
  positive: "#15803d",
  negative: "#b91c1c",
  neutral: "#6b7280",
  series: ["#e0362c", "#374151", "#9ca3af", "#f59e0b"],
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
