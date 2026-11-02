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

export type TReportNarrativeSectionDto = {
  key: "search" | "traffic" | "engagement" | "leads" | "content";
  heading: string;
  paragraphs: string[];
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
    total: number;
    previousTotal: number;
    byOrigin: Record<string, number>;
  };
  activities: {
    current: Record<string, number>;
    previous: Record<string, number>;
    blogs: Array<{ title: string; url: string; occurredOn: string }>;
  };
  narrative: {
    executiveSummary: string[];
    keyFindings: string[];
    sections: TReportNarrativeSectionDto[];
  };
  notes: {
    highlights: string[];
    translationStatus: string | null;
    closingNote: string | null;
  };
};

export type TReportListItemDto = {
  id: string;
  projectId: string;
  title: string;
  periodFrom: string;
  periodTo: string;
  createdAt: string;
};

export type TReportDetailDto = TReportListItemDto & {
  snapshot: TReportSnapshotDto;
};
