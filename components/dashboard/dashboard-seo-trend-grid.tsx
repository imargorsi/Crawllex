"use client";

import type { TAppIconComponent } from "@/components/ui/app-icon";
import { Icons } from "@/lib/frontend/icons/app-icons";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";
import { elevatedCardSurfaceClass, typeStackMdClass } from "@/lib/frontend/layout/dashboard-chrome";
import { withDateRangeQuery } from "@/lib/frontend/routing/with-date-range-query.utils";
import { cn } from "@/lib/utils";
import type { TAnalyticsCardMetricDto, TAnalyticsOverviewDto } from "@/types/analytics.types";

type TTrendCardId =
  | "clicks"
  | "impressions"
  | "ctr"
  | "position"
  | "engagementRate"
  | "avgSessionDuration";

type TTrendRowDef = {
  id: TTrendCardId;
  icon: TAppIconComponent;
  accent: string;
  invertTrend: boolean;
  format: (value: number | null | undefined) => string;
  metric: TAnalyticsCardMetricDto | undefined;
};

type TDashboardSeoTrendGridProps = {
  overview: TAnalyticsOverviewDto | undefined;
  isLoading?: boolean;
  className?: string;
  from?: string;
  to?: string;
};

function formatCompactNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value);
}

function formatPercentRatio(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function formatPosition(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}

function formatSessionDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return "—";
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function seriesDirection(values: number[], invert: boolean): "up" | "down" | "flat" {
  if (values.length < 2) return "flat";
  const first = values[0]!;
  const last = values[values.length - 1]!;
  if (last === first) return "flat";
  const rising = last > first;
  if (invert) return rising ? "down" : "up";
  return rising ? "up" : "down";
}

function RowSkeleton() {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 py-3.5 sm:gap-4 xl:min-h-16 xl:flex-1">
      <div className="flex min-w-0 items-center gap-3">
        <div className="size-10 shrink-0 animate-pulse rounded-2xl bg-bg-hover/70 sm:size-12" />
        <div className="min-w-0 space-y-2">
          <div className="h-3 w-16 animate-pulse rounded bg-bg-hover/70" />
          <div className="h-5 w-14 animate-pulse rounded-lg bg-bg-hover/80" />
        </div>
      </div>
      <div className="hidden min-w-0 max-w-44 space-y-2 sm:block">
        <div className="ms-auto h-3 w-36 max-w-full animate-pulse rounded bg-bg-hover/60" />
        <div className="ms-auto h-3 w-28 max-w-full animate-pulse rounded bg-bg-hover/50" />
      </div>
    </div>
  );
}

