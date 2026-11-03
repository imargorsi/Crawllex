import { resolveReportPeriod } from "@/lib/reports/period";
import type { TReportSnapshotDto } from "@/types/reports.types";

/** Empty but complete report snapshot for render and view tests. */
export function reportSnapshot(name: string, highlight: string): TReportSnapshotDto {
  const period = resolveReportPeriod("2026-09-01", "2026-09-30");
  const zeroTotals = { clicks: 0, impressions: 0, ctr: null, position: null };
  const zeroAnalytics = {
    sessions: 0,
    totalUsers: 0,
    newUsers: 0,
    engagedSessions: 0,
    organicSessions: 0,
    engagementRate: null,
    avgSessionDuration: null,
    pageViews: null,
  };
  const base = {
    project: { id: "p1", name, websiteUrl: "https://example.com", logoDataUri: null },
    period,
    sources: { gsc: false, ga4: false },
    gsc: { current: zeroTotals, previous: zeroTotals, series: [], topQueries: [], topPages: [] },
    ga4: {
      current: zeroAnalytics,
      previous: zeroAnalytics,
      series: [],
      channels: [],
      countries: [],
      topPages: [],
    },
    events: { contacts: { call: 0, email: 0, whatsapp: 0 }, highlights: [] },
    leads: { total: 0, previousTotal: 0, byOrigin: {} },
    activities: {
      current: { blogs: 0, backlinks: 0, technical_work: 0 },
      previous: { blogs: 0, backlinks: 0, technical_work: 0 },
      blogs: [],
    },
  };
  const notes = {
    written: { work: [{ type: "paragraph" as const, runs: [{ text: highlight }] }] },
    nextSteps: [{ type: "paragraph" as const, runs: [{ text: "Next steps are stored, not rendered." }] }],
  };
  return {
    version: 1,
    generatedAt: "2026-11-02T00:00:00.000Z",
    ...base,
    notes,
  };
}
