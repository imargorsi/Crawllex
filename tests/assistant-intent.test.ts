import { describe, expect, it } from "vitest";

import {
  detectAssistantIntent,
  permissionForAssistantIntent,
} from "@/lib/assistant/detect-intent";
import { parseAssistantQuery } from "@/lib/assistant/nlp/parse-query";

describe("parseAssistantQuery", () => {
  it("maps lead window phrases", () => {
    expect(parseAssistantQuery("How many leads this month?")).toMatchObject({
      kind: "leads_count",
      window: { preset: "this_month" },
    });
    expect(parseAssistantQuery("leads last month")).toMatchObject({
      kind: "leads_count",
      window: { preset: "last_month" },
    });
    expect(parseAssistantQuery("leads this year")).toMatchObject({
      kind: "leads_count",
      window: { preset: "this_year" },
    });
    expect(parseAssistantQuery("total leads")).toMatchObject({
      kind: "leads_count",
      window: { preset: "all" },
    });
  });

  it("maps lead synonyms", () => {
    expect(detectAssistantIntent("how many inquiries last month")).toBe("leads_count");
  });

  it("maps minor spelling mistakes to known lexicon terms", () => {
    expect(parseAssistantQuery("how many leadss i have got")).toMatchObject({
      kind: "leads_count",
    });
    expect(parseAssistantQuery("how many leadss we got it?")).toMatchObject({
      kind: "leads_count",
    });
    expect(parseAssistantQuery("how many blogss")).toMatchObject({
      kind: "seo_count",
      activityType: "blogs",
    });
    expect(parseAssistantQuery("clickss last 30 days")).toMatchObject({
      kind: "analytics_metric",
      metric: "clicks",
    });
  });

  it("maps last-n-day windows", () => {
    expect(parseAssistantQuery("leads last 15 days")).toMatchObject({
      kind: "leads_count",
      window: { preset: "last_15_days" },
    });
    expect(parseAssistantQuery("leads last 7 days")).toMatchObject({
      kind: "leads_count",
      window: { lastNDays: 7 },
    });
    expect(parseAssistantQuery("leads last 7")).toMatchObject({
      kind: "leads_count",
      window: { lastNDays: 7 },
    });
    expect(parseAssistantQuery("how many blogs i got in the last day")).toMatchObject({
      kind: "seo_count",
      activityType: "blogs",
      window: { lastNDays: 1 },
    });
    expect(parseAssistantQuery("how many blogs i got in the last four months")).toMatchObject({
      kind: "seo_count",
      activityType: "blogs",
      window: { lastNMonths: 4 },
    });
    expect(parseAssistantQuery("blogs last 4 months")).toMatchObject({
      kind: "seo_count",
      activityType: "blogs",
      window: { lastNMonths: 4 },
    });
    expect(parseAssistantQuery("blogs last 2 weeks")).toMatchObject({
      kind: "seo_count",
      activityType: "blogs",
      window: { lastNWeeks: 2 },
    });
  });

  it("maps today, yesterday, weeks, and overall", () => {
    expect(parseAssistantQuery("How many leads do I have today?")).toMatchObject({
      kind: "leads_count",
      window: { named: "today" },
    });
    expect(parseAssistantQuery("leads yesterday")).toMatchObject({
      kind: "leads_count",
      window: { named: "yesterday" },
    });
    expect(parseAssistantQuery("leads this week")).toMatchObject({
      kind: "leads_count",
      window: { named: "this_week" },
    });
    expect(parseAssistantQuery("leads last week")).toMatchObject({
      kind: "leads_count",
      window: { named: "last_week" },
    });
    expect(parseAssistantQuery("total impressions")).toMatchObject({
      kind: "analytics_metric",
      metric: "impressions",
      window: { preset: "all" },
    });
    expect(parseAssistantQuery("overall clicks")).toMatchObject({
      kind: "analytics_metric",
      metric: "clicks",
      window: { preset: "all" },
    });
    expect(parseAssistantQuery("total users")).toMatchObject({
      kind: "analytics_metric",
      metric: "totalUsers",
      window: { preset: null },
    });
    expect(parseAssistantQuery("total leads this month")).toMatchObject({
      kind: "leads_count",
      window: { preset: "this_month" },
    });
  });

  it("maps calendar dates and messy phrasing", () => {
    expect(parseAssistantQuery("how many leads on 2026-08-01")).toMatchObject({
      kind: "leads_count",
      window: { onDate: "2026-08-01" },
    });
    expect(parseAssistantQuery("can you tell me how many leads today")).toMatchObject({
      kind: "leads_count",
      window: { named: "today" },
    });
    expect(parseAssistantQuery("how many leed I have got it today")).toMatchObject({
      kind: "leads_count",
      window: { named: "today" },
    });
    expect(parseAssistantQuery("yestreday leads")).toMatchObject({
      kind: "leads_count",
      window: { named: "yesterday" },
    });
  });

  it("maps analytics overview and metrics", () => {
    expect(detectAssistantIntent("Show analytics overview")).toBe("analytics_overview");
    expect(parseAssistantQuery("how many clicks last 30 days")).toMatchObject({
      kind: "analytics_metric",
      metric: "clicks",
      window: { preset: "last_30_days" },
    });
    expect(parseAssistantQuery("page views")).toMatchObject({
      kind: "analytics_metric",
      metric: "pageViews",
    });
    expect(parseAssistantQuery("session duration")).toMatchObject({
      kind: "analytics_metric",
      metric: "avgSessionDuration",
    });
  });

  it("maps top dimensions", () => {
    expect(parseAssistantQuery("What are the top queries?")).toMatchObject({
      kind: "analytics_top",
      dimensionType: "query",
      source: "gsc",
    });
    expect(parseAssistantQuery("top pages")).toMatchObject({
      kind: "analytics_top",
      dimensionType: "page",
      source: "gsc",
    });
    expect(parseAssistantQuery("top landing pages")).toMatchObject({
      kind: "analytics_top",
      dimensionType: "landing_page",
      source: "ga4",
    });
    expect(parseAssistantQuery("top countries")).toMatchObject({
      kind: "analytics_top",
      dimensionType: "country",
    });
  });

  it("maps SEO activity counts", () => {
    expect(parseAssistantQuery("How many blogs?")).toMatchObject({
      kind: "seo_count",
      activityType: "blogs",
    });
    expect(parseAssistantQuery("backlinks this month")).toMatchObject({
      kind: "seo_count",
      activityType: "backlinks",
      window: { preset: "this_month" },
    });
    expect(parseAssistantQuery("technical work last month")).toMatchObject({
      kind: "seo_count",
      activityType: "technical_work",
      window: { preset: "last_month" },
    });
    expect(parseAssistantQuery("how many seo this month")).toMatchObject({
      kind: "seo_count",
      activityType: "all",
      window: { preset: "this_month" },
    });
    expect(parseAssistantQuery("seo activities")).toMatchObject({
      kind: "seo_count",
      activityType: "all",
    });
  });

  it("returns unknown for unsupported or conflicting questions", () => {
    expect(detectAssistantIntent("schedule a meeting")).toBe("unknown");
    expect(detectAssistantIntent("")).toBe("unknown");
    expect(detectAssistantIntent("leads and clicks this month")).toBe("unknown");
  });

  it("resolves module permissions per intent", () => {
    expect(permissionForAssistantIntent("leads_count")).toBe("leads.view");
    expect(permissionForAssistantIntent("analytics_top")).toBe("analytics.view");
    expect(permissionForAssistantIntent("seo_count")).toBe("seo_activities.view");
    expect(permissionForAssistantIntent("unknown")).toBeNull();
  });
});
