/**
 * Uptime and incident demo data. TEMPORARY: uptime is not wired to Lens yet (uptime monitor phase).
 * SEO data is never demo: it comes from GET /v1/projects/:id/seo (features/lens/lens.api.ts).
 */
import type { TLensIncident, TLensUptime, TLensUptimeDay } from "@/features/lens/lens.types";

function dailyUptime(): TLensUptimeDay[] {
  const days: TLensUptimeDay[] = [];
  const start = new Date("2026-10-12T00:00:00Z");
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    let pct: number | null = 100;
    if (i === 9) pct = 99.2;
    else if (i === 21) pct = 98.4;
    else if (i === 14) pct = null;
    else if (i % 5 === 2) pct = 99.97;
    days.push({ day: d.toISOString().slice(0, 10), uptimePct: pct });
  }
  return days;
}

export const LENS_DEMO_UPTIME: { uptime: TLensUptime; incidents: TLensIncident[] } = {
  uptime: {
    status: "operational",
    percent: 99.94,
    totalDowntimeMin: 26,
    incidents: 2,
    avgResponseMs: 428,
    p95ResponseMs: 712,
    lastCheckedAt: "2026-11-10T04:26:00Z",
    lastSuccessAt: "2026-11-10T04:26:00Z",
    daily: dailyUptime(),
    checks: 8640,
  },
  incidents: [
    { id: "inc-2", startedAt: "2026-11-06T06:12:00Z", durationMin: 18, status: "resolved", reason: "Website unavailable", detected: "2026-11-06T06:12:00Z", recovered: "2026-11-06T06:30:00Z" },
    { id: "inc-1", startedAt: "2026-10-21T14:02:00Z", durationMin: 8, status: "resolved", reason: "Server error (503)", detected: "2026-10-21T14:02:00Z", recovered: "2026-10-21T14:10:00Z" },
  ],
};
