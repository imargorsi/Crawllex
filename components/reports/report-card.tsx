"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { ReportCoverGraphic } from "@/components/reports/report-cover-graphic";
import { Spinner } from "@/components/ui/spinner";
import type { TAppIconComponent } from "@/components/ui/app-icon";
import {
  elevatedCardBodyClass,
  elevatedCardMutedClass,
  elevatedCardSurfaceClass,
  elevatedCardTitleClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { formatInt } from "@/lib/reports/format";
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

type TReportKpiTone = "brand" | "cyan" | "emerald" | "amber";

const KPI_TONE: Record<TReportKpiTone, { tile: string; dot: string; value: string }> = {
  brand: {
    tile: "border-brand/45 bg-brand/12",
    dot: "bg-brand",
    value: "text-brand",
  },
  cyan: {
    tile: "border-[var(--status-invited)]/45 bg-[var(--status-invited)]/12",
    dot: "bg-[var(--status-invited)]",
    value: "text-[var(--status-invited)]",
  },
  emerald: {
    tile: "border-[var(--status-active)]/45 bg-[var(--status-active)]/12",
    dot: "bg-[var(--status-active)]",
    value: "text-[var(--status-active)]",
  },
  amber: {
    tile: "border-[var(--status-pending)]/45 bg-[var(--status-pending)]/12",
    dot: "bg-[var(--status-pending)]",
    value: "text-[var(--status-pending)]",
  },
};

function KpiTile({ label, value, tone }: { label: string; value: string; tone: TReportKpiTone }) {
  const style = KPI_TONE[tone];
  return (
    <div className={cn("rounded-2xl border-[1.5px] px-3.5 py-3", style.tile)}>
      <p className={cn("flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider", elevatedCardTitleClass)}>
        <span className={cn("size-2 rounded-full", style.dot)} aria-hidden />
        {label}
      </p>
      <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", style.value)}>{value}</p>
    </div>
  );
}

type TReportActionTone = "brand" | "default" | "destructive";

/** Same pill treatment as the projects card "big" actions (ACTION_BUTTON_TONE). */
const ACTION_PILL: Record<TReportActionTone, string> = {
  brand: "border-brand/40 bg-brand/12 text-brand hover:bg-brand/20 hover:border-brand/55",
  default: "border-brand/35 bg-brand/12 text-brand hover:bg-brand/20 hover:border-brand/50",
  destructive:
    "border-status-rejected/40 bg-status-rejected/12 text-status-rejected hover:bg-status-rejected/20 hover:border-status-rejected/55",
};

const ACTION_BASE =
  "inline-flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60";

type TActionProps = {
  label: string;
  tone: TReportActionTone;
  icon: TAppIconComponent;
  isLoading?: boolean;
  iconOnly?: boolean;
};

function ActionContent({ label, icon: Icon, isLoading = false, iconOnly = false }: TActionProps) {
  return (
    <>
      {isLoading ? <Spinner className="size-4" /> : <Icon className="size-4 shrink-0" aria-hidden />}
      {iconOnly ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </>
  );
}

function ActionLink({ href, ...props }: TActionProps & { href: string }) {
  return (
    <Link
      href={href}
      title={props.label}
      className={cn(ACTION_BASE, ACTION_PILL[props.tone], props.iconOnly && "size-9 px-0")}
    >
      <ActionContent {...props} />
    </Link>
  );
}

function ActionButton({ onClick, disabled, ...props }: TActionProps & { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={props.label}
      aria-label={props.label}
      className={cn(ACTION_BASE, ACTION_PILL[props.tone], props.iconOnly && "size-9 px-0")}
    >
      <ActionContent {...props} />
    </button>
  );
}

/** One saved report: animated cover, title and project, KPIs, summary, created date and actions. */
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
  const kpis = report.kpis;

  return (
    <article
      className={cn(
        elevatedCardSurfaceClass,
        "relative flex flex-col overflow-hidden rounded-3xl",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-0.5"
        style={{ background: "linear-gradient(90deg, var(--brand), var(--status-invited))" }}
      />

      <div
        className="relative h-40 overflow-hidden border-b border-border"
        style={{ background: "linear-gradient(135deg, var(--accent-dark), var(--accent))" }}
      >
        <ReportCoverGraphic />
        {clientLogoUrl ? (
          <img
            src={clientLogoUrl}
            alt={clientName}
            className="absolute right-4 top-4 h-8 max-w-[6.5rem] rounded-lg bg-white/90 object-contain p-1"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className={cn("truncate text-lg font-semibold", elevatedCardTitleClass)}>{monthTitle}</h3>
            <p className={cn("mt-1 flex items-center gap-1.5 text-xs", elevatedCardMutedClass)}>
              <Icons.calendar className="size-3.5 shrink-0" aria-hidden />
              {t("createdOn")}:{" "}
              {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(report.createdAt))}
            </p>
          </div>
          <span className="inline-flex max-w-[45%] shrink-0 items-center gap-1.5 rounded-full border border-brand/35 bg-brand/12 px-2.5 py-1 text-xs font-semibold text-brand">
            <Icons.globe className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{clientName}</span>
          </span>
        </div>

        {kpis ? (
          <div className="grid grid-cols-2 gap-2.5">
            <KpiTile label={t("kpiClicks")} value={formatInt(kpis.clicks)} tone="brand" />
            <KpiTile label={t("kpiSessions")} value={formatInt(kpis.sessions)} tone="cyan" />
            <KpiTile label={t("kpiLeads")} value={formatInt(kpis.leads)} tone="emerald" />
            <KpiTile label={t("kpiCalls")} value={formatInt(kpis.calls)} tone="amber" />
          </div>
        ) : null}

        {report.summary ? (
          <div className="space-y-1.5">
            <h4 className={cn("text-xs font-semibold uppercase tracking-wide", elevatedCardMutedClass)}>
              {t("summary")}
            </h4>
            <p className={cn("line-clamp-3 text-sm leading-relaxed", elevatedCardBodyClass)}>{report.summary}</p>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <ActionLink href={`/reports/${report.id}`} label={t("open")} tone="brand" icon={Icons.view} />
          <ActionButton
            label={t("downloadPdf")}
            tone="default"
            icon={Icons.cloudDownload}
            disabled={isDownloading}
            isLoading={isDownloading}
            onClick={() => onDownload(report)}
          />
          {canDelete ? (
            <ActionButton
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
