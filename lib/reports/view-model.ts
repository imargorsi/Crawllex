import { REPORT_COPY } from "@/lib/reports/copy";
import { REPORT_BRAND, REPORT_MAX_ACTIVITY_ROWS, REPORT_MAX_TOP_COUNTRIES, REPORT_MAX_TOP_EVENTS, REPORT_PALETTE } from "@/lib/reports/constants";
import { formatDuration, formatInt, formatPercent, formatPosition, relativeChange, type TChange } from "@/lib/reports/format";
import { formatMonthTitle, formatPeriodLabel } from "@/lib/reports/period";
import type { TReportActivityItemDto, TReportRankedRowDto, TReportSnapshotDto } from "@/types/reports.types";
import { buildReportText, describeEvent, type TReportText } from "@/lib/reports/report-text";
import type { TRichDoc } from "@/lib/reports/rich-text";

/**
 * One view of a report snapshot. The PDF renderer and the in-app report page both render this
 * structure, so the wording and numbers are identical in both. Add report content here, not in the
 * renderers.
 */

export type TReportTone = "brand" | "cyan" | "emerald" | "amber" | "neutral";

export type TChangeView = { direction: TChange["direction"]; text: string };

/** `empty` is true when the value is zero: the UI mutes it and hides the trend. */
/** Every icon a KPI tile or highlight card can show. The UI maps each key to an app icon. */
export type TReportIcon =
  | "clicks"
  | "impressions"
  | "ctr"
  | "position"
  | "sessions"
  | "users"
  | "newUsers"
  | "organic"
  | "engagementRate"
  | "time"
  | "pageViews"
  | "engaged"
  | "leads"
  | "calls"
  | "emails"
  | "whatsapp"
  | "blogs"
  | "backlinks"
  | "technical";

export type TKpiView = {
  icon: TReportIcon;
  label: string;
  value: string;
  change: TChangeView | null;
  tone: TReportTone;
  empty: boolean;
};

export type TTableView = { headers: string[]; rows: string[][]; emptyText: string };

export type TChartStat = { label: string; value: string };

/** One bar of a ranked bar chart. `valueLabel` is the printed value with its share of the total. */
export type TBarRow = { label: string; value: number; valueLabel: string };

function barRows(rows: { label: string; value: number }[]): TBarRow[] {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return rows.map((row) => ({
    label: row.label,
    value: row.value,
    valueLabel: `${formatInt(row.value)} · ${formatPercent(total > 0 ? row.value / total : null)}`,
  }));
}

export type TSeriesView = {
  /** Every day of the period, in order. Days without data are 0, so the line never stops early. */
  dates: string[];
  series: { name: string; color: string; values: Array<number | null> }[];
  /** Total, daily average and best day, shown above the chart. */
  stats: TChartStat[];
  /** Index of the best day in `dates`, or null when the period has no activity. */
  peakIndex: number | null;
};

export type TCardView = {
  /** When set, the card opens this table in a modal (arrow shown). */
  table?: TTableView;
  icon: TReportIcon;
  label: string;
  value: string;
  body: string;
  change: TChangeView | null;
  tone: TReportTone;
  empty: boolean;
};

export type TNamedTable = { title: string; table: TTableView };

export type TBlockView =
  | { type: "heading"; title: string }
  | { type: "prose"; title: string | null; body: string; variant: "lead" | "body" }
  | { type: "rich"; doc: TRichDoc }
  | { type: "cards"; title: string; items: TCardView[] }
  | { type: "kpis"; items: TKpiView[] }
  | { type: "line"; title: string | null; charts: { title: string; subtitle: string; chart: TSeriesView }[]; tables: TNamedTable[] }
  | { type: "donut"; title: string; subtitle: string; rows: TBarRow[]; list?: { title: string; subtitle: string; rows: TBarRow[]; emptyText: string } }
  | { type: "bullets"; title: string; items: string[] }
  | { type: "table"; title: string; table: TTableView }
  | { type: "callout"; title: string; text: string }
  | { type: "note"; text: string };

export type TSectionView = {
  id: "summary" | "search" | "traffic" | "engagement" | "work" | "next";
  number: string;
  title: string;
  blocks: TBlockView[];
};

export type TReportView = {
  title: string;
  cover: {
    clientName: string;
    clientLogoDataUri: string | null;
    monthTitle: string;
    dateLabel: string;
    periodLabel: string;
    websiteUrl: string;
  };
  sections: TSectionView[];
  contact: { phones: string[]; addresses: string[]; email: string; website: string };
  legal: string;
};

