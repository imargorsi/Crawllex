import { describe, expect, it } from "vitest";

import { createSeoActivitySchema } from "@/schemas/seo-activity";

const base = { type: "blogs", occurredOn: "2026-10-20", title: "My new post" } as const;

describe("create SEO activity with WordPress push", () => {
  it("accepts a blog push with a public Google Doc and no url", () => {
    const parsed = createSeoActivitySchema.parse({
      ...base,
      pushToWordpress: true,
      docUrl: "https://docs.google.com/document/d/1AbC_-xyz/edit?usp=sharing",
    });
    expect(parsed.pushToWordpress).toBe(true);
    expect(parsed.url).toBeUndefined();
    expect(parsed.docUrl).toBe("https://docs.google.com/document/d/1AbC_-xyz/edit?usp=sharing");
  });

  it("rejects a push without a Google Docs link", () => {
    const result = createSeoActivitySchema.safeParse({ ...base, pushToWordpress: true, docUrl: "https://example.com/post" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0])).toContain("docUrl");
  });

  it("rejects a push for non-blog activity types", () => {
    const result = createSeoActivitySchema.safeParse({
      type: "backlinks",
      occurredOn: "2026-10-20",
      url: "https://example.com",
      anchorText: "anchor",
      pushToWordpress: true,
      docUrl: "https://docs.google.com/document/d/1AbC/edit",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0])).toContain("pushToWordpress");
  });

  it("keeps the normal log flow: url required and must be http(s)", () => {
    expect(createSeoActivitySchema.safeParse({ ...base }).success).toBe(false);
    expect(createSeoActivitySchema.safeParse({ ...base, url: "ftp://x.com" }).success).toBe(false);
    const ok = createSeoActivitySchema.parse({ ...base, url: "https://example.com/post" });
    expect(ok.url).toBe("https://example.com/post");
    expect(ok.pushToWordpress).toBe(false);
  });
});
