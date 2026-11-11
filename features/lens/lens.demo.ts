/**
 * Demo dataset for the Lens dashboard UI (phase 1). Shape matches what the Lens API will return later.
 * Values are illustrative only. Replace with live data in phase 3.
 */

export type TLensSeverity = "high" | "medium" | "advisory";
export type TLensGroup = "onpage" | "technical";

export type TLensRuleGroup =
  | "titles"
  | "descriptions"
  | "headings"
  | "content"
  | "images"
  | "indexing"
  | "robots"
  | "urls"
  | "links"
  | "structured";

export type TLensWorkflow = "todo" | "in_progress" | "awaiting_verification";
export type TLensEffort = "low" | "medium" | "high";

export type TLensTracking = {
  effort: TLensEffort;
  workflow: TLensWorkflow;
  owner: string | null;
  dueOn: string | null;
  firstSeen: string;
  lastSeen: string;
  reopened: number;
  events: { date: string; text: string }[];
};

export type TLensDemoIssue = {
  id: string;
  title: string;
  severity: TLensSeverity;
  group: TLensGroup;
  ruleGroup: TLensRuleGroup;
  status: "open" | "resolved";
  resolvedOn: string | null;
  affected: number;
  action: string;
  found: string;
  why: string;
  fix: string;
  verify: string;
  aiSuggestion: string;
  tracking: TLensTracking;
  pages: string[];
};

