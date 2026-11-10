import { describe, expect, it } from "vitest";

import { buildReportView } from "@/lib/reports/view-model";
import { renderReportHtml } from "@/lib/reports/render-html";
import type { TRichDoc } from "@/lib/reports/rich-text";
import { reportSnapshot } from "./helpers/report-snapshot";

const writtenSummary: TRichDoc = [
  { type: "heading", level: 2, runs: [{ text: "Month in brief" }] },
  {
    type: "paragraph",
    runs: [{ text: "Traffic " }, { text: "grew", bold: true }, { text: " and " }, { text: "the guide", href: "https://example.com/guide" }],
  },
  { type: "bullets", items: [[{ text: "Blog live" }], [{ text: "Backlink added", italic: true }]] },
];

const nextSteps: TRichDoc = [{ type: "paragraph", runs: [{ text: "NEXT-STEPS-MARKER" }] }];

function writtenSnapshot() {
  const snapshot = reportSnapshot("Silver Foundation", "unused");
  snapshot.notes = { written: { executiveSummary: writtenSummary }, nextSteps };
  return snapshot;
}

describe("written report text", () => {
  it("replaces the generated summary and keeps generated text for the other sections", () => {
    const view = buildReportView(writtenSnapshot());
    const summary = view.sections.find((section) => section.id === "summary");
    expect(summary?.blocks[0]).toEqual({ type: "rich", doc: writtenSummary });

    const traffic = view.sections.find((section) => section.id === "traffic");
    expect(traffic?.blocks[0]).toMatchObject({ type: "prose", variant: "lead" });
  });

  it("renders headings, bold, italic, bullets and safe links in the PDF document", () => {
    const html = renderReportHtml(writtenSnapshot());
    expect(html).toContain("<h3>Month in brief</h3>");
    expect(html).toContain("<strong>grew</strong>");
    expect(html).toContain('<a href="https://example.com/guide">');
    expect(html).toContain("<em>Backlink added</em>");
    expect(html).toContain("<li>Blog live</li>");
  });

  it("renders the written next steps as section 06 in the document", () => {
    const html = renderReportHtml(writtenSnapshot());
    expect(html).toContain('data-id="next"');
    expect(html).toContain("NEXT-STEPS-MARKER");
  });

  it("drops unsafe links even if they reach the renderer", () => {
    const snapshot = reportSnapshot("Silver Foundation", "unused");
    snapshot.notes = {
      written: { work: [{ type: "paragraph", runs: [{ text: "click", href: "javascript:alert(1)" }] }] },
      nextSteps,
    };
    const html = renderReportHtml(snapshot);
    expect(html).not.toContain("javascript:");
    expect(html).toContain("click");
  });
});