function change(current: number, previous: number | null | undefined): TChangeView | null {
  const result = relativeChange(current, previous);
  if (result.ratio == null) return null;
  const arrow = result.direction === "up" ? "▲" : result.direction === "down" ? "▼" : "■";
  return { direction: result.direction, text: `${arrow} ${Math.abs(result.ratio * 100).toFixed(1)}% vs previous` };
}

function kpi(icon: TReportIcon, label: string, value: string, tone: TReportTone, delta?: TChangeView | null): TKpiView {
  return { icon, label, value, change: delta ?? null, tone, empty: value === "0" };
}

function ranked(rows: TReportRankedRowDto[], emptyText: string, headers: string[], columns: (row: TReportRankedRowDto) => string[]): TTableView {
  return { headers, rows: rows.map(columns), emptyText };
}

/** Section overview: the team's written text when provided, else the generated paragraph. */
function overviewBlock(written: TRichDoc | null | undefined, generated: string): TBlockView {
  return written ? { type: "rich", doc: written } : { type: "prose", title: null, body: generated, variant: "lead" };
}

/** Every day from `from` to `to` (YYYY-MM-DD). */
function dayRange(from: string, to: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`).getTime();
  while (cursor.getTime() <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Daily values on the full day range. A day missing from the cache counts as 0. */
function filledDaily(days: string[], points: { date: string; value: number | null }[]): number[] {
  const byDate = new Map(points.map((point) => [point.date, point.value]));
  return days.map((day) => byDate.get(day) ?? 0);
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "5 Oct" for chart labels and the best-day line. */
export function shortDayLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(day)} ${MONTH_SHORT[Number(month) - 1]}`;
}

function lineView(days: string[], series: TSeriesView["series"]): TSeriesView {
  const primary = series[0]?.values ?? [];
  const total = primary.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  let peakIndex: number | null = null;
  primary.forEach((value, index) => {
    if ((value ?? 0) > 0 && (peakIndex === null || (value ?? 0) > (primary[peakIndex] ?? 0))) peakIndex = index;
  });
  const average = days.length > 0 ? total / days.length : 0;
  const stats: TChartStat[] = [
    { label: REPORT_COPY.charts.stats.total, value: formatInt(total) },
    { label: REPORT_COPY.charts.stats.average, value: average.toLocaleString("en-US", { maximumFractionDigits: 1 }) },
  ];
  if (peakIndex !== null) {
    stats.push({
      label: REPORT_COPY.charts.stats.bestDay,
      value: `${shortDayLabel(days[peakIndex] ?? "")} (${formatInt(primary[peakIndex])})`,
    });
  }
  return { dates: days, series, stats, peakIndex };
}

function summarySection(snapshot: TReportSnapshotDto, text: TReportText): TSectionView {
  const copy = REPORT_COPY.sections.summary;
  const { activities, leads, events } = snapshot;
  const h = text.highlights;
  const blocks: TBlockView[] = [
    overviewBlock(snapshot.notes?.written?.executiveSummary, text.summary),
    { type: "heading", title: copy.highlightsHeading },
    {
      type: "cards",
      title: copy.contactHeading,
      items: [
        { icon: "leads", label: REPORT_COPY.kpi.leads, value: formatInt(leads.total), body: h.leads, change: change(leads.total, leads.previousTotal), tone: "brand", empty: formatInt(leads.total) === "0", table: leadsTable(snapshot) },
        { icon: "calls", label: REPORT_COPY.kpi.calls, value: formatInt(events.contacts.call), body: h.calls, change: null, tone: "brand", empty: formatInt(events.contacts.call) === "0" },
        { icon: "emails", label: REPORT_COPY.kpi.emailClicks, value: formatInt(events.contacts.email), body: h.emails, change: null, tone: "cyan", empty: formatInt(events.contacts.email) === "0" },
        { icon: "whatsapp", label: REPORT_COPY.kpi.whatsappClicks, value: formatInt(events.contacts.whatsapp), body: h.whatsapp, change: null, tone: "emerald", empty: formatInt(events.contacts.whatsapp) === "0" },
      ],
    },
    {
      type: "cards",
      title: copy.contentHeading,
      items: [
        { icon: "blogs", label: REPORT_COPY.kpi.blogPosts, value: formatInt(activities.current.blogs), body: h.blogs, change: change(activities.current.blogs, activities.previous.blogs), tone: "cyan", empty: formatInt(activities.current.blogs) === "0" },
        { icon: "backlinks", label: REPORT_COPY.kpi.backlinks, value: formatInt(activities.current.backlinks), body: h.backlinks, change: change(activities.current.backlinks, activities.previous.backlinks), tone: "emerald", empty: formatInt(activities.current.backlinks) === "0" },
        { icon: "technical", label: REPORT_COPY.kpi.technicalTasks, value: formatInt(activities.current.technical_work), body: h.technical, change: change(activities.current.technical_work, activities.previous.technical_work), tone: "amber", empty: formatInt(activities.current.technical_work) === "0" },
      ],
    },
  ];
  return { id: "summary", number: copy.number, title: copy.title, blocks };
}

