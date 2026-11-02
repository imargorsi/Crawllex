import { describe, expect, it } from "vitest";

import { REPORT_MAX_HIGHLIGHTS } from "@/lib/reports/constants";
import { createReportSchema } from "@/schemas/reports";

const base = { periodFrom: "2026-09-01", periodTo: "2026-09-30" };

describe("createReportSchema", () => {
  it("accepts a month period with optional notes", () => {
    const parsed = createReportSchema.parse({
      ...base,
      highlights: ["Blog launch"],
      translationStatus: "  In progress  ",
      closingNote: "",
    });
    expect(parsed.translationStatus).toBe("In progress");
    expect(parsed.closingNote).toBeNull();
    expect(parsed.highlights).toEqual(["Blog launch"]);
  });

  it("defaults highlights to an empty list", () => {
    expect(createReportSchema.parse(base).highlights).toEqual([]);
  });

  it("rejects a start date after the end date", () => {
    expect(() => createReportSchema.parse({ periodFrom: "2026-09-30", periodTo: "2026-09-01" })).toThrow();
  });

  it("rejects ranges longer than 366 days", () => {
    expect(() => createReportSchema.parse({ periodFrom: "2025-01-01", periodTo: "2026-12-31" })).toThrow();
  });

  it("rejects malformed dates", () => {
    expect(() => createReportSchema.parse({ periodFrom: "2026/09/01", periodTo: "2026-09-30" })).toThrow();
  });

  it("caps highlights", () => {
    const highlights = Array.from({ length: REPORT_MAX_HIGHLIGHTS + 1 }, (_, index) => `Item ${index}`);
    expect(() => createReportSchema.parse({ ...base, highlights })).toThrow();
  });
});
