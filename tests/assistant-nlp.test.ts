import { describe, expect, it } from "vitest";

import { extractAssistantEntities, getAssistantNlp } from "@/lib/assistant/nlp/engine";
import { parseAssistantOnDates } from "@/lib/assistant/nlp/parse-date";
import { parseAssistantQuery } from "@/lib/assistant/nlp/parse-query";
import {
  assistantWindowSpec,
  emptyAssistantWindow,
  resolveAnalyticsWindow,
  resolveLeadsSeoWindow,
} from "@/lib/assistant/nlp/windows";
import { ANALYTICS_MAX_RANGE_DAYS } from "@/lib/integrations/constants";
import { inclusiveDaySpan } from "@/lib/integrations/date.utils";

describe("assistant NLP engine", () => {
  it("loads wink-nlp and extracts lead + window entities", () => {
    expect(getAssistantNlp()).not.toBeNull();

    const entities = extractAssistantEntities("how many leads this month");
    const types = entities.map((entity) => entity.type);

    expect(types).toContain("domain.leads");
    expect(types).toContain("window.this_month");
  });

  it("extracts today and yesterday window entities", () => {
    const today = extractAssistantEntities("how many leads today").map((entity) => entity.type);
    expect(today).toContain("domain.leads");
    expect(today).toContain("window.today");

    const yesterday = extractAssistantEntities("leads yesterday").map((entity) => entity.type);
    expect(yesterday).toContain("window.yesterday");
  });

  it("still parses when relying on lexicon tokens after correction", () => {
    expect(parseAssistantQuery("how many leadss we got it?")).toMatchObject({
      kind: "leads_count",
    });
  });
});

describe("assistant windows", () => {
  const localNow = new Date(2026, 7, 13, 12, 0, 0);
  const utcNow = new Date(Date.UTC(2026, 7, 13, 12, 0, 0));

  it("defaults lead counts to this month in local time", () => {
    const range = resolveLeadsSeoWindow(emptyAssistantWindow(), "this_month", localNow);
    expect(range.from).toBe("2026-08-01");
    expect(range.to).toBe("2026-08-13");
    expect(range.label).toBe("this month");
  });

  it("resolves today and yesterday in local time for leads", () => {
    const today = resolveLeadsSeoWindow(
      assistantWindowSpec({ named: "today" }),
      "this_month",
      localNow,
    );
    expect(today).toMatchObject({ from: "2026-08-13", to: "2026-08-13", label: "today" });

    const yesterday = resolveLeadsSeoWindow(
      assistantWindowSpec({ named: "yesterday" }),
      "this_month",
      localNow,
    );
    expect(yesterday).toMatchObject({
      from: "2026-08-12",
      to: "2026-08-12",
      label: "yesterday",
    });
  });

  it("resolves this week and last week in local time for leads", () => {
    const thisWeek = resolveLeadsSeoWindow(
      assistantWindowSpec({ named: "this_week" }),
      "this_month",
      localNow,
    );
    expect(thisWeek).toMatchObject({
      from: "2026-08-10",
      to: "2026-08-13",
      label: "this week",
    });

    const lastWeek = resolveLeadsSeoWindow(
      assistantWindowSpec({ named: "last_week" }),
      "this_month",
      localNow,
    );
    expect(lastWeek).toMatchObject({
      from: "2026-08-03",
      to: "2026-08-09",
      label: "last week",
    });
  });

  it("resolves last four months in local time for SEO", () => {
    const range = resolveLeadsSeoWindow(
      assistantWindowSpec({ lastNMonths: 4 }),
      "all",
      localNow,
    );
    expect(range.from).toBe("2026-04-13");
    expect(range.to).toBe("2026-08-13");
    expect(range.label).toBe("the last 4 months");
  });

  it("resolves the last day as a one-day local window", () => {
    const range = resolveLeadsSeoWindow(
      assistantWindowSpec({ lastNDays: 1 }),
      "all",
      localNow,
    );
    expect(range.from).toBe("2026-08-13");
    expect(range.to).toBe("2026-08-13");
    expect(range.label).toBe("the last day");
  });

  it("treats all-time leads as an unbounded Mongo range", () => {
    const range = resolveLeadsSeoWindow(
      assistantWindowSpec({ preset: "all" }),
      "this_month",
      localNow,
    );
    expect(range.from).toBeNull();
    expect(range.to).toBeNull();
    expect(range.label).toBe("all time");
  });

  it("defaults analytics to last 30 days ending UTC yesterday", () => {
    const range = resolveAnalyticsWindow(emptyAssistantWindow(), utcNow);
    expect(range.from).toBe("2026-07-14");
    expect(range.to).toBe("2026-08-12");
    expect(range.label).toBe("the last 30 days");
  });

  it("maps analytics today to the latest complete UTC day", () => {
    const range = resolveAnalyticsWindow(assistantWindowSpec({ named: "today" }), utcNow);
    expect(range.from).toBe("2026-08-12");
    expect(range.to).toBe("2026-08-12");
    expect(range.label).toBe("yesterday");
    expect(range.notice).toMatch(/today/i);
  });

  it("clamps analytics all-time to 366 days ending UTC yesterday", () => {
    const range = resolveAnalyticsWindow(assistantWindowSpec({ preset: "all" }), utcNow);
    expect(range.to).toBe("2026-08-12");
    expect(inclusiveDaySpan(range.from!, range.to!)).toBe(ANALYTICS_MAX_RANGE_DAYS);
  });
});

describe("assistant calendar dates", () => {
  const now = new Date(2026, 7, 13, 12, 0, 0);

  it("parses ISO and month-name dates", () => {
    expect(parseAssistantOnDates("leads on 2026-08-01", now)).toEqual(["2026-08-01"]);
    expect(parseAssistantOnDates("leads on August 26", now)).toEqual(["2026-08-26"]);
    expect(parseAssistantOnDates("leads on 26 Aug 2025", now)).toEqual(["2025-08-26"]);
  });
});
