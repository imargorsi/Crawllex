import { describe, expect, it } from "vitest";

import { readablePath, readableUrl, visibleItems } from "@/features/lens/url-display";

const AR = "https://zealous-seagreen-crow-18.hostingersite.com/ar/%d8%a3%d9%81%d8%b6%d9%84-%d8%b4%d8%b1%d9%83%d8%a9/";

describe("Lens URL display", () => {
  it("decodes percent-encoded paths to readable text", () => {
    expect(readableUrl(AR)).toBe("https://zealous-seagreen-crow-18.hostingersite.com/ar/أفضل-شركة/");
    expect(readablePath(AR)).toBe("/ar/أفضل-شركة/");
  });

  it("keeps the input when it cannot be decoded or parsed", () => {
    expect(readableUrl("https://x.example/%E0%A4%A")).toBe("https://x.example/%E0%A4%A");
    expect(readablePath("not a url")).toBe("not a url");
  });

  it("path keeps the query and falls back to /", () => {
    expect(readablePath("https://x.example/?p=2")).toBe("/?p=2");
    expect(readablePath("https://x.example")).toBe("/");
  });

  it("visibleItems shows a few and counts the rest", () => {
    expect(visibleItems(["a", "b", "c"], 2)).toEqual({ shown: ["a", "b"], more: 1 });
    expect(visibleItems(["a"], 2)).toEqual({ shown: ["a"], more: 0 });
  });
});
