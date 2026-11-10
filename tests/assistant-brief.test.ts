import { describe, expect, it } from "vitest";

import { buildAnswerBrief } from "@/lib/assistant/answer/brief";

const RANGE = { from: "2026-09-20", to: "2026-10-19" };

describe("assistant answer brief", () => {
  it("builds sections from the tool data with exact figures and the period last", () => {
    const text = buildAnswerBrief(
      {
        get_leads_count: { leads: 12 },
        get_analytics_overview: {
          gsc: { clicks: 557, impressions: 41491, ctr: 0.013, averagePosition: 12.34 },
          ga4: { sessions: 1320, totalUsers: 1222, newUsers: 1143, organicSessions: 714 },
          engagement: { pageViews: 2631, engagementRate: 0.719, avgSessionDurationSeconds: 108 },
        },
        get_seo_activity_counts: { counts: { blogs: 2, backlinks: 1, technical_work: 0 } },
      },
      RANGE,
    );
    expect(text).toContain("## Search performance");
    expect(text).toContain("- Clicks: **557** from Google search results");
    expect(text).toContain("- Impressions: **41,491**");
    expect(text).toContain("- Click-through rate: **1.3%**");
    expect(text).toContain("- Average position: **12.3**");
    expect(text).toContain("- Sessions: **1,320** from **1,222** users");
    expect(text).toContain("- Average session: **1m 48s**");
    expect(text).toContain("- Leads: **12**");
    expect(text).toContain("- SEO work logged: **3**");
    expect(text.trimEnd().split("\n").at(-1)).toBe("Period: 2026-09-20 to 2026-10-19.");
  });

  it("names the period in the summary sentence", () => {
    const text = buildAnswerBrief({ get_leads_count: { leads: 0 } }, RANGE);
    expect(text.split("\n")[0]).toBe("From 20 Sep 2026 to 19 Oct 2026: **0** leads.");
  });

  it("says no data is available when every tool failed", () => {
    const text = buildAnswerBrief(
      { get_leads_count: { error: "Module Not Available." }, get_analytics_overview: { error: "x" } },
      RANGE,
    );
    expect(text.split("\n")[0]).toBe("No data is available for 20 Sep 2026 to 19 Oct 2026 yet.");
    expect(text).not.toContain("##");
  });

  it("skips figures that are null instead of printing zero", () => {
    const text = buildAnswerBrief(
      { get_analytics_overview: { gsc: { clicks: null, impressions: 10, ctr: null, averagePosition: null } } },
      RANGE,
    );
    expect(text).toContain("- Impressions: **10**");
    expect(text).not.toContain("Clicks");
    expect(text).not.toContain("Click-through");
  });
});
