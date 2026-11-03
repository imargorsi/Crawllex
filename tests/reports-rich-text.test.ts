import { describe, expect, it } from "vitest";

import { isRichDocEmpty, isSafeHref, richDocFirstParagraph, richDocPlainText, type TRichDoc } from "@/lib/reports/rich-text";

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
    expect(richDocFirstParagraph(doc)).toBe("Traffic grew.");
    expect(richDocFirstParagraph([{ type: "paragraph", runs: [{ text: "  Hello  " }] }])).toBe("Hello");
  });

  it("treats documents without visible text as empty", () => {
    expect(isRichDocEmpty([])).toBe(true);
    expect(isRichDocEmpty([{ type: "paragraph", runs: [{ text: " " }] }])).toBe(true);
    expect(isRichDocEmpty([{ type: "bullets", items: [[{ text: "" }]] }])).toBe(true);
    expect(isRichDocEmpty(doc)).toBe(false);
  });
});

describe("isSafeHref", () => {
  it("allows web and mail links", () => {
    expect(isSafeHref("https://example.com/page?x=1")).toBe(true);
    expect(isSafeHref("http://example.com")).toBe(true);
    expect(isSafeHref("mailto:team@example.com")).toBe(true);
  });

  it("rejects script, data and relative links", () => {
    expect(isSafeHref("javascript:alert(1)")).toBe(false);
    expect(isSafeHref("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeHref("/relative/path")).toBe(false);
    expect(isSafeHref("")).toBe(false);
  });
});
