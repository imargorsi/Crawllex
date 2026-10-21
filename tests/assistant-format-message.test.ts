import { describe, expect, it } from "vitest";

import {
  parseAssistantInline,
  parseAssistantMessage,
} from "@/lib/frontend/assistant/format-message";

describe("parseAssistantMessage", () => {
  it("splits summary, headings, bullets and date line", () => {
    const blocks = parseAssistantMessage(
      [
        "Traffic is low but engagement is strong.",
        "",
        "## Traffic",
        "- 19 sessions from 15 users",
        "- 68 page views",
        "",
        "## Search",
        "- 3 clicks from 14 impressions",
        "",
        "Range: 2026-09-21 to 2026-10-20.",
      ].join("\n"),
    );
    expect(blocks).toEqual([
      { type: "paragraph", text: "Traffic is low but engagement is strong." },
      { type: "heading", text: "Traffic" },
      { type: "bullet", text: "19 sessions from 15 users" },
      { type: "bullet", text: "68 page views" },
      { type: "heading", text: "Search" },
      { type: "bullet", text: "3 clicks from 14 impressions" },
      { type: "paragraph", text: "Range: 2026-09-21 to 2026-10-20." },
    ]);
  });

  it("joins wrapped lines of one paragraph", () => {
    expect(parseAssistantMessage("one\ntwo\n\nthree")).toEqual([
      { type: "paragraph", text: "one two" },
      { type: "paragraph", text: "three" },
    ]);
  });

  it("keeps HTML as text, never markup", () => {
    const blocks = parseAssistantMessage("<img src=x onerror=alert(1)>");
    expect(blocks).toEqual([{ type: "paragraph", text: "<img src=x onerror=alert(1)>" }]);
  });

  it("returns no blocks for empty input", () => {
    expect(parseAssistantMessage("   \n  ")).toEqual([]);
  });
});

describe("parseAssistantInline", () => {
  it("marks bold runs", () => {
    expect(parseAssistantInline("You had **7 leads** this month")).toEqual([
      { text: "You had ", bold: false },
      { text: "7 leads", bold: true },
      { text: " this month", bold: false },
    ]);
  });

  it("leaves an unpaired asterisk as text", () => {
    expect(parseAssistantInline("5 * 3 = 15")).toEqual([{ text: "5 * 3 = 15", bold: false }]);
  });
});
