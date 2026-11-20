import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { IssueCard } from "@/components/lens/lens-issues";
import type { TLensIssue } from "@/features/lens/lens.types";

// Minimal translator: returns the key, with {{vars}} filled, so assertions do not depend on locale text.
const t = ((key: string, vars?: Record<string, unknown>) =>
  vars ? `${key}:${Object.values(vars).join("|")}` : key) as unknown as Parameters<typeof IssueCard>[0]["t"];

const base: TLensIssue = {
  id: "thin_content_candidate", title: "Thin content", severity: "advisory", group: "onpage", ruleGroup: "content",
  status: "open", resolvedOn: null, affected: 4, found: "Fewer than 300 words.", why: "Short pages rarely answer.",
  fix: "Add useful detail.", verify: "Advisory.", aiSuggestion: null,
  tracking: { firstSeen: "2026-11-20", events: [{ date: "2026-11-20", event: "opened" }] },
  pages: ["https://x.example/books/a", "https://x.example/books/b", "https://x.example/books/c", "https://x.example/about"],
};

const render = (issue: TLensIssue) =>
  renderToStaticMarkup(<IssueCard issue={issue} t={t} locale="en" onNavigate={() => {}} />);

describe("Lens issue card", () => {
  it("leads with the shared cause and its AI tip, with other pages separate", () => {
    const html = render({
      ...base,
      patterns: [{ kind: "section", key: "/books/", label: "/books/", count: 3, urls: base.pages.slice(0, 3),
        fixSteps: ["3 pages under /books/ are thin.", "Expand the template.", "Run another audit."], aiSuggestion: "Add a summary block." }],
      pageFixSteps: base.pages.map((url) => ({ url, steps: [`Step for ${url}`] })),
      pageSuggestions: [{ url: "https://x.example/about", text: "Expand the about page." }],
    });
    expect(html).toContain("recommendedFix");
    expect(html).toContain("oneChangeFixes:/books/");
    expect(html).toContain("Expand the template.");
    expect(html).toContain("Add a summary block.");
    expect(html).toContain("otherPages");
    expect(html).toContain("Step for https://x.example/about");
    expect(html).not.toContain("Step for https://x.example/books/a");
    expect(html).toContain("Expand the about page.");
  });

  it("falls back to the rule fix and pending AI text without page data", () => {
    const html = render(base);
    expect(html).toContain("Add useful detail.");
    expect(html).toContain("aiSuggestionPending");
  });

  it("decodes long Arabic page addresses in chips", () => {
    const html = render({ ...base, pages: ["https://x.example/ar/%d8%a3%d9%81%d8%b6%d9%84/"], affected: 1 });
    expect(html).toContain("/ar/أفضل/");
  });
});
