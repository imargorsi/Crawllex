import { describe, expect, it } from "vitest";

import { buildNarrative } from "@/lib/reports/narrative";
import { resolveReportPeriod } from "@/lib/reports/period";

type TBase = Parameters<typeof buildNarrative>[0];

function baseFixture(overrides: Partial<TBase> = {}): TBase {
  const period = resolveReportPeriod("2026-09-01", "2026-09-30");
  const totals = {
    clicks: 230,
    impressions: 48200,
    ctr: 0.005,
    position: 33.7,
  };
  const previousTotals = { clicks: 281, impressions: 41500, ctr: 0.007, position: 30.6 };
  const analytics = {
    sessions: 1580,
    totalUsers: 1426,
    newUsers: 1000,
    engagedSessions: 463,
    organicSessions: 349,
    engagementRate: 0.293,
    avgSessionDuration: 13,
    pageViews: 1885,
  };
  return {
    project: { id: "p1", name: "Silver Foundation", websiteUrl: "https://example.com" },
    period,
    sources: { gsc: true, ga4: true },
    gsc: {
      current: totals,
      previous: previousTotals,
      series: [],
      topQueries: [{ value: "mep contractor", clicks: 12, impressions: 300, ctr: 0.04, position: 8, sessions: null }],
      topPages: [],
    },
    ga4: {
      current: analytics,
      previous: { ...analytics, sessions: 1800, totalUsers: 1500, organicSessions: 300 },
      series: [],
      channels: [{ value: "Direct", clicks: null, impressions: null, ctr: null, position: null, sessions: 1191 }],
      countries: [{ value: "Saudi Arabia", clicks: null, impressions: null, ctr: null, position: null, sessions: 183 }],
      topPages: [],
    },
    events: {
      contacts: { call: 3, email: 14, whatsapp: 0 },
      highlights: [{ label: "Form starts", count: 5 }],
    },
    leads: { total: 17, previousTotal: 10, byOrigin: { wordpress: 17 } },
    activities: {
      current: { blogs: 8, backlinks: 2, technical_work: 0 },
      previous: { blogs: 6, backlinks: 2, technical_work: 0 },
      blogs: [{ title: "Concrete Curing Guide", url: "https://x/1", occurredOn: "2026-09-05" }],
    },
    ...overrides,
  };
}

describe("buildNarrative", () => {
  it("describes search movement with direction, percent and the previous period", () => {
    const narrative = buildNarrative(baseFixture(), { highlights: [], translationStatus: null, closingNote: null });
    const search = narrative.sections.find((section) => section.key === "search");
    expect(search?.paragraphs[0]).toContain("230 clicks, down 18.1%");
    expect(search?.paragraphs[0]).toContain("Impressions reached 48,200, up 16.1%");
    expect(search?.paragraphs[1]).toContain("slipped by 3.1 places");
  });

  it("uses singular and no-count wording correctly", () => {
    const base = baseFixture({
      leads: { total: 0, previousTotal: 0, byOrigin: {} },
      gsc: {
        current: { clicks: 1, impressions: 1, ctr: 1, position: 5 },
        previous: { clicks: 0, impressions: 0, ctr: null, position: null },
        series: [],
        topQueries: [],
        topPages: [],
      },
    });
    const narrative = buildNarrative(base, { highlights: [], translationStatus: null, closingNote: null });
    expect(narrative.executiveSummary.join(" ")).toContain("1 click and 1 impression");
    expect(narrative.executiveSummary.join(" ")).toContain("No leads were recorded");
  });

  it("says a source is missing instead of inventing numbers", () => {
    const base = baseFixture({ sources: { gsc: false, ga4: false } });
    const narrative = buildNarrative(base, { highlights: [], translationStatus: null, closingNote: null });
    const search = narrative.sections.find((section) => section.key === "search");
    expect(search?.paragraphs).toEqual([
      "No Search Console data is available for this period, so search figures are not included.",
    ]);
    expect(narrative.executiveSummary.join(" ")).not.toContain("Search Console recorded");
  });

  it("passes manual highlights through unchanged after the generated summary", () => {
    const narrative = buildNarrative(baseFixture(), {
      highlights: ["Launched Arabic landing page"],
      translationStatus: null,
      closingNote: null,
    });
    expect(narrative.executiveSummary.at(-1)).toBe("Launched Arabic landing page");
  });

  it("is deterministic for the same input", () => {
    const notes = { highlights: [], translationStatus: null, closingNote: null };
    expect(buildNarrative(baseFixture(), notes)).toEqual(buildNarrative(baseFixture(), notes));
  });
});
