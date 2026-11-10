import { describe, expect, it } from "vitest";

import {
  buildComparisonBrief,
  comparePeriodsFor,
  defaultComparePeriods,
  isComparisonQuestion,
} from "@/lib/assistant/compare";
import { assistantWindowSpec } from "@/lib/assistant/nlp/windows";

const NOW = new Date("2026-11-10T10:00:00Z");

const overview = (clicks: number, sessions: number, position: number) => ({
  gsc: { clicks, impressions: 900, ctr: 0.1, averagePosition: position },
  ga4: { sessions, totalUsers: 100, newUsers: 10, organicSessions: 5 },
  engagement: { pageViews: 400, engagementRate: 0.5, avgSessionDurationSeconds: 60 },
});

describe("comparison questions", () => {
  it("detects how-did-it-move questions", () => {
    expect(isComparisonQuestion("is it up or down?")).toBe(true);
    expect(isComparisonQuestion("compare with last month")).toBe(true);
    expect(isComparisonQuestion("how are clicks trending")).toBe(true);
    expect(isComparisonQuestion("how many leads this month")).toBe(false);
  });
});

describe("default periods: this month so far against the same days last month", () => {
  it("compares 1-9 Nov with 1-9 Oct", () => {
    const periods = defaultComparePeriods(NOW);
    expect(periods.current).toEqual({ from: "2026-11-01", to: "2026-11-09" });
    expect(periods.previous).toEqual({ from: "2026-10-01", to: "2026-10-09" });
    expect(periods.basis).toBe("month_to_date");
  });

  it("clamps to the end of a shorter previous month", () => {
    const periods = defaultComparePeriods(new Date("2026-03-31T10:00:00Z"));
    expect(periods.current).toEqual({ from: "2026-03-01", to: "2026-03-30" });
    expect(periods.previous).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });
});

describe("explicit periods: same number of days right before", () => {
  it("compares the last 30 days with the 30 days before them", () => {
    const periods = comparePeriodsFor(assistantWindowSpec({ preset: "last_30_days" }), NOW);
    expect(periods?.current).toEqual({ from: "2026-10-11", to: "2026-11-09" });
    expect(periods?.previous).toEqual({ from: "2026-09-11", to: "2026-10-10" });
    expect(periods?.basis).toBe("same_length_before");
  });
});

describe("comparison brief", () => {
  const periods = defaultComparePeriods(NOW);

  it("says up or down with percentages, and the position change reads as better or worse", () => {
    const brief = buildComparisonBrief(overview(120, 300, 8), overview(100, 320, 9), periods);
    expect(brief).toContain("Overall, most figures are up.");
    expect(brief).toContain("- Search clicks: **120** vs 100, up 20.0%");
    expect(brief).toContain("- Website sessions: **300** vs 320, down 6.3%");
    expect(brief).toContain("- Average position: **8.0** vs 9.0, down 11.1% (better)");
    expect(brief.endsWith("Period: 2026-11-01 to 2026-11-09 vs 2026-10-01 to 2026-10-09.")).toBe(true);
  });

  it("leaves out metrics with no value in either period", () => {
    const brief = buildComparisonBrief({ gsc: { clicks: 5 } }, { gsc: { clicks: 4 } }, periods);
    expect(brief).toContain("- Search clicks: **5** vs 4, up 25.0%");
    expect(brief).not.toContain("Impressions");
  });

  it("says so when there is no data to compare", () => {
    const brief = buildComparisonBrief({}, {}, periods);
    expect(brief).toContain("No comparable data");
  });
});
