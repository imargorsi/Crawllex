import type {
  TAnalyticsDimensionType,
  TAnalyticsSource,
  TGoogleIntegrationService,
  TIntegrationStatus,
} from "@/lib/integrations/constants";

export type TProjectIntegrationDto = {
  id: string;
  projectId: string;
  provider: string;
  service: TGoogleIntegrationService;
  status: TIntegrationStatus;
  externalPropertyId: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
};

export type TGooglePropertyOption = {
  id: string;
  name: string;
  service: TGoogleIntegrationService;
};

/** One GSC KPI for the selected date range (no period comparison). */
export type TAnalyticsCardMetricDto = {
  value: number | null;
  /** Daily points for the selected date range — used for card sparklines. */
  sparkline: number[];
};

export type TAnalyticsOverviewDto = {
  /** Selected date window for cards, series, and filtered GA4 rollups. */
  from: string;
  to: string;
  /** Top 4 GSC cards for the same `from`/`to` window. */
  cards: {
    clicks: TAnalyticsCardMetricDto;
    impressions: TAnalyticsCardMetricDto;
    ctr: TAnalyticsCardMetricDto;
    position: TAnalyticsCardMetricDto;
  };
  /** @deprecated Prefer `cards` for summary UI. Kept for filtered range totals. */
  gsc: {
    clicks: number;
    impressions: number;
    ctr: number | null;
    position: number | null;
  };
  ga4: {
    sessions: number;
    totalUsers: number;
    newUsers: number;
    engagedSessions: number;
    organicSessions: number;
  };
  /**
   * GA4 engagement KPIs for the selected window (sparklines from daily rows).
   * `engagementRate` is derived as engagedSessions / sessions.
   * `avgSessionDuration` is session-weighted average seconds.
   */
  engagement: {
    engagementRate: TAnalyticsCardMetricDto;
    avgSessionDuration: TAnalyticsCardMetricDto;
    pageViews: TAnalyticsCardMetricDto;
  };
  /** Daily series for the performance trend graph. */
  series: Array<{
    date: string;
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    position: number | null;
    sessions: number | null;
    organicSessions: number | null;
  }>;
  integrations: {
    gsc: TProjectIntegrationDto | null;
    ga4: TProjectIntegrationDto | null;
  };
};

export type TAnalyticsDimensionTrend = "up" | "down" | "flat";

export type TAnalyticsDimensionRowDto = {
  dimensionValue: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  position: number | null;
  sessions: number | null;
  totalUsers: number | null;
  eventCount: number | null;
  /**
   * Direction vs the immediately preceding equal-length window (primary metric:
   * clicks for GSC, sessions for GA4). Null when prior data is missing.
   */
  trend: TAnalyticsDimensionTrend | null;
};

export type TAnalyticsDimensionsDto = {
  from: string;
  to: string;
  source: TAnalyticsSource;
  dimensionType: TAnalyticsDimensionType;
  rows: TAnalyticsDimensionRowDto[];
};

export type TAnalyticsSyncResultDto = {
  projectId: string;
  gsc: { ok: boolean; message: string } | null;
  ga4: { ok: boolean; message: string } | null;
};
