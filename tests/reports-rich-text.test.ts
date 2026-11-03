import { describe, expect, it } from "vitest";

import { isRichDocEmpty, richDocFirstParagraph, richDocPlainText, type TRichDoc } from "@/lib/reports/rich-text";

const doc: TRichDoc = [
  { type: "heading", level: 2, runs: [{ text: "Wins" }] },
  { type: "paragraph", runs: [{ text: "Traffic " }, { text: "grew", bold: true }, { text: "." }] },
  { type: "bullets", items: [[{ text: "Blog live" }], [{ text: "" }]] },
];

describe("rich text helpers", () => {
  it("joins blocks into plain text, skipping empty items", () => {
    expect(richDocPlainText(doc)).toBe("Wins\n\nTraffic grew.\n\nBlog live");
  });

  it("returns the first paragraph for list summaries", () => {
    expect(richDocFirstParagraph(doc)).toBe("Wins");
    expect(richDocFirstParagraph([{ type: "paragraph", runs: [{ text: "  Hello  " }] }])).toBe("Hello");
  });

  it("treats documents without visible text as empty", () => {
    expect(isRichDocEmpty([])).toBe(true);
    expect(isRichDocEmpty([{ type: "paragraph", runs: [{ text: " " }] }])).toBe(true);
    expect(isRichDocEmpty([{ type: "bullets", items: [[{ text: "" }]] }])).toBe(true);
    expect(isRichDocEmpty(doc)).toBe(false);
  });
});
