import { Types } from "mongoose";

import { summarizeEvents } from "@/lib/analytics/event-summary";
import { getAnalyticsDimensions, getAnalyticsOverview } from "@/lib/integrations/read-analytics";
import { AnalyticsDailyMetric, Lead, Project, SeoActivity } from "@/models";
import { REPORT_MAX_BLOG_ROWS, REPORT_TOP_ROWS } from "@/lib/reports/constants";
import { resolveReportPeriod } from "@/lib/reports/period";
import type { TAnalyticsDimensionRowDto, TAnalyticsOverviewDto } from "@/types/analytics.types";
import type {
  TReportAnalyticsTotalsDto,
  TReportPeriodDto,
  TReportRankedRowDto,
  TReportSearchTotalsDto,
  TReportSeriesPointDto,
  TReportSnapshotDto,
} from "@/types/reports.types";

type TCollectedBase = Omit<TReportSnapshotDto, "version" | "generatedAt" | "narrative" | "notes">;

/** Event kinds that describe visitor actions. Page views and session starts are left out. */
const BUSINESS_EVENT_KINDS = new Set(["lead", "download", "click", "other"]);

const KIND_LABELS: Record<string, string> = {
  lead: "Form starts",
  download: "File downloads",
  click: "Tracked clicks",
};

/** Top-N size per dimension. Events need the longer list so contact-kind totals are complete. */
function dimensionLimit(dimensionType: string): number {
  return dimensionType === "event_name" ? 100 : REPORT_TOP_ROWS;
}

function toRanked(rows: TAnalyticsDimensionRowDto[]): TReportRankedRowDto[] {
  return rows.map((row) => ({
    value: row.dimensionValue,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
    sessions: row.sessions,
  }));
}

function searchTotals(overview: TAnalyticsOverviewDto): TReportSearchTotalsDto {
  return {
    clicks: overview.gsc.clicks,
    impressions: overview.gsc.impressions,
    ctr: overview.gsc.ctr,
    position: overview.gsc.position,
  };
}

function analyticsTotals(overview: TAnalyticsOverviewDto): TReportAnalyticsTotalsDto {
  return {
    sessions: overview.ga4.sessions,
    totalUsers: overview.ga4.totalUsers,
    newUsers: overview.ga4.newUsers,
    engagedSessions: overview.ga4.engagedSessions,
    organicSessions: overview.ga4.organicSessions,
    engagementRate: overview.engagement.engagementRate.value,
    avgSessionDuration: overview.engagement.avgSessionDuration.value,
    pageViews: overview.engagement.pageViews.value,
  };
}

function series(overview: TAnalyticsOverviewDto): TReportSeriesPointDto[] {
  return overview.series.map((point) => ({
    date: point.date,
    clicks: point.clicks,
    impressions: point.impressions,
    sessions: point.sessions,
  }));
}

async function countLeads(projectId: string, from: string, to: string) {
  const rows = await Lead.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        projectId: new Types.ObjectId(projectId),
        leadDate: { $gte: from, $lte: to },
      },
    },
    { $group: { _id: "$origin", count: { $sum: 1 } } },
  ]);
  const byOrigin: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    byOrigin[row._id] = row.count;
    total += row.count;
  }
  return { total, byOrigin };
}

async function countActivities(projectId: string, from: string, to: string) {
  const rows = await SeoActivity.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        projectId: new Types.ObjectId(projectId),
        occurredOn: { $gte: from, $lte: to },
      },
    },
    { $group: { _id: "$activityType", count: { $sum: 1 } } },
  ]);
  const counts: Record<string, number> = { blogs: 0, backlinks: 0, technical_work: 0 };
  for (const row of rows) counts[row._id] = row.count;
  return counts;
}

/**
 * Collects everything a monthly report shows for one project and one period.
 * Reads the analytics cache and the activity / lead tables only. Google is never called here.
 */
