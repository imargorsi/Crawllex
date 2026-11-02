import { REPORT_COPY } from "@/lib/reports/copy";
import { REPORT_BRAND, REPORT_MAX_BLOG_ROWS, REPORT_PALETTE } from "@/lib/reports/constants";
import { formatDuration, formatInt, formatPercent, formatPosition, relativeChange, type TChange } from "@/lib/reports/format";
import { formatMonthTitle, formatPeriodLabel } from "@/lib/reports/period";
import type { TReportNarrativeSectionDto, TReportRankedRowDto, TReportSnapshotDto } from "@/types/reports.types";

/**
 * One view of a report snapshot. The PDF renderer and the in-app report page both render this
 * structure, so the wording and numbers are identical in both. Add report content here, not in the
 * renderers.
 */

export type TReportTone = "brand" | "cyan" | "emerald" | "amber" | "neutral";

export type TChangeView = { direction: TChange["direction"]; text: string };

export type TKpiView = { label: string; value: string; change: TChangeView | null; tone: TReportTone };

export type TTableView = { headers: string[]; rows: string[][]; emptyText: string };

export type TSeriesView = {
  dates: string[];
  series: { name: string; color: string; values: Array<number | null> }[];
};

export type TBlockView =
  | { type: "paragraphs"; items: string[] }
  | { type: "list"; title: string; items: string[] }
  | { type: "kpis"; items: TKpiView[] }
  | { type: "chips"; items: { label: string; value: string; tone: TReportTone }[] }
  | { type: "line"; title: string | null; chart: TSeriesView }
  | { type: "bars"; title: string; rows: { label: string; value: number }[] }
  | { type: "donut"; title: string; rows: { label: string; value: number }[] }
  | { type: "table"; title: string; table: TTableView }
  | { type: "callout"; title: string; text: string }
  | { type: "note"; text: string };