export type TLensDemoRun = {
  id: string;
  coverageReason: "none" | "cap_reached" | "gaps" | null;
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
  state: "checked" | "failed" | "not_evaluated";
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
  siteUrl: string;
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
    id: "missing_title", title: "Missing page title", severity: "high", group: "onpage", ruleGroup: "titles", status: "open", resolvedOn: null, affected: 5,
    action: "Add descriptive page titles to improve search visibility.",
    found: "The page has no title, or the title is empty.",
    why: "The title is the headline people see in search results. Without one, search engines write their own.",
    fix: "Add a unique, descriptive title that names the page topic.",
    verify: "Run another SEO check and confirm a valid title is detected on each page.",
    aiSuggestion: "Example for a service page: \"SEO Audit Services | Argorsi\". Keep it under 60 characters.",
    tracking: { effort: "low", workflow: "todo", owner: null, dueOn: null, firstSeen: "2026-10-12", lastSeen: "2026-11-10", reopened: 0, events: [{ date: "2026-10-12", text: "First seen" }, { date: "2026-11-10", text: "Still open" }] },
    pages: ["/services/seo", "/blog/guide", "/pricing", "/contact", "/careers"],
  },
  {
    id: "sitemap_noindex", title: "Sitemap URLs marked noindex", severity: "high", group: "technical", ruleGroup: "indexing", status: "open", resolvedOn: null, affected: 3,
    action: "Allow indexed sitemap pages or remove them from the sitemap.",
    found: "Pages listed in the sitemap carry a noindex instruction.",
    why: "Listing a page in the sitemap asks search engines to index it. A noindex tag asks them not to. The two conflict.",
    fix: "Remove noindex from pages you want found, or remove those URLs from the sitemap.",
    verify: "Run another SEO check and confirm no sitemap page is marked noindex.",
    aiSuggestion: "Check the CMS SEO setting for each listed URL before changing the sitemap; one toggle often covers several pages.",
    tracking: { effort: "low", workflow: "in_progress", owner: "Web team", dueOn: "2026-11-20", firstSeen: "2026-10-12", lastSeen: "2026-11-10", reopened: 1, events: [{ date: "2026-10-12", text: "First seen" }, { date: "2026-11-01", text: "Reopened after a fix" }, { date: "2026-11-10", text: "Still open" }] },
    pages: ["/old-offers", "/landing/spring", "/thank-you"],
  },
  {
    id: "missing_meta_description", title: "Missing meta description", severity: "medium", group: "onpage", ruleGroup: "descriptions", status: "open", resolvedOn: null, affected: 6,
    action: "Write concise summaries for search results.",
    found: "The page has no meta description.",
    why: "The meta description is the short summary shown under the title in search results.",
    fix: "Write one or two sentences that describe the page for a visitor.",
    verify: "Run another SEO check and confirm a meta description is detected on each page.",
    aiSuggestion: "Start with the offer, then the proof: \"Monthly SEO audits for retail brands, with a fix list in 48 hours.\"",
    tracking: { effort: "medium", workflow: "in_progress", owner: "Content team", dueOn: "2026-11-30", firstSeen: "2026-10-12", lastSeen: "2026-11-10", reopened: 0, events: [{ date: "2026-10-12", text: "First seen" }, { date: "2026-11-06", text: "Assigned to content team" }, { date: "2026-11-10", text: "Still open" }] },
    pages: ["/about", "/services/seo", "/blog/guide", "/blog/tips", "/faq", "/team"],
  },
  {
    id: "missing_h1", title: "Missing main heading", severity: "medium", group: "onpage", ruleGroup: "headings", status: "open", resolvedOn: null, affected: 2,
    action: "Add one clear main heading per page.",
    found: "The page has no visible main heading (H1).",
    why: "The main heading tells visitors and search engines what the page is about.",
    fix: "Add one main heading that names the page topic.",
    verify: "Run another SEO check and confirm one visible H1 is found.",
    aiSuggestion: "Use the page title as the H1 when it already matches the topic, to keep both in line.",
    tracking: { effort: "low", workflow: "todo", owner: null, dueOn: null, firstSeen: "2026-10-20", lastSeen: "2026-11-10", reopened: 0, events: [{ date: "2026-10-20", text: "First seen" }, { date: "2026-11-10", text: "Still open" }] },
    pages: ["/landing/spring", "/thank-you"],
  },
  {
    id: "title_length", title: "Title length could be improved", severity: "advisory", group: "onpage", ruleGroup: "titles", status: "open", resolvedOn: null, affected: 4,
    action: "Adjust titles where length reduces clarity.",
    found: "The title is much shorter or longer than the suggested 30 to 60 characters.",
    why: "Very short or very long titles are often cut off or unclear in search results. This is a guideline, not a rule.",
    fix: "Rewrite the title to describe the page in about 30 to 60 characters.",
    verify: "Run another SEO check. Advisory items do not reduce the score.",
    aiSuggestion: "Trim the longest title first and keep the brand name at the end.",
    tracking: { effort: "low", workflow: "todo", owner: null, dueOn: null, firstSeen: "2026-10-12", lastSeen: "2026-11-10", reopened: 0, events: [{ date: "2026-10-12", text: "First seen" }, { date: "2026-11-10", text: "Still open" }] },
    pages: ["/about", "/faq", "/team", "/blog/tips"],
  },
  {
    id: "canonical_conflict", title: "Conflicting canonical tags", severity: "medium", group: "technical", ruleGroup: "indexing", status: "open", resolvedOn: null, affected: 2,
    action: "Point each canonical tag to the page's own address.",
    found: "The canonical tag points to a different page than the one being checked.",
    why: "The canonical tag tells search engines which address to keep. A conflicting tag can hide the page you want found.",
    fix: "Set each canonical tag to the page's own preferred address, or remove it if it is not needed.",
    verify: "Run another SEO check and confirm each canonical matches its page.",
    aiSuggestion: "Use the https version of the page as the canonical target.",
    tracking: { effort: "low", workflow: "awaiting_verification", owner: "Web team", dueOn: "2026-11-14", firstSeen: "2026-10-18", lastSeen: "2026-11-10", reopened: 0, events: [{ date: "2026-10-18", text: "First seen" }, { date: "2026-11-08", text: "Marked as fixed" }, { date: "2026-11-10", text: "Awaiting verification" }] },
    pages: ["/pricing", "/services/seo"],
  },
  {
    id: "url_readable", title: "Hard-to-read page addresses", severity: "advisory", group: "technical", ruleGroup: "urls", status: "open", resolvedOn: null, affected: 1,
    action: "Use readable, lowercase page addresses where practical.",
    found: "The address contains uppercase letters, session IDs or tracking parameters.",
    why: "Readable addresses are easier for people to share and for search engines to understand.",
    fix: "Rename the page address or remove tracking parameters from internal links.",
    verify: "Run another SEO check. Advisory items do not reduce the score.",
    aiSuggestion: "Map the old address to the new one with a 301 redirect before publishing.",
    tracking: { effort: "high", workflow: "todo", owner: null, dueOn: null, firstSeen: "2026-11-03", lastSeen: "2026-11-10", reopened: 0, events: [{ date: "2026-11-03", text: "First seen" }, { date: "2026-11-10", text: "Still open" }] },
    pages: ["/Services/SEO?ref=newsletter"],
  },  {
    id: "robots_blocks_sitemap_page", title: "Sitemap page blocked by robots.txt", severity: "high", group: "technical", ruleGroup: "robots", status: "open", resolvedOn: null, affected: 1,
    action: "Allow crawling of this page in robots.txt.",
    found: "robots.txt disallows a page that is listed in the sitemap.",
    why: "The sitemap invites search engines to visit the page. robots.txt blocks them, so they cannot read it.",
    fix: "Remove the Disallow rule for this page, or remove the page from the sitemap.",
    verify: "Run another SEO check and confirm the page is allowed.",
    aiSuggestion: "Test the URL in the robots.txt tester before and after the change so the fix is confirmed.",
    tracking: { effort: "low", workflow: "todo", owner: null, dueOn: null, firstSeen: "2026-11-01", lastSeen: "2026-11-10", reopened: 0, events: [{ date: "2026-11-01", text: "First seen" }, { date: "2026-11-10", text: "Still open" }] },
    pages: ["/private-offers"],
  },
  {
    id: "missing_image_alt", title: "Images without alt text", severity: "medium", group: "onpage", ruleGroup: "images", status: "open", resolvedOn: null, affected: 3,
    action: "Describe each meaningful image in its alt text.",
    found: "Images on these pages have no alt attribute.",
    why: "Alt text describes images to screen readers and to search engines.",
    fix: "Add short, accurate alt text. Use empty alt text for decorative images.",
    verify: "Run another SEO check and confirm each meaningful image has alt text.",
    aiSuggestion: "Start with the subject, then the context: \"Team reviewing a crawl report on a laptop.\"",
    tracking: { effort: "medium", workflow: "todo", owner: null, dueOn: null, firstSeen: "2026-10-27", lastSeen: "2026-11-10", reopened: 0, events: [{ date: "2026-10-27", text: "First seen" }, { date: "2026-11-10", text: "Still open" }] },
    pages: ["/services/seo", "/about", "/team"],
  },
  {
    id: "thin_content", title: "Thin content", severity: "advisory", group: "onpage", ruleGroup: "content", status: "open", resolvedOn: null, affected: 4,
    action: "Add useful detail where a page is very short.",
    found: "The main content has fewer than 300 visible words.",
    why: "Very short pages rarely answer a visitor's main question. This is a guideline, not a rule.",
    fix: "Add useful detail that answers the page's main question.",
    verify: "Advisory. Does not change the score.",
    aiSuggestion: "Add a short FAQ with three questions the page should answer.",
    tracking: { effort: "high", workflow: "todo", owner: null, dueOn: null, firstSeen: "2026-10-12", lastSeen: "2026-11-10", reopened: 0, events: [{ date: "2026-10-12", text: "First seen" }, { date: "2026-11-10", text: "Still open" }] },
    pages: ["/careers", "/thank-you", "/contact", "/landing/spring"],
  },
  {
    id: "missing_canonical", title: "Missing canonical tag", severity: "medium", group: "technical", ruleGroup: "indexing", status: "resolved", resolvedOn: "2026-11-08", affected: 0,
    action: "Add a canonical tag that points to the page itself.",
    found: "The page had no canonical tag.",
    why: "The canonical tag tells search engines which address to keep when a page is reachable in more than one way.",
    fix: "Add a canonical tag that points to the page's own address.",
    verify: "Confirmed fixed on the next check.",
    aiSuggestion: "Use the page address without tracking parameters as the canonical target.",
    tracking: { effort: "low", workflow: "todo", owner: null, dueOn: null, firstSeen: "2026-10-12", lastSeen: "2026-11-08", reopened: 0, events: [{ date: "2026-10-12", text: "First seen" }, { date: "2026-11-08", text: "Fixed and verified" }] },
    pages: ["/blog/tips"],
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
  { url: "/archive/2019", state: "not_evaluated", failed: 0, warnings: 0, suggestions: 0 },
  { url: "/thank-you", state: "checked", failed: 1, warnings: 0, suggestions: 0 },
  { url: "/Services/SEO?ref=newsletter", state: "checked", failed: 1, warnings: 0, suggestions: 0 },
  { url: "/private-offers", state: "checked", failed: 1, warnings: 0, suggestions: 0 },
];

