import { describe, expect, it } from "vitest";

import type { TRichDoc } from "@/lib/reports/rich-text";
import { createReportSchema } from "@/schemas/reports";

const paragraph = (text: string): TRichDoc => [{ type: "paragraph", runs: [{ text }] }];
const base = { periodFrom: "2026-09-01", periodTo: "2026-09-30", nextSteps: paragraph("Publish two blogs.") };

describe("createReportSchema", () => {
  it("accepts a month period with next steps and no written text", () => {
    const parsed = createReportSchema.parse(base);
    expect(parsed.nextSteps).toEqual(paragraph("Publish two blogs."));
    expect(parsed.written).toEqual({ executiveSummary: null, search: null, traffic: null, leads: null, work: null });
  });

  it("requires next steps", () => {
    expect(() => createReportSchema.parse({ ...base, nextSteps: [] })).toThrow("Next Steps Are Required.");
    expect(() => createReportSchema.parse({ ...base, nextSteps: paragraph("   ") })).toThrow("Next Steps Are Required.");
  });

  it("turns empty written sections into null so the generated text is used", () => {
    const parsed = createReportSchema.parse({
      ...base,
      written: { executiveSummary: [], search: paragraph("  "), traffic: paragraph("Traffic grew."), leads: null, work: null },
    });
    expect(parsed.written.executiveSummary).toBeNull();
    expect(parsed.written.search).toBeNull();
    expect(parsed.written.traffic).toEqual(paragraph("Traffic grew."));
  });

  it("accepts headings, bullets and bold or italic runs", () => {
    const doc: TRichDoc = [
      { type: "heading", level: 2, runs: [{ text: "Wins", bold: true }] },
      { type: "bullets", items: [[{ text: "Blog live" }], [{ text: "Quote", italic: true }]] },
    ];
    expect(createReportSchema.parse({ ...base, written: { work: doc } }).written.work).toEqual(doc);
  });

  it("rejects block types outside the editor set", () => {
    const bad = [{ type: "image", src: "x" }] as unknown as TRichDoc;
    expect(() => createReportSchema.parse({ ...base, written: { work: bad } })).toThrow();
  });

  it("accepts safe links and rejects unsafe ones", () => {
    const linked: TRichDoc = [{ type: "paragraph", runs: [{ text: "Read more", href: "https://example.com" }] }];
    expect(createReportSchema.parse({ ...base, written: { work: linked } }).written.work).toEqual(linked);
    const unsafe = [{ type: "paragraph", runs: [{ text: "x", href: "javascript:alert(1)" }] }] as TRichDoc;
    expect(() => createReportSchema.parse({ ...base, written: { work: unsafe } })).toThrow();
  });

  it("rejects text longer than the document limit", () => {
    const long = paragraph("x".repeat(30_001));
    expect(() => createReportSchema.parse({ ...base, written: { search: long } })).toThrow("Text Is Too Long.");
  });

  it("rejects a start date after the end date", () => {
    expect(() => createReportSchema.parse({ ...base, periodFrom: "2026-09-30", periodTo: "2026-09-01" })).toThrow();
  });

  it("rejects ranges longer than 366 days", () => {
    expect(() => createReportSchema.parse({ ...base, periodFrom: "2025-01-01", periodTo: "2026-12-31" })).toThrow();
  });

  it("rejects malformed dates", () => {
    expect(() => createReportSchema.parse({ ...base, periodFrom: "2026/09/01" })).toThrow();
  });
});