export type TSectionView = {
  id: "summary" | "search" | "searchPages" | "traffic" | "audience" | "engagement" | "leads" | "notes";
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

function kpi(label: string, value: string, tone: TReportTone, delta?: TChangeView | null): TKpiView {
  return { label, value, change: delta ?? null, tone };
}

function ranked(rows: TReportRankedRowDto[], emptyText: string, headers: string[], columns: (row: TReportRankedRowDto) => string[]): TTableView {
  return { headers, rows: rows.map(columns), emptyText };
}

function narrative(snapshot: TReportSnapshotDto, key: TReportNarrativeSectionDto["key"]): string[] {
  return snapshot.narrative.sections.find((section) => section.key === key)?.paragraphs ?? [];
}

function lineView(dates: string[], series: TSeriesView["series"]): TSeriesView {
  return { dates, series };
}

function searchSection(snapshot: TReportSnapshotDto): TSectionView {
  const { gsc, sources } = snapshot;
  const copy = REPORT_COPY.sections.search;
  const blocks: TBlockView[] = [];

  if (sources.gsc) {
    blocks.push({
      type: "kpis",
      items: [
        kpi(REPORT_COPY.kpi.clicks, formatInt(gsc.current.clicks), "brand", change(gsc.current.clicks, gsc.previous.clicks)),
        kpi(REPORT_COPY.kpi.impressions, formatInt(gsc.current.impressions), "cyan", change(gsc.current.impressions, gsc.previous.impressions)),
        kpi(REPORT_COPY.kpi.ctr, formatPercent(gsc.current.ctr), "emerald"),
        kpi(REPORT_COPY.kpi.avgPosition, formatPosition(gsc.current.position), "amber"),
      ],
    });
  }
  blocks.push({ type: "paragraphs", items: narrative(snapshot, "search") });
  if (sources.gsc && gsc.series.length > 1) {
    blocks.push({
      type: "line",
      title: null,
      chart: lineView(
        gsc.series.map((point) => point.date),
        [
          { name: REPORT_COPY.kpi.clicks, color: REPORT_PALETTE.series[0], values: gsc.series.map((point) => point.clicks) },
          { name: REPORT_COPY.kpi.impressions, color: REPORT_PALETTE.series[1], values: gsc.series.map((point) => point.impressions) },
        ]
      ),
    });
  } else {
    blocks.push({ type: "note", text: copy.noDailySearch });
  }
  blocks.push({
    type: "table",
    title: copy.queriesHeading,
    table: ranked(gsc.topQueries, copy.noQueries, [REPORT_COPY.table.query, REPORT_COPY.table.clicks, REPORT_COPY.table.impressions, REPORT_COPY.table.ctr, REPORT_COPY.table.position], (row) => [
      row.value,
      formatInt(row.clicks),
      formatInt(row.impressions),
      formatPercent(row.ctr),
      formatPosition(row.position),
    ]),
  });

  return { id: "search", number: copy.number, title: copy.title, blocks };
}

function searchPagesSection(snapshot: TReportSnapshotDto): TSectionView {
  const copy = REPORT_COPY.sections.searchPages;
  return {
    id: "searchPages",
    number: copy.number,
    title: copy.title,
    blocks: [
      {
        type: "table",
        title: copy.heading,
        table: ranked(snapshot.gsc.topPages, copy.noPages, [REPORT_COPY.table.page, REPORT_COPY.table.clicks, REPORT_COPY.table.impressions, REPORT_COPY.table.ctr, REPORT_COPY.table.position], (row) => [
          row.value,
          formatInt(row.clicks),
          formatInt(row.impressions),
          formatPercent(row.ctr),
          formatPosition(row.position),
        ]),
      },
    ],
  };
}

function trafficSection(snapshot: TReportSnapshotDto): TSectionView {
  const { ga4, sources } = snapshot;
  const copy = REPORT_COPY.sections.traffic;
  const blocks: TBlockView[] = [];

  if (sources.ga4) {
    blocks.push({
      type: "kpis",
      items: [
        kpi(REPORT_COPY.kpi.sessions, formatInt(ga4.current.sessions), "brand", change(ga4.current.sessions, ga4.previous.sessions)),
        kpi(REPORT_COPY.kpi.users, formatInt(ga4.current.totalUsers), "cyan", change(ga4.current.totalUsers, ga4.previous.totalUsers)),
        kpi(REPORT_COPY.kpi.newUsers, formatInt(ga4.current.newUsers), "emerald", change(ga4.current.newUsers, ga4.previous.newUsers)),
        kpi(REPORT_COPY.kpi.organicSessions, formatInt(ga4.current.organicSessions), "amber", change(ga4.current.organicSessions, ga4.previous.organicSessions)),
      ],
    });
  }
  blocks.push({ type: "paragraphs", items: narrative(snapshot, "traffic") });
  if (sources.ga4 && ga4.series.length > 1) {
    blocks.push({
      type: "line",
      title: null,
      chart: lineView(
        ga4.series.map((point) => point.date),
        [{ name: REPORT_COPY.kpi.sessions, color: REPORT_PALETTE.series[0], values: ga4.series.map((point) => point.sessions) }]
      ),
    });
  } else {
    blocks.push({ type: "note", text: copy.noDailyTraffic });
  }
  const channels = ga4.channels.filter((row) => (row.sessions ?? 0) > 0).slice(0, 6);
  if (channels.length > 0) {
    blocks.push({
      type: "donut",
      title: copy.channelsHeading,
      rows: channels.map((row) => ({ label: row.value, value: row.sessions ?? 0 })),
    });
  }

  return { id: "traffic", number: copy.number, title: copy.title, blocks };
}

function audienceSection(snapshot: TReportSnapshotDto): TSectionView {
  const copy = REPORT_COPY.sections.audience;
  return {
    id: "audience",
    number: copy.number,
    title: copy.title,
    blocks: [
      {
        type: "table",
        title: copy.countriesHeading,
        table: ranked(snapshot.ga4.countries, copy.noCountries, [REPORT_COPY.table.country, REPORT_COPY.table.sessions], (row) => [row.value, formatInt(row.sessions)]),
      },
      {
        type: "table",
        title: copy.landingHeading,
        table: ranked(snapshot.ga4.topPages, copy.noPages, [REPORT_COPY.table.page, REPORT_COPY.table.sessions], (row) => [row.value, formatInt(row.sessions)]),
      },
    ],
  };
}

function engagementSection(snapshot: TReportSnapshotDto): TSectionView {
  const { ga4, events, sources } = snapshot;
  const copy = REPORT_COPY.sections.engagement;
  const blocks: TBlockView[] = [];

  if (sources.ga4) {
    blocks.push({
      type: "kpis",
      items: [
        kpi(REPORT_COPY.kpi.engagementRate, formatPercent(ga4.current.engagementRate), "brand"),
        kpi(REPORT_COPY.kpi.avgTimeOnSite, formatDuration(ga4.current.avgSessionDuration), "cyan"),
        kpi(REPORT_COPY.kpi.pageViews, formatInt(ga4.current.pageViews), "emerald"),
        kpi(REPORT_COPY.kpi.engagedSessions, formatInt(ga4.current.engagedSessions), "amber"),
      ],
    });
  }
  blocks.push({
    type: "chips",
    items: [
      { label: REPORT_COPY.kpi.calls, value: formatInt(events.contacts.call), tone: "brand" },
      { label: REPORT_COPY.kpi.emailClicks, value: formatInt(events.contacts.email), tone: "cyan" },
      { label: REPORT_COPY.kpi.whatsappClicks, value: formatInt(events.contacts.whatsapp), tone: "emerald" },
    ],
  });
  blocks.push({ type: "paragraphs", items: narrative(snapshot, "engagement") });
  if (events.highlights.length > 0) {
    blocks.push({
      type: "table",
      title: copy.actionsHeading,
      table: {
        headers: [REPORT_COPY.table.action, REPORT_COPY.table.count],
        rows: events.highlights.map((item) => [item.label, formatInt(item.count)]),
        emptyText: "",
      },
    });
  }

  return { id: "engagement", number: copy.number, title: copy.title, blocks };
}

function leadsSection(snapshot: TReportSnapshotDto): TSectionView {
  const { leads, activities } = snapshot;
  const copy = REPORT_COPY.sections.leads;
  const origins = Object.entries(leads.byOrigin)
    .filter(([, count]) => count > 0)
    .map(([origin, count]) => [REPORT_COPY.origins[origin as keyof typeof REPORT_COPY.origins] ?? origin, formatInt(count)]);
  const blocks: TBlockView[] = [
    {
      type: "kpis",
      items: [
        kpi(REPORT_COPY.kpi.leads, formatInt(leads.total), "brand", change(leads.total, leads.previousTotal)),
        kpi(REPORT_COPY.kpi.blogPosts, formatInt(activities.current.blogs), "cyan", change(activities.current.blogs, activities.previous.blogs)),
        kpi(REPORT_COPY.kpi.backlinks, formatInt(activities.current.backlinks), "emerald", change(activities.current.backlinks, activities.previous.backlinks)),
        kpi(REPORT_COPY.kpi.technicalTasks, formatInt(activities.current.technical_work), "amber"),
      ],
    },
    { type: "paragraphs", items: narrative(snapshot, "leads") },
  ];
  if (origins.length > 0) {
    blocks.push({
      type: "donut",
      title: copy.sourcesHeading,
      rows: Object.entries(leads.byOrigin)
        .filter(([, count]) => count > 0)
        .map(([origin, count]) => ({ label: REPORT_COPY.origins[origin as keyof typeof REPORT_COPY.origins] ?? origin, value: count })),
    });
  }
  blocks.push({
    type: "table",
    title: copy.workHeading,
    table: {
      headers: [REPORT_COPY.table.type, REPORT_COPY.table.thisPeriod, REPORT_COPY.table.previousPeriod],
      rows: [
        [REPORT_COPY.workTypes.blogs, formatInt(activities.current.blogs), formatInt(activities.previous.blogs)],
        [REPORT_COPY.workTypes.backlinks, formatInt(activities.current.backlinks), formatInt(activities.previous.backlinks)],
        [REPORT_COPY.workTypes.technicalWork, formatInt(activities.current.technical_work), formatInt(activities.previous.technical_work)],
      ],
      emptyText: "",
    },
  });
  blocks.push({ type: "paragraphs", items: narrative(snapshot, "content") });
  if (activities.blogs.length > 0) {
    blocks.push({
      type: "table",
      title: copy.blogsHeading,
      table: {
        headers: [REPORT_COPY.table.title, REPORT_COPY.table.date],
        rows: activities.blogs.slice(0, REPORT_MAX_BLOG_ROWS).map((blog) => [blog.title, blog.occurredOn]),
        emptyText: "",
      },
    });
  }

  return { id: "leads", number: copy.number, title: copy.title, blocks };
}

function notesSection(snapshot: TReportSnapshotDto): TSectionView {
  const { notes } = snapshot;
  const copy = REPORT_COPY.sections.notes;
  const blocks: TBlockView[] = [];
  if (notes.highlights.length > 0) blocks.push({ type: "list", title: copy.highlightsHeading, items: notes.highlights });
  if (notes.translationStatus) blocks.push({ type: "callout", title: copy.translationHeading, text: notes.translationStatus });
  if (notes.closingNote) blocks.push({ type: "list", title: copy.nextStepsHeading, items: [notes.closingNote] });
  if (blocks.length === 0) blocks.push({ type: "note", text: copy.none });
  return { id: "notes", number: copy.number, title: copy.title, blocks };
}

function summarySection(snapshot: TReportSnapshotDto): TSectionView {
  const { gsc, ga4, leads, activities, sources, narrative: story } = snapshot;
  const copy = REPORT_COPY.sections.summary;
  return {
    id: "summary",
    number: copy.number,
    title: copy.title,
    blocks: [
      {
        type: "kpis",
        items: [
          kpi(REPORT_COPY.kpi.searchClicks, formatInt(gsc.current.clicks), "brand", sources.gsc ? change(gsc.current.clicks, gsc.previous.clicks) : null),
          kpi(REPORT_COPY.kpi.impressions, formatInt(gsc.current.impressions), "cyan", sources.gsc ? change(gsc.current.impressions, gsc.previous.impressions) : null),
          kpi(REPORT_COPY.kpi.sessions, formatInt(ga4.current.sessions), "emerald", sources.ga4 ? change(ga4.current.sessions, ga4.previous.sessions) : null),
          kpi(REPORT_COPY.kpi.users, formatInt(ga4.current.totalUsers), "amber", sources.ga4 ? change(ga4.current.totalUsers, ga4.previous.totalUsers) : null),
          kpi(REPORT_COPY.kpi.leads, formatInt(leads.total), "brand", change(leads.total, leads.previousTotal)),
          kpi(REPORT_COPY.kpi.blogPosts, formatInt(activities.current.blogs), "cyan", change(activities.current.blogs, activities.previous.blogs)),
          kpi(REPORT_COPY.kpi.avgPosition, formatPosition(gsc.current.position), "emerald"),
          kpi(REPORT_COPY.kpi.clickThroughRate, formatPercent(gsc.current.ctr), "amber"),
        ],
      },
      { type: "list", title: copy.summaryHeading, items: story.executiveSummary },
      { type: "list", title: copy.findingsHeading, items: story.keyFindings },
    ],
  };
}

/** Builds the full report view from a stored snapshot. Pure: no I/O. */
export function buildReportView(snapshot: TReportSnapshotDto): TReportView {
  const monthTitle = formatMonthTitle(snapshot.period.from);
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
    sections: [
      summarySection(snapshot),
      searchSection(snapshot),
      searchPagesSection(snapshot),
      trafficSection(snapshot),
      audienceSection(snapshot),
      engagementSection(snapshot),
      leadsSection(snapshot),
      notesSection(snapshot),
    ],
    contact: {
      phones: [...REPORT_BRAND.phones],
      addresses: [...REPORT_BRAND.addresses],
      email: REPORT_BRAND.email,
      website: REPORT_BRAND.website,
    },
    legal: REPORT_COPY.legal,
  };
}
