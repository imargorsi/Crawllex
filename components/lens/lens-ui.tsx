"use client";

import type { ComponentType, ReactNode } from "react";

import { elevatedCardSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

/** Lens card: Crawllex glass panel with the 24px radius. Colors come from theme tokens only. */
export const LENS_CARD = cn(elevatedCardSurfaceClass, "relative flex min-w-0 flex-col gap-4 overflow-hidden rounded-3xl border-border p-5 sm:p-6 dark:border-text-primary/40");

/** Top-level Lens cards: no fill, soft 3D lift from the theme shadow token. */
export const LENS_FLOAT_CARD = cn(
  "relative flex min-w-0 flex-col gap-4 overflow-hidden rounded-3xl border border-border bg-transparent p-5 shadow-(--shadow) transition-[border-color,box-shadow] duration-200 ease-out hover:border-accent-border/60 hover:shadow-(--shadow-elevated) sm:p-6 dark:border-text-primary/40",
);

/**
 * Whole card is clickable. `onOpen` is optional: without it the card shows the same affordance and does nothing yet.
 * Set `interactive={false}` for cards that hold their own buttons (nested interactive elements are not allowed).
 */
export function LensClickCard({ children, className, onOpen, label, interactive = true }: {
  children: ReactNode;
  className?: string;
  onOpen?: () => void;
  label?: string;
  interactive?: boolean;
}) {
  if (!interactive) {
    return <div className={cn(LENS_FLOAT_CARD, className)}>{children}</div>;
  }
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(LENS_FLOAT_CARD, "group cursor-pointer text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border", className)}
    >
      {children}
    </div>
  );
}

export type TLensTone = "brand" | "success" | "warning" | "danger" | "muted";

const TONE_CLASS: Record<TLensTone, string> = {
  brand: "border-brand/40 bg-brand/15 text-brand",
  success: "border-success/40 bg-success/15 text-success",
  warning: "border-warning/40 bg-warning/15 text-warning",
  danger: "border-destructive/40 bg-destructive/15 text-destructive",
  muted: "border-border bg-bg-hover text-text-muted",
};

