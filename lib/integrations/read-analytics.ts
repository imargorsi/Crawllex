import type { AnalyticsDimensionsQuery, AnalyticsOverviewQuery } from "@/schemas/analytics";
import { AnalyticsDailyMetric, AnalyticsDimensionRow } from "@/models";
import { addUtcDays, inclusiveDaySpan } from "@/lib/integrations/date.utils";
import { getProjectIntegrationsMap } from "@/lib/integrations/sync-analytics";
import type {
  TAnalyticsCardMetricDto,
  TAnalyticsDimensionRowDto,
  TAnalyticsDimensionTrend,
  TAnalyticsDimensionsDto,
  TAnalyticsOverviewDto,
} from "@/types/analytics.types";

type TGscTotals = {
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
};

type TAggregatedDimension = Omit<TAnalyticsDimensionRowDto, "trend" | "ctr" | "position"> & {
  ctr: number | null;
  position: number | null;
};

/** Ranking metric per dimension: clicks (GSC), else sessions (GA4), else event count (GA4 events). */
function primaryMetric(row: {
  clicks?: number | null;
  sessions?: number | null;
  eventCount?: number | null;
}): number {
  return (row.clicks ?? 0) || (row.sessions ?? 0) || (row.eventCount ?? 0);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function cardMetric(value: number | null, sparkline: number[]): TAnalyticsCardMetricDto {
  return { value, sparkline };
}

function buildCardSparklines(
  metrics: Array<{
    date: string;
    source: string;
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    position: number | null;
  }>,
): {
  clicks: number[];
  impressions: number[];
  ctr: number[];
  position: number[];
} {
  const gsc = metrics
    .filter((m) => m.source === "gsc")
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    clicks: gsc.map((m) => m.clicks ?? 0),
    impressions: gsc.map((m) => m.impressions ?? 0),
    ctr: gsc.map((m) => (m.ctr ?? 0) * 100),
    // Invert so improvement (lower rank) trends upward on the sparkline.
    position: gsc.map((m) => (m.position == null ? 0 : -m.position)),
  };
}

function buildEngagementSparklines(
  metrics: Array<{
    date: string;
    source: string;
    sessions: number | null;
    engagedSessions: number | null;
    averageSessionDuration: number | null;
    screenPageViews: number | null;
  }>,
): {
  engagementRate: number[];
  avgSessionDuration: number[];
  pageViews: number[];
} {
  const ga4 = metrics
    .filter((m) => m.source === "ga4")
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const hasDurationCoverage =
    ga4.length > 0 && ga4.every((m) => m.averageSessionDuration != null);
  const hasPageViewCoverage =
    ga4.length > 0 && ga4.every((m) => m.screenPageViews != null);

  return {
    engagementRate: ga4.map((m) => {
      const daySessions = m.sessions ?? 0;
      if (daySessions <= 0) return 0;
      return (m.engagedSessions ?? 0) / daySessions;
    }),
    // Omit sparklines until every day in-range has the new field (avoids fake zeros).
    avgSessionDuration: hasDurationCoverage
      ? ga4.map((m) => m.averageSessionDuration ?? 0)
      : [],
    pageViews: hasPageViewCoverage ? ga4.map((m) => m.screenPageViews ?? 0) : [],
  };
}

function aggregateGa4Engagement(
  metrics: Array<{
    source: string;
    sessions: number | null;
    engagedSessions: number | null;
    averageSessionDuration: number | null;
    screenPageViews: number | null;
  }>,
): {
  engagementRate: number | null;
  avgSessionDuration: number | null;
  pageViews: number | null;
} {
  const ga4 = metrics.filter((m) => m.source === "ga4");
  let sessions = 0;
  let engagedSessions = 0;
  let durationWeighted = 0;
  let durationSessions = 0;
  let pageViews = 0;

  const hasDurationCoverage =
    ga4.length > 0 && ga4.every((m) => m.averageSessionDuration != null);
  const hasPageViewCoverage =
    ga4.length > 0 && ga4.every((m) => m.screenPageViews != null);

  for (const metric of ga4) {
    const daySessions = metric.sessions ?? 0;
    sessions += daySessions;
    engagedSessions += metric.engagedSessions ?? 0;

    if (hasDurationCoverage && metric.averageSessionDuration != null && daySessions > 0) {
      durationWeighted += metric.averageSessionDuration * daySessions;
      durationSessions += daySessions;
    }
    if (hasPageViewCoverage) {
      pageViews += metric.screenPageViews ?? 0;
    }
  }

  return {
    engagementRate: sessions > 0 ? engagedSessions / sessions : null,
    avgSessionDuration:
      hasDurationCoverage && durationSessions > 0
        ? durationWeighted / durationSessions
        : null,
    pageViews: hasPageViewCoverage ? pageViews : null,
  };
}