export async function collectReportData(
  projectId: string,
  from: string,
  to: string,
): Promise<{ base: TCollectedBase; period: TReportPeriodDto }> {
  const period = resolveReportPeriod(from, to);
  const project = await Project.findById(projectId).select("businessName websiteUrl").lean();
  if (!project) {
    throw new Error("Project Not Found.");
  }

  const dimension = (
    source: "gsc" | "ga4",
    dimensionType: "query" | "page" | "country" | "channel_group" | "event_name",
    rangeFrom: string,
    rangeTo: string,
  ) =>
    getAnalyticsDimensions(projectId, {
      from: rangeFrom,
      to: rangeTo,
      source,
      dimensionType,
      limit: dimensionLimit(dimensionType),
    });

  const [
    gscCached,
    ga4Cached,
    currentOverview,
    previousOverview,
    gscQueries,
    gscPages,
    ga4Channels,
    ga4Countries,
    ga4Pages,
    ga4Events,
    leadsNow,
    leadsBefore,
    activitiesNow,
    activitiesBefore,
    blogRows,
  ] = await Promise.all([
    AnalyticsDailyMetric.exists({ projectId, source: "gsc", date: { $gte: from, $lte: to } }),
    AnalyticsDailyMetric.exists({ projectId, source: "ga4", date: { $gte: from, $lte: to } }),
    getAnalyticsOverview(projectId, { from, to }),
    getAnalyticsOverview(projectId, { from: period.previousFrom, to: period.previousTo }),
    dimension("gsc", "query", from, to),
    dimension("gsc", "page", from, to),
    dimension("ga4", "channel_group", from, to),
    dimension("ga4", "country", from, to),
    dimension("ga4", "page", from, to),
    dimension("ga4", "event_name", from, to),
    countLeads(projectId, from, to),
    countLeads(projectId, period.previousFrom, period.previousTo),
    countActivities(projectId, from, to),
    countActivities(projectId, period.previousFrom, period.previousTo),
    SeoActivity.find({
      projectId,
      activityType: "blogs",
      occurredOn: { $gte: from, $lte: to },
    })
      .sort({ occurredOn: -1 })
      .limit(REPORT_MAX_BLOG_ROWS)
      .select("title url occurredOn")
      .lean(),
  ]);

  const events = summarizeEvents(
    ga4Events.rows.map((row) => ({
      dimensionValue: row.dimensionValue,
      eventCount: row.eventCount,
    })),
  );

  const base: TCollectedBase = {
    project: {
      id: projectId,
      name: project.businessName,
      websiteUrl: project.websiteUrl,
      logoDataUri: null,
    },
    period,
    // A source counts as available when it is connected or has cached rows for the period.
    sources: {
      gsc: Boolean(currentOverview.integrations.gsc) || gscCached !== null,
      ga4: Boolean(currentOverview.integrations.ga4) || ga4Cached !== null,
    },
    gsc: {
      current: searchTotals(currentOverview),
      previous: searchTotals(previousOverview),
      series: series(currentOverview),
      topQueries: toRanked(gscQueries.rows.slice(0, REPORT_TOP_ROWS)),
      topPages: toRanked(gscPages.rows.slice(0, REPORT_TOP_ROWS)),
    },
    ga4: {
      current: analyticsTotals(currentOverview),
      previous: analyticsTotals(previousOverview),
      series: series(currentOverview),
      channels: toRanked(ga4Channels.rows.slice(0, REPORT_TOP_ROWS)),
      countries: toRanked(ga4Countries.rows.slice(0, REPORT_TOP_ROWS)),
      topPages: toRanked(ga4Pages.rows.slice(0, REPORT_TOP_ROWS)),
    },
    events: {
      contacts: events.contacts,
      highlights: events.highlights
        .filter((item) => BUSINESS_EVENT_KINDS.has(item.kind))
        .map((item) => ({
          label: item.kind === "other" ? item.label : (KIND_LABELS[item.kind] ?? item.name),
          count: item.count,
        })),
    },
    leads: {
      total: leadsNow.total,
      previousTotal: leadsBefore.total,
      byOrigin: leadsNow.byOrigin,
    },
    activities: {
      current: activitiesNow,
      previous: activitiesBefore,
      blogs: blogRows.map((row) => ({
        title: row.title ?? row.url,
        url: row.url,
        occurredOn: row.occurredOn,
      })),
    },
  };

  return { base, period };
}