function searchSection(snapshot: TReportSnapshotDto, text: TReportText): TSectionView {
  const { gsc, sources } = snapshot;
  const copy = REPORT_COPY.sections.search;
  const blocks: TBlockView[] = [overviewBlock(snapshot.notes?.written?.search, text.search)];

  if (sources.gsc) {
    blocks.push({
      type: "kpis",
      items: [
        kpi("clicks", REPORT_COPY.kpi.clicks, formatInt(gsc.current.clicks), "brand", change(gsc.current.clicks, gsc.previous.clicks)),
        kpi("impressions", REPORT_COPY.kpi.impressions, formatInt(gsc.current.impressions), "cyan", change(gsc.current.impressions, gsc.previous.impressions)),
        kpi("ctr", REPORT_COPY.kpi.ctr, formatPercent(gsc.current.ctr), "emerald"),
        kpi("position", REPORT_COPY.kpi.avgPosition, formatPosition(gsc.current.position), "amber"),
      ],
    });
  }
  const tables: TNamedTable[] = [
    {
      title: copy.queriesHeading,
      table: ranked(gsc.topQueries, copy.noQueries, [REPORT_COPY.table.query, REPORT_COPY.table.clicks, REPORT_COPY.table.impressions, REPORT_COPY.table.ctr, REPORT_COPY.table.position], (row) => [
        row.value,
        formatInt(row.clicks),
        formatInt(row.impressions),
        formatPercent(row.ctr),
        formatPosition(row.position),
      ]),
    },
    {
      title: copy.pagesHeading,
      table: ranked(gsc.topPages, copy.noPages, [REPORT_COPY.table.page, REPORT_COPY.table.clicks, REPORT_COPY.table.impressions, REPORT_COPY.table.ctr, REPORT_COPY.table.position], (row) => [
        row.value,
        formatInt(row.clicks),
        formatInt(row.impressions),
        formatPercent(row.ctr),
        formatPosition(row.position),
      ]),
    },
  ];
  if (sources.gsc && gsc.series.length > 1) {
    const days = dayRange(snapshot.period.from, snapshot.period.to);
    blocks.push({
      type: "line",
      title: copy.chartHeading,
      charts: [
        {
          title: REPORT_COPY.charts.clicks.title,
          subtitle: REPORT_COPY.charts.clicks.subtitle,
          chart: lineView(days, [{ name: REPORT_COPY.kpi.clicks, color: REPORT_PALETTE.series[0], values: filledDaily(days, gsc.series.map((point) => ({ date: point.date, value: point.clicks }))) }]),
        },
        {
          title: REPORT_COPY.charts.impressions.title,
          subtitle: REPORT_COPY.charts.impressions.subtitle,
          chart: lineView(days, [{ name: REPORT_COPY.kpi.impressions, color: REPORT_PALETTE.series[1], values: filledDaily(days, gsc.series.map((point) => ({ date: point.date, value: point.impressions }))) }]),
        },
      ],
      tables,
    });
  } else {
    blocks.push({ type: "note", text: copy.noDailySearch });
    tables.forEach((named) => blocks.push({ type: "table", title: named.title, table: named.table }));
  }

  return { id: "search", number: copy.number, title: copy.title, blocks };
}

