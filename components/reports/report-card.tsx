"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Button, buttonVariants } from "@/components/ui/button";
import { elevatedCardMutedClass, elevatedCardSurfaceClass, elevatedCardTitleClass } from "@/lib/frontend/layout/dashboard-chrome";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { formatMonthTitle, formatPeriodLabel } from "@/lib/reports/period";
import { cn } from "@/lib/utils";
import type { TReportListItemDto } from "@/types/reports.types";

export type TReportCardProps = {
  report: TReportListItemDto;
  clientName: string;
  clientLogoUrl: string | null;
  canDelete: boolean;
  isDownloading: boolean;
  onDownload: (report: TReportListItemDto) => void;
  onDelete: (report: TReportListItemDto) => void;
};

/** One saved report: cover thumbnail, client, period, and actions. */
export function ReportCard({
  report,
  clientName,
  clientLogoUrl,
  canDelete,
  isDownloading,
  onDownload,
  onDelete,
}: TReportCardProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.reports" });
  const monthTitle = formatMonthTitle(report.periodFrom);

  return (
    <article className={cn(elevatedCardSurfaceClass, "flex flex-col overflow-hidden rounded-3xl")}>
      <div className="relative h-44 overflow-hidden border-b border-border bg-bg-hover">
        <img
          src="/report-assets/dots.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 w-44 opacity-80"
        />
        <img
          src="/report-assets/cover-art.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-6 right-0 w-[78%] mix-blend-multiply"
        />
        <img src="/report-assets/lc-logo.svg" alt="Logical Creations" className="absolute left-4 top-4 h-8 w-auto" />
        {clientLogoUrl ? (
          <img
            src={clientLogoUrl}
            alt={clientName}
            className="absolute right-4 top-4 h-9 max-w-[7rem] rounded-lg bg-white/90 object-contain p-1"
          />
        ) : null}
        <span className="absolute bottom-3 left-4 rounded-lg bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {monthTitle}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="min-w-0">
          <h3 className={cn("truncate type-title", elevatedCardTitleClass)}>{clientName}</h3>
          <p className={cn("mt-1 flex items-center gap-2 text-sm", elevatedCardMutedClass)}>
            <Icons.calendar className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{formatPeriodLabel(report.periodFrom, report.periodTo)}</span>
          </p>
        </div>
        <p className={cn("text-xs", elevatedCardMutedClass)}>
          {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(report.createdAt))}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <Link
            href={`/reports/${report.id}`}
            className={cn(buttonVariants({ variant: "primary", size: "small" }), "flex-1 justify-center")}
          >
            <Icons.view className="size-4" aria-hidden />
            {t("open")}
          </Link>
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={() => onDownload(report)}
            disabled={isDownloading}
            aria-label={t("downloadPdf")}
            title={t("downloadPdf")}
          >
            <Icons.cloudDownload className="size-4" aria-hidden />
          </Button>
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="small"
              onClick={() => onDelete(report)}
              aria-label={t("deleteAction")}
              title={t("deleteAction")}
            >
              <Icons.delete className="size-4 text-destructive" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
