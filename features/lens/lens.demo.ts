/**
 * Demo dataset for the Lens dashboard UI (phase 1). Shape matches what the Lens API will return later.
 * Values are illustrative only. Replace with live data in phase 3.
 */

export type TLensSeverity = "high" | "medium" | "advisory";
export type TLensGroup = "onpage" | "technical";

export type TLensDemoIssue = {
  id: string;
  title: string;
  severity: TLensSeverity;
  group: TLensGroup;
  affected: number;
  action: string;
  found: string;
  why: string;
  fix: string;
  verify: string;
  pages: string[];
};

export type TLensDemoRun = {
  id: string;
  startedAt: string;
  status: "completed" | "failed";
  coverage: "complete" | "partial" | null;
  score: number | null;
  pagesChecked: number;
  knownUrls: number | null;
  newIssues: number | null;
  resolvedIssues: number | null;
  openIssues: number | null;
  errorCode: string | null;
};

export type TLensDemoPage = {
  url: string;
  state: "checked" | "failed";
  failed: number;
  warnings: number;
  suggestions: number;
};

export type TLensDemoIncident = {
  id: string;
  startedAt: string;
  durationMin: number;
  status: "resolved" | "ongoing";
  reason: string;
  detected: string;
  recovered: string | null;
};

export type TLensDemoDashboard = {
  lastCheckAt: string;
  seo: {
    score: number;
    failed: number;
    warnings: number;
    notices: number;
    checked: number;
    known: number;
    partial: boolean;
    pagesAffected: number;
    bySeverity: Record<TLensSeverity, number>;
  };
  uptime: {
    status: "operational" | "down" | "unknown";
    percent: number;
    totalDowntimeMin: number;
    incidents: number;
    avgResponseMs: number;
    p95ResponseMs: number;
    lastCheckedAt: string;
    lastSuccessAt: string;
    daily: { day: string; uptimePct: number | null }[];
    checks: number;
  };
  issues: TLensDemoIssue[];
  pages: TLensDemoPage[];
  runs: TLensDemoRun[];
  incidents: TLensDemoIncident[];
};

const ISSUES: TLensDemoIssue[] = [
  {
    id: "missing_title", title: "Missing page title", severity: "high", group: "onpage", affected: 5,
    action: "Add descriptive page titles to improve search visibility.",
    found: "The page has no title, or the title is empty.",
    why: "The title is the headline people see in search results. Without one, search engines write their own.",
    fix: "Add a unique, descriptive title that names the page topic.",
    verify: "Run another SEO check and confirm a valid title is detected on each page.",
    pages: ["/services/seo", "/blog/guide", "/pricing", "/contact", "/careers"],
  },
  {
    id: "sitemap_noindex", title: "Sitemap URLs marked noindex", severity: "high", group: "technical", affected: 3,
    action: "Allow indexed sitemap pages or remove them from the sitemap.",
    found: "Pages listed in the sitemap carry a noindex instruction.",
    why: "Listing a page in the sitemap asks search engines to index it. A noindex tag asks them not to. The two conflict.",
    fix: "Remove noindex from pages you want found, or remove those URLs from the sitemap.",
    verify: "Run another SEO check and confirm no sitemap page is marked noindex.",
    pages: ["/old-offers", "/landing/spring", "/thank-you"],
  },
  {
    id: "missing_meta_description", title: "Missing meta description", severity: "medium", group: "onpage", affected: 6,
    action: "Write concise summaries for search results.",
    found: "The page has no meta description.",
    why: "The meta description is the short summary shown under the title in search results.",
    fix: "Write one or two sentences that describe the page for a visitor.",
    verify: "Run another SEO check and confirm a meta description is detected on each page.",
    pages: ["/about", "/services/seo", "/blog/guide", "/blog/tips", "/faq", "/team"],
  },
  {
    id: "missing_h1", title: "Missing main heading", severity: "medium", group: "onpage", affected: 2,
    action: "Add one clear main heading per page.",
    found: "The page has no visible main heading (H1).",
    why: "The main heading tells visitors and search engines what the page is about.",
    fix: "Add one main heading that names the page topic.",
    verify: "Run another SEO check and confirm one visible H1 is found.",
    pages: ["/landing/spring", "/thank-you"],
  },
  {
    id: "title_length", title: "Title length could be improved", severity: "advisory", group: "onpage", affected: 4,
    action: "Adjust titles where length reduces clarity.",
    found: "The title is much shorter or longer than the suggested 30 to 60 characters.",
    why: "Very short or very long titles are often cut off or unclear in search results. This is a guideline, not a rule.",
    fix: "Rewrite the title to describe the page in about 30 to 60 characters.",
    verify: "Run another SEO check. Advisory items do not reduce the score.",
    pages: ["/about", "/faq", "/team", "/blog/tips"],
  },
  {
    id: "canonical_conflict", title: "Conflicting canonical tags", severity: "medium", group: "technical", affected: 2,
    action: "Point each canonical tag to the page's own address.",
    found: "The canonical tag points to a different page than the one being checked.",
    why: "The canonical tag tells search engines which address to keep. A conflicting tag can hide the page you want found.",
    fix: "Set each canonical tag to the page's own preferred address, or remove it if it is not needed.",
    verify: "Run another SEO check and confirm each canonical matches its page.",
    pages: ["/pricing", "/services/seo"],
  },
  {
    id: "url_readable", title: "Hard-to-read page addresses", severity: "advisory", group: "technical", affected: 1,
    action: "Use readable, lowercase page addresses where practical.",
    found: "The address contains uppercase letters, session IDs or tracking parameters.",
    why: "Readable addresses are easier for people to share and for search engines to understand.",
    fix: "Rename the page address or remove tracking parameters from internal links.",
    verify: "Run another SEO check. Advisory items do not reduce the score.",
    pages: ["/Services/SEO?ref=newsletter"],
  },
];

