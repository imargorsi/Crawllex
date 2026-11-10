import { describe, expect, it } from "vitest";

import { buildReportView } from "@/lib/reports/view-model";
import type { TRichDoc } from "@/lib/reports/rich-text";
import { reportSnapshot } from "./helpers/report-snapshot";

const nextSteps: TRichDoc = [{ type: "paragraph", runs: [{ text: "Publish two guides next month." }] }];

describe("next steps tab (dashboard)", () => {
  it("is not in the default view, so the PDF keeps its current sections", () => {
    const snapshot = reportSnapshot("Silver Foundation", "unused");
    snapshot.notes = { nextSteps };
    const view = buildReportView(snapshot);
    expect(view.sections.map((section) => section.id)).not.toContain("next");
  });

  it("adds a Next steps section with the written text when requested", () => {
    const snapshot = reportSnapshot("Silver Foundation", "unused");
    snapshot.notes = { nextSteps };
    const view = buildReportView(snapshot, { nextSteps: true });
    const section = view.sections.find((item) => item.id === "next");
    expect(section?.title).toBe("Next steps");
    expect(section?.blocks).toEqual([{ type: "rich", doc: nextSteps }]);
  });

  it("shows a note when an older report has no next steps", () => {
    const snapshot = reportSnapshot("Silver Foundation", "unused");
    snapshot.notes = {};
    const view = buildReportView(snapshot, { nextSteps: true });
    const section = view.sections.find((item) => item.id === "next");
    expect(section?.blocks[0]).toMatchObject({ type: "note" });
  });
});
