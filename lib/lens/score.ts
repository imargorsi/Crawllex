/**
 * STATUS: superseded. This is the old formula (6/3/1 per open issue, cap 70). It is not used by the UI.
 * The decided formula (2026-11-11, crawllex-lens docs/DECISIONS.md) replaces it: per-rule weights
 * high 10, medium 4, advisory 0, scaled by affected/checked; cap 60, floor 40. Implementation pending.
 *
 * Lens health score for the dashboard. This is OUR formula, not a search ranking signal.
 * Each open issue costs points by severity; the total penalty is capped so a long list still reads as a number, not zero.
 */

export type IssueLike = {severity: string; status: string};

export const PENALTY: Record<string, number> = {high: 6, medium: 3, low: 1};
export const PENALTY_CAP = 70;

export function healthScore(issues: IssueLike[]): number {
  const open = issues.filter((issue) => issue.status !== "resolved");
  const penalty = Math.min(PENALTY_CAP, open.reduce((sum, issue) => sum + (PENALTY[issue.severity] ?? 1), 0));
  return 100 - penalty;
}

export function severityCounts(issues: IssueLike[]): {high: number; medium: number; low: number} {
  const counts = {high: 0, medium: 0, low: 0};
  for (const issue of issues) {
    if (issue.status === "resolved") continue;
    if (issue.severity === "high" || issue.severity === "medium") counts[issue.severity] += 1;
    else counts.low += 1;
  }
  return counts;
}
