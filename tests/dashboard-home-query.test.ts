import { describe, expect, it } from "vitest";

import { parseAnalyticsPageQuery } from "@/lib/frontend/analytics/list-query.utils";
import {
  buildDashboardExportFilename,
  hasDashboardExportSignal,
} from "@/lib/frontend/dashboard/export.utils";
import { resolveAnalyticsDatePreset } from "@/lib/integrations/date.utils";
import { withDateRangeQuery } from "@/lib/frontend/routing/with-date-range-query.utils";
import type { TAnalyticsOverviewDto } from "@/types/analytics.types";

const emptyPulse = {
  leads: 0,
  calls: 0,
  emails: 0,
  whatsapp: 0,
};

function emptyOverview(): TAnalyticsOverviewDto {
  const card = { value: null as number | null, sparkline: [] as number[] };
  return {
    from: "2026-07-01",
    to: "2026-07-31",
    cards: { clicks: card, impressions: card, ctr: card, position: card },
    gsc: { clicks: 0, impressions: 0, ctr: null, position: null },
    ga4: { sessions: 0, totalUsers: 0, newUsers: 0, engagedSessions: 0, organicSessions: 0 },
    engagement: {
      engagementRate: card,
      avgSessionDuration: card,
      pageViews: card,
    },
    series: [],
    integrations: { gsc: null, ga4: null },
  };
}

describe("parseAnalyticsPageQuery", () => {
  it("defaults to last 30 days when from/to are missing", () => {
    expect(parseAnalyticsPageQuery({})).toEqual({
      dateRange: resolveAnalyticsDatePreset("last_30_days"),
    });
  });

  it("reads valid from/to from the URL", () => {
    expect(parseAnalyticsPageQuery({ from: "2026-07-01", to: "2026-07-31" })).toEqual({
      dateRange: { from: "2026-07-01", to: "2026-07-31" },
    });
  });

  it("falls back to last 30 days for invalid dates", () => {
    expect(parseAnalyticsPageQuery({ from: "nope", to: "also-nope" })).toEqual({
      dateRange: resolveAnalyticsDatePreset("last_30_days"),
    });
  });
});

describe("withDateRangeQuery", () => {
  it("appends from/to onto a path", () => {
    expect(withDateRangeQuery("/leads", "2026-07-01", "2026-07-31")).toBe(
      "/leads?from=2026-07-01&to=2026-07-31",
    );
  });

  it("preserves existing query params", () => {
    expect(
      withDateRangeQuery("/seo-activities?type=backlinks", "2026-07-01", "2026-07-31"),
    ).toBe("/seo-activities?type=backlinks&from=2026-07-01&to=2026-07-31");
  });

  it("returns the original href when no dates are provided", () => {
    expect(withDateRangeQuery("/analytics")).toBe("/analytics");
  });
});

describe("dashboard export helpers", () => {
  it("signals export when a pulse metric is positive", () => {
    expect(
      hasDashboardExportSignal({
        pulse: { ...emptyPulse, leads: 3 },
        overview: undefined,
      }),
    ).toBe(true);
  });

  it("does not signal export for empty pulse without overview", () => {
    expect(hasDashboardExportSignal({ pulse: emptyPulse, overview: undefined })).toBe(false);
  });

  it("signals export from overview series", () => {
    const overview = emptyOverview();
    overview.series = [
      {
        date: "2026-07-01",
        clicks: 4,
        impressions: 0,
        ctr: null,
        position: null,
        sessions: 0,
        organicSessions: 0,
      },
    ];
    expect(hasDashboardExportSignal({ pulse: emptyPulse, overview })).toBe(true);
  });

  it("builds a dated dashboard filename", () => {
    expect(
      buildDashboardExportFilename({ from: "2026-07-01", to: "2026-07-31" }, new Date(2026, 7, 13)),
    ).toBe("dashboard_2026-07-01_2026-07-31_20260813.xls");
  });
});
