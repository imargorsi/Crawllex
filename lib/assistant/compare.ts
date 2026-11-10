import { addUtcDays, inclusiveDaySpan, utcYesterdayString } from "@/lib/integrations/date.utils";
import { resolveAnalyticsWindow } from "@/lib/assistant/nlp/windows";
import type { TAssistantWindowSpec } from "@/types/assistant.types";

/**
 * Comparison questions ("is it up or down?", "compare with last month"). Answered in code from two
 * periods: the question's own period (or the thread's), and the period before it.
 */

export type TCompareRange = { from: string; to: string };

export type TComparePeriods = {
  current: TCompareRange;
  previous: TCompareRange;
  /** How the periods were chosen, shown to the user. */
  basis: "month_to_date" | "same_length_before";
};

const COMPARE_WORDS =
  /\b(up|down|better|worse|improv\w*|declin\w*|grow\w*|drop\w*|increas\w*|decreas\w*|compar\w*|versus|vs\.?|trend\w*|change[ds]?|rising|rise|fall\w*|went|goes|doing)\b/i;

/** True when the question asks how a figure moved. */
export function isComparisonQuestion(query: string): boolean {
  return COMPARE_WORDS.test(query);
}

/** Last day of the month containing `isoDate` (YYYY-MM-DD). */
function monthEnd(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number) as [number, number];
  const firstOfNext = new Date(Date.UTC(year, month, 1));
  return addUtcDays(firstOfNext.toISOString().slice(0, 10), -1);
}

function monthStart(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

/**
 * Default (no period in the question): this month to date against the same number of days of the
 * previous month. E.g. 1–9 Nov against 1–9 Oct, so partial months compare fairly.
 */
export function defaultComparePeriods(now = new Date()): TComparePeriods {
  const yesterday = utcYesterdayString(now);
  const currentFrom = monthStart(yesterday);
  const days = inclusiveDaySpan(currentFrom, yesterday);
  const previousMonthEnd = addUtcDays(currentFrom, -1);
  const previousFrom = monthStart(previousMonthEnd);
  const previousLastDay = addUtcDays(previousFrom, days - 1);
  const previousTo = previousLastDay > previousMonthEnd ? previousMonthEnd : previousLastDay;
  return {
    current: { from: currentFrom, to: yesterday },
    previous: { from: previousFrom, to: previousTo },
    basis: "month_to_date",
  };
}

/**
 * Explicit period (a date, a named period or "last N days"): compare with the same number of days
 * right before it. Returns null for "all time", which has no earlier period to compare with.
 */
export function comparePeriodsFor(spec: TAssistantWindowSpec, now = new Date()): TComparePeriods | null {
  const range = resolveAnalyticsWindow(spec, now);
  if (!range.from || !range.to) return null;
  const days = inclusiveDaySpan(range.from, range.to);
  const previousTo = addUtcDays(range.from, -1);
  const previousFrom = addUtcDays(previousTo, -(days - 1));
  return {
    current: { from: range.from, to: range.to },
    previous: { from: previousFrom, to: previousTo },
    basis: "same_length_before",
  };
}

export type TCompareMetric = {
  label: string;
  /** Lower is better (average position). */
  lowerIsBetter?: boolean;
  /** Percent metrics show the change in percentage points. */
  isRatio?: boolean;
  read: (overview: Record<string, unknown>) => number | null;
};

const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const gsc = (o: Record<string, unknown>) => (o.gsc ?? {}) as Record<string, unknown>;
const ga4 = (o: Record<string, unknown>) => (o.ga4 ?? {}) as Record<string, unknown>;
const engagement = (o: Record<string, unknown>) => (o.engagement ?? {}) as Record<string, unknown>;

export const COMPARE_METRICS: TCompareMetric[] = [
  { label: "Search clicks", read: (o) => num(gsc(o).clicks) },
  { label: "Impressions", read: (o) => num(gsc(o).impressions) },
  { label: "Click-through rate", isRatio: true, read: (o) => num(gsc(o).ctr) },
  { label: "Average position", lowerIsBetter: true, read: (o) => num(gsc(o).averagePosition) },
  { label: "Website sessions", read: (o) => num(ga4(o).sessions) },
  { label: "Users", read: (o) => num(ga4(o).totalUsers) },
  { label: "Page views", read: (o) => num(engagement(o).pageViews) },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function longDate(day: string): string {
  const [year, month, date] = day.split("-");
  return `${Number(date)} ${MONTHS[Number(month) - 1]} ${year}`;
}

function formatValue(metric: TCompareMetric, value: number): string {
  if (metric.isRatio) return `${(value * 100).toFixed(1)}%`;
  if (metric.lowerIsBetter) return value.toFixed(1);
  return Math.round(value).toLocaleString("en-US");
}

/** Plain change word for one metric, from its current and previous values. */
function movement(metric: TCompareMetric, current: number, previous: number): string {
  if (metric.isRatio) {
    const points = (current - previous) * 100;
    if (Math.abs(points) < 0.05) return "no change";
    return `${points > 0 ? "up" : "down"} ${Math.abs(points).toFixed(1)} points`;
  }
  if (previous === 0) return current === 0 ? "no change" : "new activity";
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.5) return "no change";
  const better = metric.lowerIsBetter ? change < 0 : change > 0;
  const word = change > 0 ? "up" : "down";
  return `${word} ${Math.abs(change).toFixed(1)}%${metric.lowerIsBetter ? (better ? " (better)" : " (worse)") : ""}`;
}

/**
 * Structured comparison built in code. Same markdown subset as the chat brief, last line `Period:`.
 * Metrics with no value in either period are left out.
 */
export function buildComparisonBrief(
  current: Record<string, unknown>,
  previous: Record<string, unknown>,
  periods: TComparePeriods,
): string {
  const rows: string[] = [];
  let up = 0;
  let down = 0;
  for (const metric of COMPARE_METRICS) {
    const now = metric.read(current);
    const before = metric.read(previous);
    if (now === null || before === null) continue;
    const change = movement(metric, now, before);
    // Overall verdict counts improvements and declines, so a lower average position counts as up.
    if (change.includes("(better)") || (!metric.lowerIsBetter && change.startsWith("up"))) up += 1;
    if (change.includes("(worse)") || (!metric.lowerIsBetter && change.startsWith("down"))) down += 1;
    rows.push(`- ${metric.label}: **${formatValue(metric, now)}** vs ${formatValue(metric, before)}, ${change}`);
  }

  const cur = `${longDate(periods.current.from)} to ${longDate(periods.current.to)}`;
  const prev = `${longDate(periods.previous.from)} to ${longDate(periods.previous.to)}`;
  if (rows.length === 0) {
    return `No comparable data for ${cur} against ${prev} yet.\n\nPeriod: ${periods.current.from} to ${periods.current.to} vs ${periods.previous.from} to ${periods.previous.to}.`;
  }

  const verdict =
    up > down ? "Overall, most figures are up." : down > up ? "Overall, most figures are down." : "Overall, figures are mixed.";
  const basisNote =
    periods.basis === "month_to_date"
      ? `This month so far (${cur}) against the same days of last month (${prev}).`
      : `${cur} against the same number of days before it (${prev}).`;
  const lines = [verdict, basisNote, "", "## Comparison", ...rows];
  lines.push("", `Period: ${periods.current.from} to ${periods.current.to} vs ${periods.previous.from} to ${periods.previous.to}.`);
  return lines.join("\n");
}
