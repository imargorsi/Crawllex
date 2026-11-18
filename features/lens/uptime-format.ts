import type { TLensIncident, TLensUptime } from "@/features/lens/lens.types";

/** Shown until Lens answers, or when the project has no uptime checks yet. Never fake figures. */
export const EMPTY_UPTIME: { uptime: TLensUptime; incidents: TLensIncident[] } = {
  uptime: {
    status: "unknown",
    percent: null,
    totalDowntimeMin: 0,
    incidents: 0,
    avgResponseMs: null,
    p95ResponseMs: null,
    lastCheckedAt: null,
    lastSuccessAt: null,
    daily: [],
    checks: 0,
  },
  incidents: [],
};

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(2)}%`;
}

export function formatMs(value: number | null): string {
  return value === null ? "—" : `${value} ms`;
}
