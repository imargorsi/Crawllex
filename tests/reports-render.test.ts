import { describe, expect, it } from "vitest";

import { escapeHtml } from "@/lib/reports/escape";
import { renderReportHtml } from "@/lib/reports/render-html";
import { reportSnapshot } from "./helpers/report-snapshot";

describe("renderReportHtml", () => {
  it("escapes project name and written text so they cannot inject markup", () => {
    const html = renderReportHtml(reportSnapshot('<img src=x onerror="alert(1)">', "<script>alert(2)</script>"));
    expect(html).not.toContain("<script>alert(2)</script>");
    expect(html).not.toContain('<img src=x onerror="alert(1)">');
    expect(html).toContain("&lt;script&gt;alert(2)&lt;/script&gt;");
  });

  it("renders a complete A4 document with the expected sections", () => {
    const html = renderReportHtml(reportSnapshot("Silver Foundation", "Highlight"));
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("@page { size: A4; margin: 0; }");
    expect(html).toContain("Executive summary");
    expect(html).toContain("Search performance");
    expect(html).toContain("Website traffic");
    expect(html).toContain("Engagement and leads");
    expect(html).toContain("CONTACT US");
  });

  it("never prints undefined or NaN", () => {
    const html = renderReportHtml(reportSnapshot("Silver Foundation", "Highlight"));
    expect(html).not.toMatch(/\bundefined\b/);
    expect(html).not.toMatch(/\bNaN\b/);
  });

  it("escapes attribute-sensitive characters", () => {
    expect(escapeHtml(`"'<>&`)).toBe("&quot;&#39;&lt;&gt;&amp;");
  });
});

describe("renderReportHtml preview and PDF", () => {
  it("links each section to its dashboard tab under the section", () => {
    const html = renderReportHtml(reportSnapshot("Silver Foundation", "Highlight"), undefined, {
      dashboardUrl: "https://app.example.com/reports/r1?project=p1",
    });
    for (const id of ["summary", "search", "traffic", "engagement", "work"]) {
      expect(html).toContain(`https://app.example.com/reports/r1?project=p1&amp;section=${id}`);
    }
  });

  it("omits the dashboard links when no dashboard URL is given", () => {
    const html = renderReportHtml(reportSnapshot("Silver Foundation", "Highlight"));
    expect(html).not.toContain("View the full breakdown");
  });

  it("uses image elements for artwork, not inline SVG with filters", () => {
    const assets = { lcLogoUri: "data:image/png;base64,AAAA", dotsUri: "", chevronsUri: "", coverArtUri: "", contactBgDataUri: "", fontFaceCss: "", paginateJs: "" };
    const html = renderReportHtml(reportSnapshot("Silver Foundation", "Highlight"), assets);
    expect(html).toContain('src="data:image/png;base64,AAAA"');
    expect(html).not.toContain("mix-blend-mode");
  });
});

describe("report charts", () => {
  it("draws whole-number axis ticks with no repeated labels", async () => {
    const { niceTicks } = await import("@/lib/reports/svg-charts");
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(1)).toEqual([0, 1]);
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
    for (const max of [1, 2, 3, 7, 12, 47, 230, 1800]) {
      const ticks = niceTicks(max);
      expect(new Set(ticks).size).toBe(ticks.length);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
    }
  });
});
