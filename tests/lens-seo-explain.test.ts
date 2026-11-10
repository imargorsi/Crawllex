import { describe, expect, it } from "vitest";

import { explainIssue, SEO_EXPLANATIONS } from "@/lib/lens/seo-explain";

describe("SEO explanations", () => {
  it("every explanation has a title, a reason and a fix", () => {
    for (const [code, text] of Object.entries(SEO_EXPLANATIONS)) {
      expect(text.title.length, code).toBeGreaterThan(3);
      expect(text.why.length, code).toBeGreaterThan(20);
      expect(text.fix.length, code).toBeGreaterThan(10);
    }
  });

  it("unknown codes get a readable fallback, not a raw code", () => {
    const text = explainIssue("some_future_rule");
    expect(text.title).toBe("Some future rule");
  });
});
