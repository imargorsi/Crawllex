"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/ui/spinner";
import type { TAppIconComponent } from "@/components/ui/app-icon";
import {
  elevatedCardBodyClass,
  elevatedCardMutedClass,
  elevatedCardSurfaceClass,
  elevatedCardTitleClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { formatMonthTitle } from "@/lib/reports/period";
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

/** Same pill treatment as the projects card "big" actions (ACTION_BUTTON_TONE). */
const ACTION_PILL: Record<TReportActionTone, string> = {
  brand:
    "border-brand/40 bg-brand/12 text-brand hover:bg-brand/20 hover:border-brand/55",
  default:
    "border-brand/35 bg-brand/12 text-brand hover:bg-brand/20 hover:border-brand/50",
  destructive:
    "border-status-rejected/40 bg-status-rejected/12 text-status-rejected hover:bg-status-rejected/20 hover:border-status-rejected/55",
};

const ACTION_BASE =
  "inline-flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60";

type TReportActionContentProps = {
  label: string;
  tone: TReportActionTone;
  icon: TAppIconComponent;
  isLoading?: boolean;
  iconOnly?: boolean;
};

function ReportActionContent({ label, icon: Icon, isLoading = false, iconOnly = false }: TReportActionContentProps) {
  return (
    <>
      {isLoading ? <Spinner className="size-4" /> : <Icon className="size-4 shrink-0" aria-hidden />}
      {iconOnly ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </>
  );
}

function ReportActionLink(props: TReportActionContentProps & { href: string }) {
  const { href, tone, iconOnly, ...content } = props;
  return (
    <Link href={href} className={cn(ACTION_BASE, ACTION_PILL[tone], iconOnly && "size-9 px-0")} title={content.label}>
      <ReportActionContent tone={tone} iconOnly={iconOnly} {...content} />
    </Link>
  );
}

function ReportActionButton(props: TReportActionContentProps & { onClick: () => void; disabled?: boolean }) {
  const { onClick, disabled, tone, iconOnly, ...content } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={content.label}
      aria-label={content.label}
      className={cn(ACTION_BASE, ACTION_PILL[tone], iconOnly && "size-9 px-0")}
    >
      <ReportActionContent tone={tone} iconOnly={iconOnly} {...content} />
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
    <article
      className={cn(
        elevatedCardSurfaceClass,
        "group relative flex flex-col overflow-hidden rounded-3xl transition-shadow duration-300 hover:shadow-[0_0_32px_-12px_var(--status-invited)]",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-0.5"
        style={{ background: "linear-gradient(90deg, var(--brand), var(--status-invited))" }}
      />
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

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className={cn("min-w-0 truncate text-lg font-semibold", elevatedCardTitleClass)}>{monthTitle}</h3>
          <span className="inline-flex max-w-[45%] shrink-0 items-center gap-1.5 rounded-full border border-brand/35 bg-brand/12 px-2.5 py-1 text-xs font-semibold text-brand">
            <Icons.globe className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{clientName}</span>
          </span>
        </div>

        <p className={cn("flex items-center gap-1.5 text-xs", elevatedCardMutedClass)}>
          <Icons.calendar className="size-3.5 shrink-0" aria-hidden />
          {t("createdOn")}:{" "}
          {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(report.createdAt))}
        </p>

        {report.summary ? (
          <div className="rounded-2xl border border-border bg-bg-hover/60 p-3.5">
            <p className={cn("line-clamp-3 text-sm leading-relaxed", elevatedCardBodyClass)}>{report.summary}</p>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
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
              iconOnly
              onClick={() => onDelete(report)}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
