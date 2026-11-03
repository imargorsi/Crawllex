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
