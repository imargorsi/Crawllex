import { describe, expect, it } from "vitest";

import { parseAssistantQuery } from "@/lib/assistant/nlp/parse-query";
import type {
  TAssistantAnalyticsMetric,
  TAssistantParse,
  TAssistantWindowSpec,
} from "@/types/assistant.types";
import type { TAnalyticsDimensionType, TAnalyticsSource } from "@/lib/integrations/constants";
import type { TDateRangePresetId } from "@/lib/frontend/seo-activities/date-range.utils";
import type { TSeoActivityType } from "@/types/seo-activity.types";

type TExpected = {
  kind: TAssistantParse["kind"];
  metric?: TAssistantAnalyticsMetric;
  activityType?: TSeoActivityType | "all";
  dimensionType?: TAnalyticsDimensionType;
  source?: TAnalyticsSource;
  window?: Partial<TAssistantWindowSpec>;
};

type TCase = TExpected & { query: string };

const WINDOWS: Array<{
  phrase: string;
  preset: TDateRangePresetId | null;
  lastNDays?: number;
  named?: TAssistantWindowSpec["named"];
}> = [
  { phrase: "", preset: null },
  { phrase: "this month", preset: "this_month" },
  { phrase: "last month", preset: "last_month" },
  { phrase: "this year", preset: "this_year" },
  { phrase: "last year", preset: "last_year" },
  { phrase: "last 30 days", preset: "last_30_days" },
  { phrase: "last 15 days", preset: "last_15_days" },
  { phrase: "last 7 days", preset: null, lastNDays: 7 },
  { phrase: "all time", preset: "all" },
  { phrase: "ytd", preset: "this_year" },
  { phrase: "today", preset: null, named: "today" },
  { phrase: "yesterday", preset: null, named: "yesterday" },
  { phrase: "this week", preset: null, named: "this_week" },
  { phrase: "overall", preset: "all" },
];

function withWindow(base: string, phrase: string): string {
  if (!phrase) return base;
  return `${base} ${phrase}`;
}

function windowSpec(
  phrase: string,
): Partial<TAssistantWindowSpec> | undefined {
  const found = WINDOWS.find((item) => item.phrase === phrase);
  if (
    !found ||
    (!found.preset && found.lastNDays == null && found.named == null && phrase === "")
  ) {
    return undefined;
  }
  if (found.named) return { named: found.named };
  if (found.lastNDays != null) return { lastNDays: found.lastNDays };
  if (found.preset) return { preset: found.preset };
  return undefined;
}

function leadsCases(): TCase[] {
  const stems = ["leads", "lead", "inquiries", "inquiry", "enquiries", "enquiry"];
  const frames = [
    "how many $",
    "how many $ did we get",
    "how many $ we got",
    "number of $",
    "count of $",
    "show $",
    "what's our $",
  ];
  const windowPhrases = [
    "",
    "this month",
    "last month",
    "this year",
    "last 30 days",
    "all time",
    "today",
    "yesterday",
    "this week",
    "overall",
  ];
  const cases: TCase[] = [];

  for (const stem of stems) {
    for (const frame of frames) {
      for (const phrase of windowPhrases) {
        const query = withWindow(frame.replace("$", stem), phrase);
        cases.push({
          query,
          kind: "leads_count",
          window: windowSpec(phrase),
        });
      }
    }
  }

  cases.push(
    { query: "how many leadss we got it?", kind: "leads_count" },
    { query: "how many leadss i have got", kind: "leads_count" },
    { query: "total leads", kind: "leads_count", window: { preset: "all" } },
    { query: "all leads", kind: "leads_count", window: { preset: "all" } },
    { query: "form submissions this month", kind: "leads_count", window: { preset: "this_month" } },
    { query: "form submissions last month", kind: "leads_count", window: { preset: "last_month" } },
    { query: "leads ytd", kind: "leads_count", window: { preset: "this_year" } },
    { query: "leads year to date", kind: "leads_count", window: { preset: "this_year" } },
    { query: "leads last 90 days", kind: "leads_count", window: { preset: "last_90_days" } },
    { query: "leads last 7 days", kind: "leads_count", window: { lastNDays: 7 } },
    { query: "How many leads?", kind: "leads_count" },
    { query: "LEADS THIS MONTH", kind: "leads_count", window: { preset: "this_month" } },
    { query: "How many leads do I have today?", kind: "leads_count", window: { named: "today" } },
    { query: "can you tell me how many leads today", kind: "leads_count", window: { named: "today" } },
    { query: "how many leed I have got it today", kind: "leads_count", window: { named: "today" } },
    { query: "leads last 7", kind: "leads_count", window: { lastNDays: 7 } },
    { query: "leads on 2026-08-01", kind: "leads_count", window: { onDate: "2026-08-01" } },
  );

  return cases;
}

