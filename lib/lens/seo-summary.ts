/**
 * Rule-based summary for the Lens score card: turns open issues into plain bullet points.
 * Pure function, no i18n here. The UI translates each key. Phase 3 feeds it live issues.
 */

export type TSummaryTone = "attention" | "info" | "good";
export type TSummarySeverity = "high" | "medium" | "advisory";

export type TSummaryIssue = {
  id: string;
  title: string;
  severity: TSummarySeverity;
  affected: number;
};

export type TSummaryKey =
  | "bullet_high_count"
  | "bullet_clean"
  | "bullet_partial"
  | "bullet_uptime_good"
  | "bullet_uptime_low"
  | "bullet_missing_title"
  | "bullet_sitemap_noindex"
  | "bullet_missing_meta_description"
  | "bullet_missing_h1"
  | "bullet_title_length"
  | "bullet_canonical_conflict"
  | "bullet_url_readable"
  | "bullet_robots_sitemap_page"
  | "bullet_thin_content"
  | "bullet_generic_high"
  | "bullet_generic_medium"
  | "bullet_generic_advisory";

export type TSummaryBullet = {
  key: TSummaryKey;
  vars: Record<string, string | number>;
  tone: TSummaryTone;
};

/** Rule ids with a hand-written sentence. Anything else falls back to a generic sentence per severity. */
const RULE_KEY: Record<string, TSummaryKey> = {
  missing_title: "bullet_missing_title",
  sitemap_noindex: "bullet_sitemap_noindex",
  missing_meta_description: "bullet_missing_meta_description",
  missing_h1: "bullet_missing_h1",
  title_length: "bullet_title_length",
  canonical_conflict: "bullet_canonical_conflict",
  url_readable: "bullet_url_readable",
  robots_blocks_sitemap_page: "bullet_robots_sitemap_page",
  thin_content: "bullet_thin_content",
};

const SEVERITY_TONE: Record<TSummarySeverity, TSummaryTone> = { high: "attention", medium: "info", advisory: "info" };
const SEVERITY_ORDER: Record<TSummarySeverity, number> = { high: 0, medium: 1, advisory: 2 };
const GENERIC_KEY: Record<TSummarySeverity, TSummaryKey> = {
  high: "bullet_generic_high",
  medium: "bullet_generic_medium",
  advisory: "bullet_generic_advisory",
};

export function buildSeoSummary(input: {
  issues: TSummaryIssue[];
  checked: number;
  known: number;
  partial: boolean;
  uptimePercent: number;
}): TSummaryBullet[] {
  const open = input.issues.filter((i) => i.affected > 0);
  const high = open.filter((i) => i.severity === "high");
  const bullets: TSummaryBullet[] = [];

  if (high.length > 0) bullets.push({ key: "bullet_high_count", vars: { count: high.length }, tone: "attention" });
  else bullets.push({ key: "bullet_clean", vars: {}, tone: "good" });

  const sorted = [...open].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.affected - a.affected);
  for (const issue of sorted) {
    bullets.push({
      key: RULE_KEY[issue.id] ?? GENERIC_KEY[issue.severity],
      vars: { pages: issue.affected, title: issue.title },
      tone: SEVERITY_TONE[issue.severity],
    });
  }

  if (input.partial) bullets.push({ key: "bullet_partial", vars: { checked: input.checked, known: input.known }, tone: "info" });

  bullets.push(
    input.uptimePercent >= 99.9
      ? { key: "bullet_uptime_good", vars: { percent: input.uptimePercent.toFixed(2) }, tone: "good" }
      : { key: "bullet_uptime_low", vars: { percent: input.uptimePercent.toFixed(2) }, tone: "attention" },
  );
  return bullets;
}