function trafficSection(snapshot: TReportSnapshotDto, text: TReportText): TSectionView {
  const { ga4, sources } = snapshot;
  const copy = REPORT_COPY.sections.traffic;
  const blocks: TBlockView[] = [overviewBlock(snapshot.notes?.written?.traffic, text.traffic)];

  if (sources.ga4) {
    blocks.push({
      type: "kpis",
      items: [
        kpi("sessions", REPORT_COPY.kpi.sessions, formatInt(ga4.current.sessions), "brand", change(ga4.current.sessions, ga4.previous.sessions)),
        kpi("users", REPORT_COPY.kpi.users, formatInt(ga4.current.totalUsers), "cyan", change(ga4.current.totalUsers, ga4.previous.totalUsers)),
        kpi("newUsers", REPORT_COPY.kpi.newUsers, formatInt(ga4.current.newUsers), "emerald", change(ga4.current.newUsers, ga4.previous.newUsers)),
        kpi("organic", REPORT_COPY.kpi.organicSessions, formatInt(ga4.current.organicSessions), "amber", change(ga4.current.organicSessions, ga4.previous.organicSessions)),
      ],
    });
  }
  const countries = ga4.countries.filter((row) => (row.sessions ?? 0) > 0).slice(0, REPORT_MAX_TOP_COUNTRIES);
  const tables: TNamedTable[] = [
    {
      title: copy.landingHeading,
      table: ranked(ga4.topPages, copy.noPages, [REPORT_COPY.table.page, REPORT_COPY.table.sessions], (row) => [row.value, formatInt(row.sessions)]),
    },
  ];
  if (sources.ga4 && ga4.series.length > 1) {
    const days = dayRange(snapshot.period.from, snapshot.period.to);
    blocks.push({
      type: "line",
      title: copy.chartHeading,
      charts: [
        {
          title: REPORT_COPY.charts.sessions.title,
          subtitle: REPORT_COPY.charts.sessions.subtitle,
          chart: lineView(days, [{ name: REPORT_COPY.kpi.sessions, color: REPORT_PALETTE.series[0], values: filledDaily(days, ga4.series.map((point) => ({ date: point.date, value: point.sessions }))) }]),
        },
      ],
      tables,
    });
  } else {
    blocks.push({ type: "note", text: copy.noDailyTraffic });
    tables.forEach((named) => blocks.push({ type: "table", title: named.title, table: named.table }));
  }
  const channels = ga4.channels.filter((row) => (row.sessions ?? 0) > 0).slice(0, 6);
  const countryRows = countries.map((row) => ({ label: row.value, value: row.sessions ?? 0 }));
  if (channels.length > 0) {
    blocks.push({
      type: "donut",
      title: copy.channelsHeading,
      subtitle: REPORT_COPY.charts.channels.subtitle,
      rows: barRows(channels.map((row) => ({ label: row.value, value: row.sessions ?? 0 }))),
      list: { title: REPORT_COPY.charts.countries.title, subtitle: REPORT_COPY.charts.countries.subtitle, rows: barRows(countryRows), emptyText: copy.noCountries },
    });
  } else {
    blocks.push({
      type: "table",
      title: copy.countriesHeading,
      table: ranked(ga4.countries, copy.noCountries, [REPORT_COPY.table.country, REPORT_COPY.table.sessions], (row) => [row.value, formatInt(row.sessions)]),
    });
  }

  return { id: "traffic", number: copy.number, title: copy.title, blocks };
}

function engagementSection(snapshot: TReportSnapshotDto, text: TReportText): TSectionView {
  const { ga4, events, sources, leads } = snapshot;
  const copy = REPORT_COPY.sections.engagement;
  const blocks: TBlockView[] = [overviewBlock(snapshot.notes?.written?.leads, text.engagement)];

  blocks.push({
    type: "cards",
    title: copy.leadsHeading,
    items: [
      {
        icon: "leads",
        label: REPORT_COPY.kpi.leads,
        value: formatInt(leads.total),
        body: "",
        change: change(leads.total, leads.previousTotal),
        tone: "brand",
        empty: leads.total === 0,
        table: leadsTable(snapshot),
      },
    ],
  });

  blocks.push({ type: "heading", title: copy.engagementHeading });
  if (sources.ga4) {
    blocks.push({
      type: "kpis",
      items: [
        kpi("engagementRate", REPORT_COPY.kpi.engagementRate, formatPercent(ga4.current.engagementRate), "brand"),
        kpi("time", REPORT_COPY.kpi.avgTimeOnSite, formatDuration(ga4.current.avgSessionDuration), "cyan"),
        kpi("pageViews", REPORT_COPY.kpi.pageViews, formatInt(ga4.current.pageViews), "emerald"),
        kpi("engaged", REPORT_COPY.kpi.engagedSessions, formatInt(ga4.current.engagedSessions), "amber"),
      ],
    });
  }
  if (events.highlights.length > 0) {
    blocks.push({
      type: "bullets",
      title: copy.eventsHeading,
      items: events.highlights.slice(0, REPORT_MAX_TOP_EVENTS).map((item) => describeEvent(item.label, item.count)),
    });
  }

  return { id: "engagement", number: copy.number, title: copy.title, blocks };
}

