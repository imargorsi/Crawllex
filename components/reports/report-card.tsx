"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/ui/spinner";
import type { TAppIconComponent } from "@/components/ui/app-icon";
import {
  elevatedCardMutedClass,
  elevatedCardSurfaceClass,
  elevatedCardTitleClass,
} from "@/lib/frontend/layout/dashboard-chrome";
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

type TReportActionTone = "brand" | "default" | "destructive";

const ACTION_WELL: Record<TReportActionTone, string> = {
  brand: "border-brand/35 bg-brand/12 text-brand",
  default: "border-brand/30 bg-brand/15 text-brand",
  destructive: "border-status-rejected/35 bg-status-rejected/12 text-status-rejected",
};

const ACTION_CLASS =
  "group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60";

type TReportActionContentProps = {
  label: string;
  tone: TReportActionTone;
  icon: TAppIconComponent;
  isLoading?: boolean;
};

function ReportActionContent({ label, tone, icon: Icon, isLoading = false }: TReportActionContentProps) {
  return (
    <>
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full border transition-transform duration-200 group-hover:scale-105",
          ACTION_WELL[tone],
        )}
        aria-hidden
      >
        {isLoading ? <Spinner className="size-5" /> : <Icon className="size-5" />}
      </span>
      <span className={cn("type-caption-xs text-center font-semibold leading-tight", elevatedCardTitleClass)}>
        {label}
      </span>
    </>
  );
}

function ReportActionLink(props: TReportActionContentProps & { href: string }) {
  const { href, ...content } = props;
  return (
    <Link href={href} className={ACTION_CLASS}>
      <ReportActionContent {...content} />
    </Link>
  );
}

function ReportActionButton(props: TReportActionContentProps & { onClick: () => void; disabled?: boolean }) {
  const { onClick, disabled, ...content } = props;
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={ACTION_CLASS} aria-label={content.label}>
      <ReportActionContent {...content} />
    </button>
  );
}

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
          className="pointer-events-none absolute -right-8 -top-10 w-44 motion-safe:animate-[report-cover-dots_9s_ease-in-out_infinite]"
        />
        <img
          src="/report-assets/cover-art.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-6 right-0 w-[78%] mix-blend-multiply motion-safe:animate-[report-cover-drift_12s_ease-in-out_infinite]"
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

        <div className="mt-auto flex items-start justify-around gap-2 pt-3">
          <ReportActionLink href={`/reports/${report.id}`} label={t("open")} tone="brand" icon={Icons.view} />
          <ReportActionButton
            label={t("downloadPdf")}
            tone="default"
            icon={Icons.cloudDownload}
            disabled={isDownloading}
            isLoading={isDownloading}
            onClick={() => onDownload(report)}
          />
          {canDelete ? (
            <ReportActionButton
              label={t("deleteAction")}
              tone="destructive"
              icon={Icons.delete}
              onClick={() => onDelete(report)}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
