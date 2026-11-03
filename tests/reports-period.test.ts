import { describe, expect, it } from "vitest";

import { formatCompactPeriodLabel, formatPeriodLabel, monthBounds, resolveReportPeriod } from "@/lib/reports/period";

describe("report period", () => {
  it("returns first and last day of a month", () => {
    expect(monthBounds(2026, 9)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(monthBounds(2026, 12)).toEqual({ from: "2026-12-01", to: "2026-12-31" });
  });

  it("handles leap years", () => {
    expect(monthBounds(2028, 2)).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(monthBounds(2026, 2)).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });

  it("compares a full calendar month with the previous calendar month", () => {
    const period = resolveReportPeriod("2026-09-01", "2026-09-30");
    expect(period.previousFrom).toBe("2026-08-01");
    expect(period.previousTo).toBe("2026-08-31");
    expect(period.label).toBe("1 September 2026 – 30 September 2026");
  });

  it("wraps January back to the previous December", () => {
    const period = resolveReportPeriod("2027-01-01", "2027-01-31");
    expect(period.previousFrom).toBe("2026-12-01");
    expect(period.previousTo).toBe("2026-12-31");
  });

  it("compares any other range with the same number of days before it", () => {
    const period = resolveReportPeriod("2026-09-10", "2026-09-19");
    expect(period.previousTo).toBe("2026-09-09");
    expect(period.previousFrom).toBe("2026-08-31");
  });

  it("formats labels with an en dash", () => {
    expect(formatPeriodLabel("2026-01-05", "2026-01-06")).toBe("5 January 2026 – 6 January 2026");
  });

  it("formats compact labels for tight UI", () => {
    expect(formatCompactPeriodLabel("2026-09-01", "2026-09-30")).toBe("1 Sep 2026 - 30 Sep 2026");
    expect(formatCompactPeriodLabel("2026-09-01", "2026-10-15")).toBe("1 Sep 2026 - 15 Oct 2026");
  });
});