function resolveTrend(
  current: number,
  previous: number | undefined,
): TAnalyticsDimensionTrend | null {
  if (previous == null) return null;
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

function aggregateGscTotals(
  metrics: Array<{
    source: string;
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    position: number | null;
  }>,
): TGscTotals {
  let clicks = 0;
  let impressions = 0;
  const ctrValues: number[] = [];
  const positionValues: number[] = [];

  for (const metric of metrics) {
    if (metric.source !== "gsc") continue;
    clicks += metric.clicks ?? 0;
    impressions += metric.impressions ?? 0;
    if (metric.ctr != null) ctrValues.push(metric.ctr);
    if (metric.position != null) positionValues.push(metric.position);
  }

  const gscRows = metrics.filter((m) => m.source === "gsc");
  const weightedCtr =
    impressions > 0
      ? gscRows.reduce((sum, m) => sum + (m.ctr ?? 0) * (m.impressions ?? 0), 0) / impressions
      : average(ctrValues);

  const gscWithPosition = gscRows.filter((m) => m.position != null);
  const positionWeight = gscWithPosition.reduce((sum, m) => sum + (m.impressions ?? 0), 0);
  const weightedPosition =
    positionWeight > 0
      ? gscWithPosition.reduce((sum, m) => sum + (m.position ?? 0) * (m.impressions ?? 0), 0) /
        positionWeight
      : average(positionValues);

  return {
    clicks,
    impressions,
    ctr: weightedCtr,
    position: weightedPosition,
  };
}

function aggregateDimensionRows(
  rows: Array<{
    dimensionValue: string;
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    position: number | null;
    sessions: number | null;
    totalUsers: number | null;
    eventCount?: number | null;
  }>,
): Map<string, TAggregatedDimension> {
  const aggregated = new Map<string, TAggregatedDimension>();

  for (const row of rows) {
    const existing = aggregated.get(row.dimensionValue) ?? {
      dimensionValue: row.dimensionValue,
      clicks: 0,
      impressions: 0,
      ctr: null,
      position: null,
      sessions: 0,
      totalUsers: 0,
      eventCount: 0,
    };

    existing.clicks = (existing.clicks ?? 0) + (row.clicks ?? 0);
    existing.impressions = (existing.impressions ?? 0) + (row.impressions ?? 0);
    existing.sessions = (existing.sessions ?? 0) + (row.sessions ?? 0);
    existing.totalUsers = (existing.totalUsers ?? 0) + (row.totalUsers ?? 0);
    existing.eventCount = (existing.eventCount ?? 0) + (row.eventCount ?? 0);

    if (row.position != null) {
      existing.position = (existing.position ?? 0) + row.position * (row.impressions ?? 1);
    }
    if (row.ctr != null) {
      existing.ctr = (existing.ctr ?? 0) + row.ctr * (row.impressions ?? 1);
    }

    aggregated.set(row.dimensionValue, existing);
  }

  for (const [key, row] of aggregated) {
    const impressions = row.impressions ?? 0;
    aggregated.set(key, {
      ...row,
      ctr: impressions > 0 && row.ctr != null ? row.ctr / impressions : null,
      position: impressions > 0 && row.position != null ? row.position / impressions : row.position,
    });
  }

  return aggregated;
}

export async function getAnalyticsOverview(
  projectId: string,
  query: AnalyticsOverviewQuery,
): Promise<TAnalyticsOverviewDto> {
  const [allMetrics, integrations] = await Promise.all([
    AnalyticsDailyMetric.find({
      projectId,
      date: { $gte: query.from, $lte: query.to },
    }).sort({ date: 1 }),
    getProjectIntegrationsMap(projectId),
  ]);

  const filteredMetrics = allMetrics;
  const filteredGsc = aggregateGscTotals(filteredMetrics);
  const sparklines = buildCardSparklines(filteredMetrics);
  const engagementTotals = aggregateGa4Engagement(filteredMetrics);
  const engagementSparklines = buildEngagementSparklines(filteredMetrics);

  let sessions = 0;
  let totalUsers = 0;
  let newUsers = 0;
  let engagedSessions = 0;
  let organicSessions = 0;

  const seriesMap = new Map<
    string,
    {
      date: string;
      clicks: number | null;
      impressions: number | null;
      ctr: number | null;
      position: number | null;
      sessions: number | null;
      organicSessions: number | null;
    }
  >();

  for (const metric of filteredMetrics) {
    const entry = seriesMap.get(metric.date) ?? {
      date: metric.date,
      clicks: null,
      impressions: null,
      ctr: null,
      position: null,
      sessions: null,
      organicSessions: null,
    };

    if (metric.source === "gsc") {
      entry.clicks = metric.clicks;
      entry.impressions = metric.impressions;
      entry.ctr = metric.ctr;
      entry.position = metric.position;
    }

    if (metric.source === "ga4") {
      sessions += metric.sessions ?? 0;
      totalUsers += metric.totalUsers ?? 0;
      newUsers += metric.newUsers ?? 0;
      engagedSessions += metric.engagedSessions ?? 0;
      organicSessions += metric.organicSessions ?? 0;
      entry.sessions = metric.sessions;
      entry.organicSessions = metric.organicSessions;
    }

    seriesMap.set(metric.date, entry);
  }

  return {
    from: query.from,
    to: query.to,
    cards: {
      clicks: cardMetric(filteredGsc.clicks, sparklines.clicks),
      impressions: cardMetric(filteredGsc.impressions, sparklines.impressions),
      ctr: cardMetric(filteredGsc.ctr, sparklines.ctr),
      position: cardMetric(filteredGsc.position, sparklines.position),
    },
    gsc: filteredGsc,
    ga4: {
      sessions,
      totalUsers,
      newUsers,
      engagedSessions,
      organicSessions,
    },
    engagement: {
      engagementRate: cardMetric(
        engagementTotals.engagementRate,
        engagementSparklines.engagementRate,
      ),
      avgSessionDuration: cardMetric(
        engagementTotals.avgSessionDuration,
        engagementSparklines.avgSessionDuration,
      ),
      pageViews: cardMetric(engagementTotals.pageViews, engagementSparklines.pageViews),
    },
    series: [...seriesMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    integrations,
  };
}

export async function getAnalyticsDimensions(
  projectId: string,
  query: AnalyticsDimensionsQuery,
): Promise<TAnalyticsDimensionsDto> {
  const spanDays = inclusiveDaySpan(query.from, query.to);
  const priorTo = addUtcDays(query.from, -1);
  const priorFrom = addUtcDays(priorTo, -(spanDays - 1));

  const [currentRows, priorRows] = await Promise.all([
    AnalyticsDimensionRow.find({
      projectId,
      source: query.source,
      dimensionType: query.dimensionType,
      date: { $gte: query.from, $lte: query.to },
    }),
    AnalyticsDimensionRow.find({
      projectId,
      source: query.source,
      dimensionType: query.dimensionType,
      date: { $gte: priorFrom, $lte: priorTo },
    }),
  ]);

  const current = aggregateDimensionRows(currentRows);
  const prior = aggregateDimensionRows(priorRows);

  const result: TAnalyticsDimensionRowDto[] = [...current.values()].map((row) => {
    const priorRow = prior.get(row.dimensionValue);
    const currentPrimary = primaryMetric(row);
    const priorPrimary = priorRow == null ? undefined : primaryMetric(priorRow);

    return {
      ...row,
      trend: resolveTrend(currentPrimary, priorPrimary),
    };
  });

  result.sort((a, b) => {
    return primaryMetric(b) - primaryMetric(a);
  });

  return {
    from: query.from,
    to: query.to,
    source: query.source,
    dimensionType: query.dimensionType,
    rows: result.slice(0, query.limit),
  };
}