const PAGES: TLensDemoPage[] = [
  { url: "/", state: "checked", failed: 0, warnings: 1, suggestions: 2 },
  { url: "/services/seo", state: "checked", failed: 2, warnings: 3, suggestions: 1 },
  { url: "/about", state: "checked", failed: 1, warnings: 0, suggestions: 1 },
  { url: "/blog/guide", state: "checked", failed: 1, warnings: 2, suggestions: 3 },
  { url: "/pricing", state: "checked", failed: 1, warnings: 1, suggestions: 0 },
  { url: "/contact", state: "checked", failed: 0, warnings: 0, suggestions: 0 },
  { url: "/faq", state: "checked", failed: 0, warnings: 1, suggestions: 1 },
  { url: "/team", state: "checked", failed: 1, warnings: 0, suggestions: 1 },
  { url: "/landing/spring", state: "checked", failed: 1, warnings: 1, suggestions: 0 },
  { url: "/careers", state: "failed", failed: 0, warnings: 0, suggestions: 0 },
  { url: "/blog/tips", state: "checked", failed: 0, warnings: 2, suggestions: 1 },
  { url: "/old-offers", state: "checked", failed: 1, warnings: 0, suggestions: 0 },
];

const RUNS: TLensDemoRun[] = [
  { id: "run-12", startedAt: "2026-11-10T04:24:00Z", status: "completed", coverage: "partial", score: 76, pagesChecked: 30, knownUrls: 84, newIssues: 1, resolvedIssues: 2, openIssues: 8, errorCode: null },
  { id: "run-11", startedAt: "2026-11-08T09:10:00Z", status: "completed", coverage: "partial", score: 74, pagesChecked: 30, knownUrls: 84, newIssues: 3, resolvedIssues: 0, openIssues: 9, errorCode: null },
  { id: "run-10", startedAt: "2026-11-05T03:02:00Z", status: "failed", coverage: null, score: null, pagesChecked: 0, knownUrls: null, newIssues: null, resolvedIssues: null, openIssues: null, errorCode: "run_failed" },
  { id: "run-9", startedAt: "2026-11-01T08:40:00Z", status: "completed", coverage: "complete", score: 71, pagesChecked: 22, knownUrls: 22, newIssues: 4, resolvedIssues: 1, openIssues: 9, errorCode: null },
  { id: "run-8", startedAt: "2026-10-27T10:15:00Z", status: "completed", coverage: "complete", score: 68, pagesChecked: 22, knownUrls: 22, newIssues: 0, resolvedIssues: 3, openIssues: 8, errorCode: null },
];

/** 30 days of daily uptime. One day has no probes (null), shown as an empty slot. */
function dailyUptime(): { day: string; uptimePct: number | null }[] {
  const days: { day: string; uptimePct: number | null }[] = [];
  const start = new Date("2026-10-12T00:00:00Z");
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    let pct: number | null = 100;
    if (i === 9) pct = 99.2;
    else if (i === 21) pct = 98.4;
    else if (i === 14) pct = null;
    else if (i % 5 === 2) pct = 99.97;
    days.push({ day: d.toISOString().slice(0, 10), uptimePct: pct });
  }
  return days;
}

export const LENS_DEMO: TLensDemoDashboard = {
  lastCheckAt: "2026-11-10T04:24:00Z",
  seo: {
    score: 76,
    failed: 2,
    warnings: 2,
    notices: 1,
    checked: 30,
    known: 84,
    partial: true,
    pagesAffected: 18,
    bySeverity: { high: 8, medium: 8, advisory: 4 },
  },
  uptime: {
    status: "operational",
    percent: 99.94,
    totalDowntimeMin: 26,
    incidents: 2,
    avgResponseMs: 428,
    p95ResponseMs: 712,
    lastCheckedAt: "2026-11-10T04:26:00Z",
    lastSuccessAt: "2026-11-10T04:26:00Z",
    daily: dailyUptime(),
    checks: 8640,
  },
  issues: ISSUES,
  pages: PAGES,
  runs: RUNS,
  incidents: [
    { id: "inc-2", startedAt: "2026-11-06T06:12:00Z", durationMin: 18, status: "resolved", reason: "Website unavailable", detected: "2026-11-06T06:12:00Z", recovered: "2026-11-06T06:30:00Z" },
    { id: "inc-1", startedAt: "2026-10-21T14:02:00Z", durationMin: 8, status: "resolved", reason: "Server error (503)", detected: "2026-10-21T14:02:00Z", recovered: "2026-10-21T14:10:00Z" },
  ],
};
