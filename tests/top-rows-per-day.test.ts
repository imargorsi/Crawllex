import { describe, expect, it } from "vitest";

import { classifyEvent, isContactKind } from "@/lib/analytics/event-summary";
import { topRowsPerDay } from "@/lib/analytics/top-rows-per-day";

type TRow = { date: string; eventName: string; eventCount: number };

const byCount = (a: TRow, b: TRow) => b.eventCount - a.eventCount;

describe("topRowsPerDay", () => {
  it("keeps the top N rows per date", () => {
    const rows: TRow[] = [
      { date: "2026-10-01", eventName: "a", eventCount: 1 },
      { date: "2026-10-01", eventName: "b", eventCount: 3 },
      { date: "2026-10-01", eventName: "c", eventCount: 2 },
      { date: "2026-10-02", eventName: "d", eventCount: 5 },
    ];
    const kept = topRowsPerDay(rows, 2, byCount);
    expect(kept.map((r) => r.eventName).sort()).toEqual(["b", "c", "d"]);
  });

  it("keeps pinned rows even when they fall outside the top N", () => {
    const rows: TRow[] = [
      { date: "2026-10-01", eventName: "page_view", eventCount: 500 },
      { date: "2026-10-01", eventName: "scroll", eventCount: 400 },
      { date: "2026-10-01", eventName: "click_tel", eventCount: 2 },
    ];
    const kept = topRowsPerDay(rows, 1, byCount, (row) => isContactKind(classifyEvent(row.eventName)));
    expect(kept.map((r) => r.eventName).sort()).toEqual(["click_tel", "page_view"]);
  });

  it("returns nothing for empty input", () => {
    expect(topRowsPerDay([], 5, byCount)).toEqual([]);
  });
});
