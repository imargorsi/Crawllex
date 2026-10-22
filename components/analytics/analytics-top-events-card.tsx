"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";
import {
  summarizeEvents,
  type TEventHighlight,
  type THighlightKind,
} from "@/lib/analytics/event-summary";
import {
  analyticsPanelClass,
  elevatedCardSurfaceClass,
  glassPanelSurfaceClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";
import type { TAnalyticsDimensionRowDto } from "@/types/analytics.types";

type TAnalyticsTopEventsCardProps = {
  rows: TAnalyticsDimensionRowDto[];
  isLoading?: boolean;
  className?: string;
};

const KIND_ACCENT: Record<THighlightKind, string> = {
  lead: "var(--status-pending)",
  download: "var(--status-invited)",
  firstVisit: "var(--color-secondary)",
  pageView: "var(--status-active)",
  sessionStart: "var(--color-secondary)",
  engagement: "var(--gradient-mid)",
  click: "var(--color-brand-primary)",
  other: "var(--text-muted)",
};

export function AnalyticsTopEventsCard({ rows, isLoading, className }: TAnalyticsTopEventsCardProps) {
  const { t, i18n } = useTranslation("translation", { keyPrefix: "modules.analytics.topEvents" });

  const highlights = useMemo(
    () =>
      summarizeEvents(
        rows.map((row) => ({ dimensionValue: row.dimensionValue, eventCount: row.eventCount })),
      ).highlights,
    [rows],
  );
  const numberFormat = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
  const maxCount = highlights[0]?.count ?? 0;

  function labelFor(item: TEventHighlight): string {
    return item.kind === "other" ? item.label : t(`labels.${item.kind}`);
  }

  return (
    <section
      className={cn(elevatedCardSurfaceClass, analyticsPanelClass, "min-w-0", className)}
      aria-labelledby="analytics-top-events-title"
    >
      <div className="flex flex-col gap-1">
        <h2 id="analytics-top-events-title" className="type-title text-text-primary">
          {t("title")}
        </h2>
        <p className="type-caption text-text-muted">{t("subtitle")}</p>
      </div>

      {isLoading ? (
        <p className="mt-5 type-caption text-text-muted">{t("loading")}</p>
      ) : highlights.length === 0 ? (
        <div className="mt-5">
          <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label={t("listAria")}>
          {highlights.map((item) => {
            const accent = KIND_ACCENT[item.kind];
            const share = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            return (
              <li
                key={`${item.kind}:${item.name}`}
                className={cn(
                  glassPanelSurfaceClass,
                  "group flex min-w-0 flex-col gap-4 rounded-2xl p-4 transition-colors duration-200 hover:border-accent-border/50",
                )}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <p className="type-h2 font-semibold tracking-tight text-text-primary tabular-nums leading-none">
                    {numberFormat.format(item.count)}
                  </p>
                  <span
                    className="mt-0.5 inline-flex max-w-[55%] shrink-0 truncate rounded-md bg-bg-hover/60 px-1.5 py-0.5 font-mono text-[11px] text-text-muted"
                    title={item.name}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full ring-4 ring-current/15"
                      style={{ backgroundColor: accent, color: accent }}
                      aria-hidden
                    />
                    <p className="truncate type-label font-medium text-text-primary">{labelFor(item)}</p>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-bg-hover/70" aria-hidden>
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${share}%`, backgroundColor: accent }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
