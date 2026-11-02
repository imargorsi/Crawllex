import { describe, expect, it } from "vitest";

import { escapeHtml } from "@/lib/reports/escape";
import { renderReportHtml } from "@/lib/reports/render-html";
import { buildNarrative } from "@/lib/reports/narrative";
import { resolveReportPeriod } from "@/lib/reports/period";
import type { TReportSnapshotDto } from "@/types/reports.types";

function snapshot(name: string, highlight: string): TReportSnapshotDto {
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
    project: { id: "p1", name, websiteUrl: "https://example.com" },
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
  const notes = { highlights: [highlight], translationStatus: null, closingNote: null };
  return {
    version: 1,
    generatedAt: "2026-11-02T00:00:00.000Z",
    ...base,
    narrative: buildNarrative(base, notes),
    notes,
  };
}

describe("renderReportHtml", () => {
  it("escapes project name and notes so they cannot inject markup", () => {
    const html = renderReportHtml(snapshot('<img src=x onerror="alert(1)">', "<script>alert(2)</script>"));
    expect(html).not.toContain("<script>alert(2)</script>");
    expect(html).not.toContain('<img src=x onerror="alert(1)">');
    expect(html).toContain("&lt;script&gt;alert(2)&lt;/script&gt;");
  });

  it("renders a complete A4 document with the expected sections", () => {
    const html = renderReportHtml(snapshot("Silver Foundation", "Highlight"));
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("@page { size: A4; margin: 0; }");
    expect(html).toContain("Executive summary");
    expect(html).toContain("Search performance");
    expect(html).toContain("Website traffic");
    expect(html).toContain("Leads and content");
    expect(html).toContain("Contact us");
  });

  it("never prints undefined or NaN", () => {
    const html = renderReportHtml(snapshot("Silver Foundation", "Highlight"));
    expect(html).not.toMatch(/\bundefined\b/);
    expect(html).not.toMatch(/\bNaN\b/);
  });

  it("escapes attribute-sensitive characters", () => {
    expect(escapeHtml(`"'<>&`)).toBe("&quot;&#39;&lt;&gt;&amp;");
  });
});