function metricCases(): TCase[] {
  const metrics: Array<{ words: string[]; metric: TAssistantAnalyticsMetric }> = [
    { words: ["clicks", "click"], metric: "clicks" },
    { words: ["impressions", "impression"], metric: "impressions" },
    { words: ["ctr", "click through rate"], metric: "ctr" },
    { words: ["average position", "position", "ranking"], metric: "position" },
    { words: ["sessions", "session"], metric: "sessions" },
    { words: ["users", "visitors", "total users"], metric: "totalUsers" },
    { words: ["new users", "new visitors"], metric: "newUsers" },
    { words: ["organic sessions", "organic traffic"], metric: "organicSessions" },
    { words: ["page views", "pageviews"], metric: "pageViews" },
    { words: ["engagement rate", "engagement"], metric: "engagementRate" },
    { words: ["session duration", "average session duration"], metric: "avgSessionDuration" },
  ];
  const frames = ["how many $", "show $", "$ last 30 days", "what's our $"];
  const cases: TCase[] = [];

  for (const item of metrics) {
    for (const word of item.words) {
      for (const frame of frames) {
        const query = frame.replace("$", word);
        const window = query.includes("last 30 days")
          ? { preset: "last_30_days" as const }
          : undefined;
        cases.push({ query, kind: "analytics_metric", metric: item.metric, window });
      }
    }
  }

  cases.push(
    { query: "clickss last 30 days", kind: "analytics_metric", metric: "clicks", window: { preset: "last_30_days" } },
    { query: "impresions", kind: "analytics_metric", metric: "impressions" },
    { query: "avg position this month", kind: "analytics_metric", metric: "position", window: { preset: "this_month" } },
    { query: "avg ctr", kind: "analytics_metric", metric: "ctr" },
    { query: "screen views", kind: "analytics_metric", metric: "pageViews" },
    { query: "how many users last month", kind: "analytics_metric", metric: "totalUsers", window: { preset: "last_month" } },
    { query: "total impressions", kind: "analytics_metric", metric: "impressions", window: { preset: "all" } },
    { query: "total positions", kind: "analytics_metric", metric: "position", window: { preset: "all" } },
    { query: "overall clicks", kind: "analytics_metric", metric: "clicks", window: { preset: "all" } },
    { query: "impressions last 7", kind: "analytics_metric", metric: "impressions", window: { lastNDays: 7 } },
  );

  return cases;
}

function overviewCases(): TCase[] {
  const stems = [
    "analytics",
    "analytics overview",
    "gsc",
    "ga4",
    "search console",
    "google analytics",
    "search performance",
    "traffic",
    "performance",
    "overview",
  ];
  const frames = ["show $", "what's our $", "$ this month", "$ last 30 days"];
  const cases: TCase[] = [];

  for (const stem of stems) {
    for (const frame of frames) {
      const query = frame.replace("$", stem);
      let window: Partial<TAssistantWindowSpec> | undefined;
      if (query.includes("this month")) window = { preset: "this_month" };
      if (query.includes("last 30 days")) window = { preset: "last_30_days" };
      cases.push({ query, kind: "analytics_overview", window });
    }
  }

  cases.push(
    { query: "Show analytics overview", kind: "analytics_overview" },
    { query: "analytcis overview", kind: "analytics_overview" },
  );

  return cases;
}

function topCases(): TCase[] {
  const dims: Array<{
    words: string[];
    dimensionType: TAnalyticsDimensionType;
    source: TAnalyticsSource;
  }> = [
    { words: ["queries", "query", "keywords", "keyword"], dimensionType: "query", source: "gsc" },
    { words: ["pages", "page"], dimensionType: "page", source: "gsc" },
    { words: ["countries", "country"], dimensionType: "country", source: "gsc" },
    { words: ["devices", "device"], dimensionType: "device", source: "gsc" },
    { words: ["landing pages", "landing page"], dimensionType: "landing_page", source: "ga4" },
    { words: ["channels", "channel", "traffic sources"], dimensionType: "channel_group", source: "ga4" },
  ];
  const frames = ["top $", "best $", "what are the top $", "show top $"];
  const cases: TCase[] = [];

  for (const dim of dims) {
    for (const word of dim.words) {
      for (const frame of frames) {
        cases.push({
          query: frame.replace("$", word),
          kind: "analytics_top",
          dimensionType: dim.dimensionType,
          source: dim.source,
        });
      }
    }
  }

  cases.push(
    { query: "top queries last 30 days", kind: "analytics_top", dimensionType: "query", source: "gsc", window: { preset: "last_30_days" } },
    { query: "top pages this month", kind: "analytics_top", dimensionType: "page", source: "gsc", window: { preset: "this_month" } },
    { query: "ga4 top pages", kind: "analytics_top", dimensionType: "page", source: "ga4" },
  );

  return cases;
}

