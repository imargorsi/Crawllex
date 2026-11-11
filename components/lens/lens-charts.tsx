"use client";

import { cn } from "@/lib/utils";

/**
 * Daily uptime bars for Lens. One bar per day, colored by availability.
 * Null days (no checks) show a flat grey stub, never zero. Colors come from theme tokens.
 */

type TDay = { day: string; uptimePct: number | null };

const FLOOR = 98;
const CEIL = 100;
const LEVELS = [100, 99.5, 99, 98.5, 98];

function barColor(pct: number | null) {
  if (pct == null) return "var(--border)";
  if (pct >= 99.5) return "var(--color-success)";
  if (pct >= 98) return "var(--color-warning)";
  return "var(--destructive)";
}

/** "2026-10-12" to "Oct 12", in UTC so the day never shifts. */
export function formatUptimeDay(day: string, locale: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function LensUptimeBars({ days, height = 260, locale = "en" }: { days: TDay[]; height?: number; locale?: string }) {
  const span = CEIL - FLOOR;
  const yPct = (v: number) => ((CEIL - v) / span) * 100;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="relative w-10 shrink-0 text-[11px] tabular-nums text-text-muted" style={{ height }} aria-hidden>
          {LEVELS.map((level) => (
            <span key={level} className="absolute right-0 -translate-y-1/2" style={{ top: `${yPct(level)}%` }}>
              {level.toFixed(level % 1 === 0 ? 0 : 1)}%
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height }} role="img" aria-label="Daily uptime, last 30 days">
          {LEVELS.map((level) => (
            <div
              key={level}
              className={cn("absolute inset-x-0 border-t", level === CEIL ? "border-border" : "border-dashed border-border/60")}
              style={{ top: `${yPct(level)}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-[5px]">
            {days.map((d) => {
              const pct = d.uptimePct;
              const top = pct == null ? 96 : Math.max(0, Math.min(100, yPct(pct)));
              return (
                <div key={d.day} className="relative h-full flex-1" title={`${d.day}: ${pct == null ? "no checks" : `${pct.toFixed(2)}%`}`}>
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t-md transition-[opacity] duration-200 hover:opacity-80"
                    style={{ top: `${top}%`, background: barColor(pct) }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-10 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 gap-[5px]">
          {days.map((d, i) => (
            <span key={d.day} className="relative flex-1">
              {i % 5 === 0 ? (
                <span className="absolute left-0 whitespace-nowrap text-[11px] tabular-nums text-text-muted">{formatUptimeDay(d.day, locale)}</span>
              ) : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Legend for the bar colors, shown under the chart. */
export function LensUptimeLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-secondary">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm" style={{ background: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export const UPTIME_LEGEND_COLORS = {
  good: "var(--color-success)",
  degraded: "var(--color-warning)",
  down: "var(--destructive)",
  none: "var(--border)",
};