/** Status pill. Dot + label, tinted by tone. Never color only. */
export function LensPill({ tone, children, className }: { tone: TLensTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", TONE_CLASS[tone], className)}>
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

/** Card header: icon well, title, optional action on the right. */
export function LensCardHeader({ icon: Icon, title, action }: { icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-text-primary/12 bg-text-primary/[0.04] dark:border-text-primary/18 dark:bg-text-primary/[0.06]">
          <Icon className="size-4 text-brand" aria-hidden />
        </span>
        <h2 className="truncate text-base font-semibold text-text-primary">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Stat block: small label, large value. */
export function LensStat({ label, value, icon: Icon }: { label: string; value: ReactNode; icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }> }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs text-text-muted">
        {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
        <span className="truncate">{label}</span>
      </span>
      <span className="text-lg font-semibold tabular-nums text-text-primary">{value}</span>
    </div>
  );
}

export type TLensBand = { from: number; to: number; color: string };

/**
 * Health ring: the track is split into the three score bands (colors from theme tokens),
 * the filled arc shows the score, and a marker sits on the score so the position is readable at a glance.
 */
export function LensScoreRing({ score, bands, size = 180, centerLabel }: {
  score: number;
  bands: TLensBand[];
  size?: number;
  centerLabel?: string;
}) {
  const stroke = 14;
  const radius = size / 2 - stroke;
  const c = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const angle = -Math.PI / 2 + (clamped / 100) * 2 * Math.PI;
  const markerColor = bands.find((b) => clamped >= b.from && clamped < b.to)?.color ?? bands[bands.length - 1]?.color ?? "var(--brand)";
  const mx = size / 2 + radius * Math.cos(angle);
  const my = size / 2 + radius * Math.sin(angle);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`${clamped} / 100`}>
        {bands.map((band) => {
          const len = ((band.to - band.from) / 100) * c;
          const offset = (band.from / 100) * c;
          return (
            <circle
              key={`${band.from}-${band.to}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={band.color}
              strokeOpacity={0.22}
              strokeWidth={stroke}
              strokeDasharray={`${len - 2} ${c}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={markerColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <circle cx={mx} cy={my} r={stroke / 2 + 3} fill="var(--bg-card)" stroke={markerColor} strokeWidth={3} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-semibold tabular-nums text-text-primary">{clamped}</span>
        <span className="text-xs text-text-muted">{centerLabel ?? "/ 100"}</span>
      </div>
    </div>
  );
}

/** Segmented pill tabs. Items with `disabled` stay visible as placeholders until their page exists. */
export function LensTabs<T extends string>({ items, value, onChange, label }: {
  items: { id: T; label: string; count?: number; disabled?: boolean; hint?: string }[];
  value: T | null;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn(elevatedCardSurfaceClass, "flex flex-wrap gap-1 rounded-full p-1.5")}>
      {items.map((item) => (
        <button
          key={item.id}
          role="tab"
          type="button"
          aria-selected={value === item.id}
          aria-disabled={item.disabled || undefined}
          disabled={item.disabled}
          title={item.disabled ? item.hint : undefined}
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
            item.disabled
              ? "cursor-not-allowed text-text-disabled"
              : value === item.id
                ? "bg-brand text-text-on-brand shadow-sm"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
          )}
        >
          <span className="inline-flex items-center gap-2">
            {item.label}
            {item.count != null ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  value === item.id && !item.disabled ? "bg-white/20" : "bg-bg-hover text-text-muted",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Stacked severity bar with legend rows underneath. */
export function LensSeverityBars({ rows }: { rows: { label: string; value: number; tone: TLensTone }[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  const fill: Record<TLensTone, string> = {
    brand: "bg-brand",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    muted: "bg-text-muted",
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-bg-hover">
        {rows.map((row) => (
          <div key={row.label} className={cn("h-full", fill[row.tone])} style={{ width: `${(row.value / total) * 100}%` }} />
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-text-primary">
              <span className={cn("size-2 rounded-full", fill[row.tone])} aria-hidden />
              {row.label}
            </span>
            <span className="font-semibold tabular-nums text-text-primary">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Empty well used by sub-sections with no data. */
export function LensEmpty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-text-muted">{children}</p>;
}

export type TLensSeverity = "high" | "medium" | "advisory";

/** Severity to tone. Advisory items are shown but never scored (see docs/SEO-RULES.md). */
export function severityTone(severity: TLensSeverity): TLensTone {
  return severity === "high" ? "danger" : severity === "medium" ? "warning" : "muted";
}

/** Trend wave along the bottom of a stat tile. Decorative: the tint comes from the tile's tone. */
export function LensWave({ values, color }: { values: number[]; color: string }) {
  const w = 100;
  const h = 40;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - (v / max) * (h - 8) - 4] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-auto block h-12 w-full" aria-hidden>
      <path d={area} fill={color} fillOpacity={0.16} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Top navigation: icon tabs in one glass bar, with counts. Used for the page-level tabs. */
export function LensNavBar<T extends string>({ items, value, onChange, label }: {
  items: { id: T; label: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; count?: number }[];
  value: T | null;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const index = items.findIndex((item) => item.id === value);
        const step = e.key === "ArrowRight" ? 1 : -1;
        const next = items[(index + step + items.length) % items.length];
        if (next) onChange(next.id);
      }}
      className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-text-primary/[0.03] p-1.5 shadow-sm backdrop-blur-md dark:border-text-primary/35"
    >
      {items.map((item) => {
        const active = value === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border",
              active ? "bg-brand text-text-on-brand shadow-sm" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {item.label}
            {item.count != null ? (
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-white/20" : "bg-bg-hover text-text-muted")}>{item.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