function seoCases(): TCase[] {
  const types: Array<{ words: string[]; activityType: TSeoActivityType | "all" }> = [
    { words: ["blogs", "blog", "posts", "articles"], activityType: "blogs" },
    { words: ["backlinks", "backlink", "links"], activityType: "backlinks" },
    { words: ["technical work", "technical", "fixes", "web changes", "tech work"], activityType: "technical_work" },
    { words: ["seo activities", "seo activity", "seo work"], activityType: "all" },
  ];
  const frames = ["how many $", "count of $", "show $", "$ this month", "$ last month"];
  const cases: TCase[] = [];

  for (const item of types) {
    for (const word of item.words) {
      for (const frame of frames) {
        const query = frame.replace("$", word);
        let window: Partial<TAssistantWindowSpec> | undefined;
        if (query.includes("this month")) window = { preset: "this_month" };
        if (query.includes("last month")) window = { preset: "last_month" };
        cases.push({ query, kind: "seo_count", activityType: item.activityType, window });
      }
    }
  }

  cases.push(
    { query: "how many seo this month", kind: "seo_count", activityType: "all", window: { preset: "this_month" } },
    { query: "how many blogss", kind: "seo_count", activityType: "blogs" },
    { query: "blog posts this year", kind: "seo_count", activityType: "blogs", window: { preset: "this_year" } },
    { query: "link building last month", kind: "seo_count", activityType: "backlinks", window: { preset: "last_month" } },
    { query: "how many blogs overall", kind: "seo_count", activityType: "blogs", window: { preset: "all" } },
    { query: "blogs today", kind: "seo_count", activityType: "blogs", window: { named: "today" } },
    { query: "how many blogs i got in the last day", kind: "seo_count", activityType: "blogs", window: { lastNDays: 1 } },
    { query: "how many blogs i got in the last four months", kind: "seo_count", activityType: "blogs", window: { lastNMonths: 4 } },
    { query: "blogs last 4 months", kind: "seo_count", activityType: "blogs", window: { lastNMonths: 4 } },
  );

  return cases;
}

function unknownCases(): TCase[] {
  return [
    { query: "", kind: "unknown" },
    { query: "schedule a meeting", kind: "unknown" },
    { query: "what's the weather", kind: "unknown" },
    { query: "leads and clicks this month", kind: "unknown" },
    { query: "delete this project", kind: "unknown" },
    { query: "invite a user", kind: "unknown" },
    { query: "why did the site go down", kind: "unknown" },
  ];
}

const CASES: TCase[] = [
  ...leadsCases(),
  ...metricCases(),
  ...overviewCases(),
  ...topCases(),
  ...seoCases(),
  ...unknownCases(),
];

function assertWindow(
  parsed: TAssistantParse,
  expected?: Partial<TAssistantWindowSpec>,
): void {
  if (!expected || parsed.kind === "unknown") return;
  if (expected.preset != null) {
    expect(parsed.window.preset).toBe(expected.preset);
  }
  if (expected.lastNDays != null) {
    expect(parsed.window.lastNDays).toBe(expected.lastNDays);
  }
  if (expected.lastNWeeks != null) {
    expect(parsed.window.lastNWeeks).toBe(expected.lastNWeeks);
  }
  if (expected.lastNMonths != null) {
    expect(parsed.window.lastNMonths).toBe(expected.lastNMonths);
  }
  if (expected.named != null) {
    expect(parsed.window.named).toBe(expected.named);
  }
  if (expected.onDate != null) {
    expect(parsed.window.onDate).toBe(expected.onDate);
  }
}

describe(`assistant query variants (${CASES.length})`, () => {
  it("has at least 200 variants", () => {
    expect(CASES.length).toBeGreaterThanOrEqual(200);
  });

  it.each(CASES)("$query", (testCase) => {
    const parsed = parseAssistantQuery(testCase.query);
    expect(parsed.kind).toBe(testCase.kind);

    if (parsed.kind === "unknown" || testCase.kind === "unknown") return;

    if (testCase.kind === "analytics_metric" && parsed.kind === "analytics_metric") {
      expect(parsed.metric).toBe(testCase.metric);
    }
    if (testCase.kind === "analytics_top" && parsed.kind === "analytics_top") {
      expect(parsed.dimensionType).toBe(testCase.dimensionType);
      if (testCase.source) expect(parsed.source).toBe(testCase.source);
    }
    if (testCase.kind === "seo_count" && parsed.kind === "seo_count") {
      expect(parsed.activityType).toBe(testCase.activityType);
    }
    assertWindow(parsed, testCase.window);
  });
});
