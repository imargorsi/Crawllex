import { describe, expect, it } from "vitest";

import { buildSeoSummary } from "@/lib/lens/seo-summary";
import { EMPTY_UPTIME, formatMs, formatPercent } from "@/features/lens/uptime-format";

const base = { issues: [], checked: 10, known: 10, partial: false };

describe("Lens uptime display", () => {
  it("formats null figures as a dash", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(99.5)).toBe("99.50%");
    expect(formatMs(null)).toBe("—");
    expect(formatMs(412)).toBe("412 ms");
  });

  it("empty uptime is unknown with 30 empty days and no figures", () => {
    expect(EMPTY_UPTIME.uptime.status).toBe("unknown");
    expect(EMPTY_UPTIME.uptime.percent).toBeNull();
    expect(EMPTY_UPTIME.incidents).toEqual([]);
  });

  it("summary has no uptime bullet when there is no uptime data", () => {
    const bullets = buildSeoSummary({ ...base, uptimePercent: null });
    expect(bullets.some((b) => b.key.startsWith("bullet_uptime"))).toBe(false);
  });

  it("summary keeps the uptime bullet when there is data", () => {
    expect(buildSeoSummary({ ...base, uptimePercent: 99.95 }).some((b) => b.key === "bullet_uptime_good")).toBe(true);
    expect(buildSeoSummary({ ...base, uptimePercent: 97 }).some((b) => b.key === "bullet_uptime_low")).toBe(true);
  });
});
