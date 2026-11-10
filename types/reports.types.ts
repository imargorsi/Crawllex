import type { TReportWrittenKey, TRichDoc } from "@/lib/reports/rich-text";
/** Monthly client report DTOs. Shared by the API, the HTML renderer and the UI. */

export type TReportPeriodDto = {
  from: string;
  to: string;
  label: string;
  previousFrom: string;
  previousTo: string;
  previousLabel: string;
};

export type TReportSearchTotalsDto = {
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
};

export type TReportAnalyticsTotalsDto = {
  sessions: number;
  totalUsers: number;
  newUsers: number;
  engagedSessions: number;
  organicSessions: number;
  engagementRate: number | null;
  avgSessionDuration: number | null;
  pageViews: number | null;
};

export type TReportRankedRowDto = {
  value: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  position: number | null;
  sessions: number | null;
};

export type TReportSeriesPointDto = {
  date: string;
  clicks: number | null;
  impressions: number | null;
  sessions: number | null;
};

/** Delivery state of one recipient of a report. Visible to users who can create reports. */
export type TReportDeliveryStatus = "sent" | "not_sent" | "failed" | "skipped";

export type TReportDeliveryDto = {
  userId: string;
  name: string;
  email: string | null;
  status: TReportDeliveryStatus;
  error: string | null;
  /** Null for a recipient who has not been sent the report yet. */
  at: string | null;
};

export type TReportNotesDto = {
  written?: Partial<Record<TReportWrittenKey, TRichDoc | null>>;
  nextSteps?: TRichDoc | null;
  /** Crawllex users chosen to receive the report. Missing on reports created before this field. */
  recipientUserIds?: string[];
};

export type TReportActivityItemDto = {
  title: string;
  url: string;
  occurredOn: string;
  anchorText?: string | null;
  details?: string | null;
};

export type TReportSnapshotDto = {
  version: 1;
  generatedAt: string;
  project: { id: string; name: string; websiteUrl: string; logoDataUri: string | null };
  period: TReportPeriodDto;
  sources: { gsc: boolean; ga4: boolean };
  gsc: {
    current: TReportSearchTotalsDto;
    previous: TReportSearchTotalsDto;
    series: TReportSeriesPointDto[];
    topQueries: TReportRankedRowDto[];
    topPages: TReportRankedRowDto[];
  };
  ga4: {
    current: TReportAnalyticsTotalsDto;
    previous: TReportAnalyticsTotalsDto;
    series: TReportSeriesPointDto[];
    channels: TReportRankedRowDto[];
    countries: TReportRankedRowDto[];
    topPages: TReportRankedRowDto[];
  };
  events: {
    contacts: { call: number; email: number; whatsapp: number };
    highlights: Array<{ label: string; count: number }>;
  };
  leads: {
    /** Lead rows for the lead modal. Added later; missing on older snapshots. */
    rows?: Array<{ name: string; email: string; leadDate: string; origin: string }>;
    total: number;
    previousTotal: number;
    byOrigin: Record<string, number>;
  };
  activities: {
    current: Record<string, number>;
    previous: Record<string, number>;
    blogs: Array<TReportActivityItemDto>;
    /** Added later. Missing on snapshots created before the detail lists existed. */
    backlinks?: Array<TReportActivityItemDto>;
    technical?: Array<TReportActivityItemDto>;
  };
  /** Hand-written text and next steps. Reports created before the editor have no `written`. */
  notes: TReportNotesDto;
};

export type TReportListItemDto = {
  id: string;
  projectId: string;
  title: string;
  periodFrom: string;
  periodTo: string;
  createdAt: string;
  /** Short summary: first executive summary lines, for list cards. */
  summary: string | null;
  /** Headline numbers for list cards. Null for reports saved before this field existed. */
  kpis: TReportListKpisDto | null;
  /** Recipients chosen for the report. Present only for users who can create reports. */
  recipientCount?: number;
  /** Latest delivery per recipient. Present only for users who can create reports. */
  deliveries?: TReportDeliveryDto[];
};

export type TReportListKpisDto = {
  clicks: number;
  impressions: number;
  sessions: number;
  leads: number;
  calls: number;
  emails: number;
};

export type TReportDetailDto = TReportListItemDto & {
  snapshot: TReportSnapshotDto;
};
