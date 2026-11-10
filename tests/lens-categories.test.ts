import { describe, expect, it } from "vitest";

import { categoryOf, groupOf, GROUP_ORDER } from "@/lib/lens/categories";
import { healthScore, PENALTY_CAP, severityCounts } from "@/lib/lens/score";

describe("categoryOf", () => {
  it("puts viewport and accessibility checks in UI/UX", () => {
    expect(categoryOf("ui_small_tap_targets")).toBe("uiux");
    expect(categoryOf("ui_text_overflow")).toBe("uiux");
    expect(categoryOf("accessibility_violation")).toBe("uiux");
  });

  it("puts everything else in SEO", () => {
    expect(categoryOf("title_length_guideline")).toBe("seo");
    expect(categoryOf("broken_external_link")).toBe("seo");
  });
});

describe("groupOf", () => {
  it("groups SEO codes by topic", () => {
    expect(groupOf("missing_title")).toBe("titles");
    expect(groupOf("missing_meta_description")).toBe("descriptions");
    expect(groupOf("missing_h1")).toBe("headings");
    expect(groupOf("canonical_conflict")).toBe("indexing");
    expect(groupOf("robots_blocks_sitemap_page")).toBe("robots");
    expect(groupOf("thin_content_candidate")).toBe("content");
    expect(groupOf("broken_external_link")).toBe("links");
  });

  it("unknown codes go to Other, never disappear", () => {
    expect(groupOf("some_future_rule")).toBe("other");
    expect(GROUP_ORDER).toContain("other");
  });
});

describe("healthScore", () => {
  it("is 100 with no open issues and ignores resolved ones", () => {
    expect(healthScore([])).toBe(100);
    expect(healthScore([{ severity: "high", status: "resolved" }])).toBe(100);
  });

  it("costs points by severity and is capped", () => {
    expect(healthScore([{ severity: "high", status: "open" }, { severity: "low", status: "open" }])).toBe(93);
    const many = Array.from({ length: 100 }, () => ({ severity: "high" as const, status: "open" }));
    expect(healthScore(many)).toBe(100 - PENALTY_CAP);
  });

  it("counts open issues by severity", () => {
    expect(severityCounts([
      { severity: "high", status: "open" },
      { severity: "low", status: "open" },
      { severity: "low", status: "resolved" },
    ])).toEqual({ high: 1, medium: 0, low: 1 });
  });
});