export function DashboardSeoTrendGrid({
  overview,
  isLoading,
  className,
  from,
  to,
}: TDashboardSeoTrendGridProps) {
  const { t } = useTranslation("translation", { keyPrefix: "home.trend" });
  const cardsData = overview?.cards;
  const engagement = overview?.engagement;

  const rows: TTrendRowDef[] = [
    {
      id: "clicks",
      icon: Icons.chartBar,
      accent: "var(--color-brand-primary)",
      invertTrend: false,
      format: formatCompactNumber,
      metric: cardsData?.clicks,
    },
    {
      id: "impressions",
      icon: Icons.view,
      accent: "var(--status-pending)",
      invertTrend: false,
      format: formatCompactNumber,
      metric: cardsData?.impressions,
    },
    {
      id: "ctr",
      icon: Icons.chartLine,
      accent: "var(--status-active)",
      invertTrend: false,
      format: formatPercentRatio,
      metric: cardsData?.ctr,
    },
    {
      id: "position",
      icon: Icons.analytics,
      accent: "var(--color-secondary)",
      invertTrend: true,
      format: formatPosition,
      metric: cardsData?.position,
    },
    {
      id: "engagementRate",
      icon: Icons.sparkles,
      accent: "var(--status-invited)",
      invertTrend: false,
      format: formatPercentRatio,
      metric: engagement?.engagementRate,
    },
    {
      id: "avgSessionDuration",
      icon: Icons.clock,
      accent: "var(--color-brand-primary)",
      invertTrend: false,
      format: formatSessionDuration,
      metric: engagement?.avgSessionDuration,
    },
  ];

  const panelClass = cn(
    elevatedCardSurfaceClass,
    "flex w-full min-w-0 flex-col rounded-2xl bg-bg-card/20 p-4 sm:p-5 dark:bg-text-primary/5",
    className,
  );

  if (isLoading && !overview) {
    return (
      <div className={panelClass}>
        <div className="h-5 w-44 max-w-full shrink-0 animate-pulse rounded bg-bg-hover/70" />
        <div className="mt-2 h-3 w-64 max-w-full shrink-0 animate-pulse rounded bg-bg-hover/50" />
        <div className="mt-3 flex flex-col divide-y divide-border/40 dark:divide-text-primary/12 xl:min-h-0 xl:flex-1">
          {rows.map((row) => (
            <RowSkeleton key={row.id} />
          ))}
        </div>
      </div>
    );
  }

  const hasAnySignal = rows.some(
    (row) => row.metric?.value != null || (row.metric?.sparkline?.length ?? 0) > 0,
  );

  if (!hasAnySignal) {
    return (
      <div className={cn(panelClass, "items-center justify-center p-4")}>
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
      </div>
    );
  }

  return (
    <section className={panelClass} aria-label={t("gridAria")}>
      <div className={cn(typeStackMdClass, "shrink-0")}>
        <p className="type-title text-text-primary">{t("title")}</p>
        <p className="type-caption leading-snug text-text-secondary">{t("subtitle")}</p>
      </div>
      <div
        className="mt-3 flex flex-col divide-y divide-border/40 dark:divide-text-primary/12 xl:min-h-0 xl:flex-1"
        role="list"
      >
        {rows.map((row) => {
          const Icon = row.icon;
          const sparkline = row.metric?.sparkline ?? [];
          const direction = seriesDirection(sparkline, row.invertTrend);
          const display = row.format(row.metric?.value);
          const hasValue = row.metric?.value != null;
          const description = hasValue
            ? t(`descriptions.${row.id}`, { count: display })
            : t("descriptions.unavailable");

          return (
            <Link
              key={row.id}
              href={withDateRangeQuery("/analytics", from, to)}
              role="listitem"
              className="group flex min-w-0 items-center justify-between gap-3 py-3.5 sm:gap-4 xl:min-h-16 xl:flex-1"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border backdrop-blur-md sm:size-12 sm:rounded-2xl"
                  style={{
                    color: row.accent,
                    borderColor: `color-mix(in srgb, ${row.accent} 42%, transparent)`,
                    background: `color-mix(in srgb, ${row.accent} 14%, transparent)`,
                  }}
                  aria-hidden
                >
                  <Icon className="size-5 sm:size-6" />
                </span>

                <div className={cn(typeStackMdClass, "min-w-0")}>
                  <p className="truncate type-caption font-medium text-text-secondary">
                    {t(`cards.${row.id}`)}
                  </p>
                  <p className="flex min-w-0 items-center gap-1 type-title font-semibold tracking-tight text-text-primary tabular-nums leading-none">
                    {display}
                    {direction === "up" ? (
                      <Icons.arrowUp className="size-4 shrink-0 text-status-active" aria-hidden />
                    ) : null}
                    {direction === "down" ? (
                      <Icons.arrowDown className="size-4 shrink-0 text-status-rejected" aria-hidden />
                    ) : null}
                  </p>
                </div>
              </div>

              <div className={cn(typeStackMdClass, "min-w-0 max-w-[min(16rem,46%)] text-end")}>
                <p className="line-clamp-2 type-caption leading-snug text-text-secondary">{description}</p>
                <p className="type-caption leading-snug text-text-muted">
                  {t(`direction.${direction}`)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
