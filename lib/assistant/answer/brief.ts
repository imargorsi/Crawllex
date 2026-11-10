/**
 * Structured answer built in code from the project data (read-only tools). Same markdown subset the
 * chat renders (`## heading`, `- bullet`, `**bold**`, last line `Period:`). No model call, so the
 * figures and labels are exact.
 */

type TRange = { from: string; to: string };

type TToolData = unknown;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The object inside a tool result, or null when the tool returned an error. */
function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !("error" in value) ? (value as Record<string, unknown>) : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function count(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function percent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

function duration(seconds: number): string {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

function longDate(day: string): string {
  const [year, month, date] = day.split("-");
  return `${Number(date)} ${MONTHS[Number(month) - 1]} ${year}`;
}

function bullet(label: string, value: string, note?: string): string {
  return `- ${label}: **${value}**${note ? ` ${note}` : ""}`;
}

/** Builds the brief. Sections with no data are left out, so no "0" stands in for missing data. */
export function buildAnswerBrief(data: Record<string, TToolData>, range: TRange): string {
  const leads = data.get_leads_count;
  const overview = data.get_analytics_overview;
  const activity = data.get_seo_activity_counts;

  const overviewData = asRecord(overview);
  const gsc = asRecord(overviewData?.gsc);
  const ga4 = asRecord(overviewData?.ga4);
  const engagement = asRecord(overviewData?.engagement);
  const leadCount = num(asRecord(leads)?.leads);
  const activityCounts = asRecord(asRecord(activity)?.counts);

  const sessions = ga4 ? num(ga4.sessions) : null;
  const clicks = gsc ? num(gsc.clicks) : null;
  const summaryParts: string[] = [];
  if (clicks !== null) summaryParts.push(`**${count(clicks)}** search clicks`);
  if (sessions !== null) summaryParts.push(`**${count(sessions)}** website sessions`);
  if (leadCount !== null) summaryParts.push(`**${count(leadCount)}** leads`);

  const lines: string[] = [];
  lines.push(
    summaryParts.length > 0
      ? `From ${longDate(range.from)} to ${longDate(range.to)}: ${summaryParts.join(", ")}.`
      : `No data is available for ${longDate(range.from)} to ${longDate(range.to)} yet.`,
  );

  if (gsc) {
    const rows: string[] = [];
    if (clicks !== null) rows.push(bullet("Clicks", count(clicks), "from Google search results"));
    if (num(gsc.impressions) !== null) rows.push(bullet("Impressions", count(num(gsc.impressions) as number)));
    if (num(gsc.ctr) !== null) rows.push(bullet("Click-through rate", percent(num(gsc.ctr) as number)));
    if (num(gsc.averagePosition) !== null) rows.push(bullet("Average position", (num(gsc.averagePosition) as number).toFixed(1)));
    if (rows.length > 0) lines.push("", "## Search performance", ...rows);
  }

  if (ga4) {
    const rows: string[] = [];
    if (sessions !== null) {
      const users = num(ga4.totalUsers);
      rows.push(bullet("Sessions", count(sessions), users !== null ? `from **${count(users)}** users` : ""));
    }
    if (num(ga4.newUsers) !== null) rows.push(bullet("New users", count(num(ga4.newUsers) as number)));
    if (num(ga4.organicSessions) !== null) rows.push(bullet("Organic sessions", count(num(ga4.organicSessions) as number)));
    if (rows.length > 0) lines.push("", "## Website traffic", ...rows);
  }

  if (engagement) {
    const rows: string[] = [];
    if (num(engagement.pageViews) !== null) rows.push(bullet("Page views", count(num(engagement.pageViews) as number)));
    if (num(engagement.engagementRate) !== null) rows.push(bullet("Engagement rate", percent(num(engagement.engagementRate) as number)));
    if (num(engagement.avgSessionDurationSeconds) !== null) {
      rows.push(bullet("Average session", duration(num(engagement.avgSessionDurationSeconds) as number)));
    }
    if (rows.length > 0) lines.push("", "## Engagement", ...rows);
  }

  const workRows: string[] = [];
  if (leadCount !== null) workRows.push(bullet("Leads", count(leadCount)));
  if (activityCounts) {
    const total = Object.values(activityCounts).reduce<number>((sum, value) => sum + (num(value) ?? 0), 0);
    workRows.push(bullet("SEO work logged", count(total)));
  }
  if (workRows.length > 0) lines.push("", "## Leads and activity", ...workRows);

  lines.push("", `Period: ${range.from} to ${range.to}.`);
  return lines.join("\n");
}