const RUNS: TLensDemoRun[] = [
  { id: "run-12", coverageReason: "cap_reached", startedAt: "2026-11-10T04:24:00Z", status: "completed", coverage: "partial", score: 76, pagesChecked: 30, knownUrls: 84, newIssues: 1, resolvedIssues: 2, openIssues: 8, errorCode: null },
  { id: "run-11", coverageReason: "cap_reached", startedAt: "2026-11-08T09:10:00Z", status: "completed", coverage: "partial", score: 74, pagesChecked: 30, knownUrls: 84, newIssues: 3, resolvedIssues: 0, openIssues: 9, errorCode: null },
  { id: "run-10", coverageReason: null, startedAt: "2026-11-05T03:02:00Z", status: "failed", coverage: null, score: null, pagesChecked: 0, knownUrls: null, newIssues: null, resolvedIssues: null, openIssues: null, errorCode: "run_failed" },
  { id: "run-9", coverageReason: "none", startedAt: "2026-11-01T08:40:00Z", status: "completed", coverage: "complete", score: 71, pagesChecked: 22, knownUrls: 22, newIssues: 4, resolvedIssues: 1, openIssues: 9, errorCode: null },
  { id: "run-8", coverageReason: "none", startedAt: "2026-10-27T10:15:00Z", status: "completed", coverage: "complete", score: 68, pagesChecked: 22, knownUrls: 22, newIssues: 0, resolvedIssues: 3, openIssues: 8, errorCode: null },
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
  siteUrl: "https://argorsi.com/",
  lastCheckAt: "2026-11-10T04:24:00Z",
  seo: {
    score: 76,
    failed: 3,
    warnings: 4,
    notices: 3,
    checked: 30,
    known: 84,
    partial: true,
    pagesAffected: 18,
    bySeverity: { high: 9, medium: 13, advisory: 9 },
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

export type TRuleCheckId =
  | "title_present"
  | "title_length"
  | "description_present"
  | "h1_present"
  | "canonical"
  | "noindex"
  | "robots"
  | "url_readable"
  | "image_alt"
  | "content_length";

export type TRuleCheckState = "pass" | "finding" | "not_evaluated";

/** Which open issue each rule check reports on. Demo derivation until the Lens API returns per-page results. */
const CHECK_ISSUE: Record<TRuleCheckId, string> = {
  title_present: "missing_title",
  title_length: "title_length",
  description_present: "missing_meta_description",
  h1_present: "missing_h1",
  canonical: "canonical_conflict",
  noindex: "sitemap_noindex",
  robots: "robots_blocks_sitemap_page",
  url_readable: "url_readable",
  image_alt: "missing_image_alt",
  content_length: "thin_content",
};

export const RULE_CHECK_IDS = Object.keys(CHECK_ISSUE) as TRuleCheckId[];

/** Per-page rule results: finding when the page is listed on that rule's open issue, otherwise pass. */
export function pageRuleChecks(url: string, state: TLensDemoPage["state"], issues: TLensDemoIssue[]): { id: TRuleCheckId; state: TRuleCheckState }[] {
  return RULE_CHECK_IDS.map((id) => {
    if (state !== "checked") return { id, state: "not_evaluated" as const };
    const issue = issues.find((i) => i.id === CHECK_ISSUE[id] && i.status === "open");
    return { id, state: issue && issue.pages.includes(url) ? ("finding" as const) : ("pass" as const) };
  });
}