function leadsTable(snapshot: TReportSnapshotDto): TTableView {
  return {
    headers: [REPORT_COPY.table.name, REPORT_COPY.table.email, REPORT_COPY.table.date, REPORT_COPY.table.source],
    rows: (snapshot.leads.rows ?? []).slice(0, REPORT_MAX_ACTIVITY_ROWS).map((row) => [
      row.name || "—",
      row.email,
      row.leadDate,
      REPORT_COPY.origins[row.origin as keyof typeof REPORT_COPY.origins] ?? row.origin,
    ]),
    emptyText: REPORT_COPY.table.noLeads,
  };
}

function activityTable(rows: TReportActivityItemDto[] | undefined): TTableView {
  return {
    headers: [REPORT_COPY.table.title, REPORT_COPY.table.url, REPORT_COPY.table.date, REPORT_COPY.table.notes],
    rows: (rows ?? []).slice(0, REPORT_MAX_ACTIVITY_ROWS).map((row) => [row.title, row.url, row.occurredOn, row.anchorText || row.details || "—"]),
    emptyText: "",
  };
}

function workSection(snapshot: TReportSnapshotDto, text: TReportText): TSectionView {
  const { activities } = snapshot;
  const copy = REPORT_COPY.sections.work;
  const blocks: TBlockView[] = [
    overviewBlock(snapshot.notes?.written?.work, text.work),
    {
      type: "cards",
      title: copy.cardsHeading,
      items: [
        {
          icon: "blogs",
          label: REPORT_COPY.kpi.blogPosts,
          value: formatInt(activities.current.blogs),
          body: copy.blogsHint,
          change: change(activities.current.blogs, activities.previous.blogs),
          tone: "cyan",
          empty: activities.current.blogs === 0,
          table: activityTable(activities.blogs),
        },
        {
          icon: "backlinks",
          label: REPORT_COPY.kpi.backlinks,
          value: formatInt(activities.current.backlinks),
          body: copy.backlinksHint,
          change: change(activities.current.backlinks, activities.previous.backlinks),
          tone: "emerald",
          empty: activities.current.backlinks === 0,
          table: activityTable(activities.backlinks),
        },
        {
          icon: "technical",
          label: REPORT_COPY.kpi.technicalTasks,
          value: formatInt(activities.current.technical_work),
          body: copy.technicalHint,
          change: change(activities.current.technical_work, activities.previous.technical_work),
          tone: "amber",
          empty: activities.current.technical_work === 0,
          table: activityTable(activities.technical),
        },
      ],
    },
  ];

  return { id: "work", number: copy.number, title: copy.title, blocks };
}

/** Written next steps for the client. Shows a note when none were written (older reports). */
function nextStepsSection(snapshot: TReportSnapshotDto): TSectionView {
  const copy = REPORT_COPY.sections.next;
  const doc = snapshot.notes?.nextSteps;
  const blocks: TBlockView[] = doc ? [{ type: "rich", doc }] : [{ type: "note", text: copy.empty }];
  return { id: "next", number: copy.number, title: copy.title, blocks };
}

export type TReportViewOptions = {
  /** Adds the Next steps tab. Dashboard only; the PDF does not include it yet. */
  nextSteps?: boolean;
};

/** Builds the full report view from a stored snapshot. Pure: no I/O. */
export function buildReportView(snapshot: TReportSnapshotDto, options: TReportViewOptions = {}): TReportView {
  const monthTitle = formatMonthTitle(snapshot.period.from);
  const text = buildReportText(snapshot);
  const sections = [
    summarySection(snapshot, text),
    searchSection(snapshot, text),
    trafficSection(snapshot, text),
    engagementSection(snapshot, text),
    workSection(snapshot, text),
  ];
  if (options.nextSteps) sections.push(nextStepsSection(snapshot));
  return {
    title: `${snapshot.project.name} — ${monthTitle}`,
    cover: {
      clientName: snapshot.project.name,
      clientLogoDataUri: snapshot.project.logoDataUri,
      monthTitle,
      dateLabel: formatMonthTitle(snapshot.period.to),
      periodLabel: formatPeriodLabel(snapshot.period.from, snapshot.period.to),
      websiteUrl: snapshot.project.websiteUrl,
    },
    sections,
    contact: {
      phones: [...REPORT_BRAND.phones],
      addresses: [...REPORT_BRAND.addresses],
      email: REPORT_BRAND.email,
      website: REPORT_BRAND.website,
    },
    legal: REPORT_COPY.legal,
  };
}
