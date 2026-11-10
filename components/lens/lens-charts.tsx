"use client";

import type { ReactNode } from "react";

/** Charts for the Lens dashboard. Plain SVG, colored from the theme tokens, so they follow light and dark themes. */

export type DonutSegment = { label: string; value: number; color: string };

export function DonutChart({ segments, centerLabel, centerValue, size = 132 }: {
  segments: DonutSegment[];
  centerLabel: string;
  centerValue: string;
  size?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={12} />
        {total > 0
          ? segments.filter((s) => s.value > 0).map((s) => {
              const length = (s.value / total) * circumference;
              const dash = `${length} ${circumference - length}`;
              const node = (
                <circle key={s.label} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={s.color} strokeWidth={12}
                  strokeDasharray={dash} strokeDashoffset={-offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
              );
              offset += length;
              return node;
            })
          : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-text-primary">{centerValue}</span>
        <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
      </div>
    </div>
  );
}

export function BarList({ items, max }: { items: { label: string; value: number; color?: string }[]; max?: number }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-text-primary">{item.label}</span>
            <span className="tabular-nums text-muted-foreground">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg-hover">
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, (item.value / top) * 100)}%`, background: item.color ?? "var(--chart-1)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Daily uptime columns. Null values (no probes that day) are drawn as an empty slot, never as zero. */
export function UptimeColumns({ days }: { days: { day: string; uptimePct: number | null }[] }) {
  const width = 560;
  const height = 120;
  const gap = 4;
  const bar = days.length ? (width - gap * (days.length - 1)) / days.length : 0;
  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full" role="img" aria-label="Daily uptime">
        <line x1="0" x2={width} y1={height - 1} y2={height - 1} stroke="var(--border)" />
        {days.map((d, i) => {
          const x = i * (bar + gap);
          if (d.uptimePct == null) return <rect key={d.day} x={x} y={height - 4} width={bar} height={4} fill="var(--border)" />;
          const h = Math.max(4, (d.uptimePct / 100) * (height - 8));
          const color = d.uptimePct >= 99.5 ? "var(--color-success)" : d.uptimePct >= 98 ? "var(--color-warning)" : "var(--destructive)";
          return <rect key={d.day} x={x} y={height - h} width={bar} height={h} rx={3} fill={color}><title>{`${d.day}: ${d.uptimePct}%`}</title></rect>;
        })}
      </svg>
      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{days[0]?.day ?? ""}</span>
        <span>{days[days.length - 1]?.day ?? ""}</span>
      </div>
    </div>
  );
}

export function Sparkline({ values, width = 120, height = 36 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return <div className="h-9 w-[120px] rounded bg-bg-hover" aria-hidden="true" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / span) * (height - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="Trend">
      <polyline points={points} fill="none" stroke="var(--chart-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function ChartCard({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
