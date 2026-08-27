"use client";

import type { TAppIconComponent } from "@/components/ui/app-icon";
import { Icons } from "@/lib/frontend/icons/app-icons";

import { useTranslation } from "react-i18next";
import Link from "next/link";

import {
  elevatedCardSurfaceClass,
  typeStackMdClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { withDateRangeQuery } from "@/lib/frontend/routing/with-date-range-query.utils";
import { formatSummaryMetricCount } from "@/components/ui/summary-metric-cards";
import { cn } from "@/lib/utils";

export type TDashboardSeoPulseValues = {
  leads: number | null;
  backlinks: number | null;
  pageViews: number | null;
  blogs: number | null;
};

type TPulseCardId = keyof TDashboardSeoPulseValues;

type TPulseCardDef = {
  id: TPulseCardId;
  labelKey: TPulseCardId;
  icon: TAppIconComponent;
  accent: string;
  href: string | null;
};

type TDashboardSeoPulseProps = {
  values: TDashboardSeoPulseValues;
  isLoading?: boolean;
  className?: string;
  /** Tighter 2×2 cards. Prefer `variant="row"` on `/dashboard`. */
  compact?: boolean;
  /** `row` = compact 4-up KPI strip. `stack` = 2×2 filling the parent. */
  variant?: "row" | "stack";
  from?: string;
  to?: string;
};

function formatValue(value: number | null): string {
  if (value == null) return "—";
  return formatSummaryMetricCount(value);
}

function CardSkeleton({ isRow }: { isRow: boolean }) {
  return (
    <div
      className={cn(
        elevatedCardSurfaceClass,
        "rounded-2xl min-w-0",
        isRow ? "flex items-center gap-3 p-3" : "flex h-full min-h-0 flex-col justify-between p-3.5",
      )}
    >
      <div className="size-9 shrink-0 animate-pulse rounded-xl bg-bg-hover/70" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-bg-hover/70" />
        <div className="h-6 w-12 animate-pulse rounded-lg bg-bg-hover/80" />
      </div>
    </div>
  );
}

export function DashboardSeoPulse({
  values,
  isLoading,
  className,
  compact = false,
  variant = "stack",
  from,
  to,
}: TDashboardSeoPulseProps) {
  const { t } = useTranslation("translation", { keyPrefix: "home.pulse" });
  const isRow = variant === "row";

  const cards: TPulseCardDef[] = [
    {
      id: "leads",
      labelKey: "leads",
      icon: Icons.userGroup,
      accent: "var(--status-pending)",
      href: values.leads == null ? null : withDateRangeQuery("/leads", from, to),
    },
    {
      id: "backlinks",
      labelKey: "backlinks",
      icon: Icons.link,
      accent: "var(--status-active)",
      href: values.backlinks == null ? null : withDateRangeQuery("/seo-activities?type=backlinks", from, to),
    },
    {
      id: "pageViews",
      labelKey: "pageViews",
      icon: Icons.view,
      accent: "var(--color-secondary)",
      href: values.pageViews == null ? null : withDateRangeQuery("/analytics", from, to),
    },
    {
      id: "blogs",
      labelKey: "blogs",
      icon: Icons.file,
      accent: "var(--status-invited)",
      href: values.blogs == null ? null : withDateRangeQuery("/seo-activities?type=blogs", from, to),
    },
  ];

  const gridClass = cn(
    "grid min-w-0",
    isRow
      ? "grid-cols-2 gap-2.5 xl:grid-cols-4"
      : cn("h-full min-h-0 grid-cols-2", compact ? "gap-2.5" : "gap-3 sm:gap-4"),
    className,
  );

  if (isLoading) {
    return (
      <div className={gridClass}>
        {cards.map((card) => (
          <CardSkeleton key={card.id} isRow={isRow} />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {cards.map((card) => {
        const Icon = card.icon;
        const raw = values[card.id];
        const display = formatValue(raw);
        const description =
          raw == null
            ? t("descriptions.unavailable")
            : t(`descriptions.${card.labelKey}`, { count: display });

        const iconWell = (
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border backdrop-blur-md"
            style={{
              color: card.accent,
              borderColor: `color-mix(in srgb, ${card.accent} 45%, transparent)`,
              background: `color-mix(in srgb, ${card.accent} 16%, transparent)`,
            }}
            aria-hidden
          >
            <Icon className="size-4" />
          </span>
        );

        const content = isRow ? (
          <div className="relative z-10 flex min-w-0 items-center gap-3">
            {iconWell}
            <div className="min-w-0">
              <p className="truncate type-caption font-medium text-text-secondary">
                {t(`cards.${card.labelKey}`)}
              </p>
              <p className="truncate type-title font-semibold tracking-tight text-text-primary tabular-nums leading-tight">
                {display}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative z-10 flex items-start justify-between gap-2">
              <p className="type-caption font-medium text-text-secondary">
                {t(`cards.${card.labelKey}`)}
              </p>
              {iconWell}
            </div>
            <div className={cn(typeStackMdClass, "relative z-10 mt-auto min-w-0")}>
              <p
                className={cn(
                  "font-semibold tracking-tight text-text-primary tabular-nums leading-none",
                  compact ? "type-h2" : "type-h1",
                )}
              >
                {display}
              </p>
              {compact ? null : (
                <p className="line-clamp-2 type-caption leading-snug text-text-muted">
                  {description}
                </p>
              )}
            </div>
            {card.href && !compact ? (
              <span
                className="absolute bottom-2.5 inset-e-2.5 z-10 inline-flex size-6 items-center justify-center rounded-full border border-border/40 bg-bg-card/30 text-text-muted opacity-70 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-hover:text-brand"
                aria-hidden
              >
                <Icons.arrowRight className="size-3" />
              </span>
            ) : null}
          </>
        );

        const shellClass = cn(
          elevatedCardSurfaceClass,
          "group relative min-w-0 overflow-hidden rounded-2xl bg-bg-card/20 dark:bg-text-primary/5",
          isRow
            ? "p-3"
            : cn(
                "flex h-full min-h-0 flex-col",
                compact ? "gap-2 p-3 sm:p-3.5" : "min-h-36 gap-3 p-4 sm:p-5",
              ),
          card.href &&
            "transition-[border-color,background-color] duration-200 hover:border-accent-border/55 hover:bg-bg-card/35 dark:hover:bg-text-primary/8",
        );

        if (card.href) {
          return (
            <Link key={card.id} href={card.href} className={shellClass} title={description}>
              <div
                className="pointer-events-none absolute inset-0 opacity-90"
                style={{
                  background: `radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, ${card.accent} 16%, transparent), transparent 55%)`,
                }}
                aria-hidden
              />
              {content}
            </Link>
          );
        }

        return (
          <div key={card.id} className={shellClass}>
            <div
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{
                background: `radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, ${card.accent} 16%, transparent), transparent 55%)`,
              }}
              aria-hidden
            />
            {content}
          </div>
        );
      })}
    </div>
  );
}
