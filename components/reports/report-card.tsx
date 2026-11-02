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
import { REPORT_PALETTE } from "@/lib/reports/constants";
import { formatInt } from "@/lib/reports/format";
import { formatCompactPeriodLabel, formatMonthTitle } from "@/lib/reports/period";
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

const KPI_TONE: Record<TReportKpiTone, { tile: string; icon: string; value: string }> = {
  brand: {
    tile: "border-brand/45 bg-brand/12",
    icon: "text-brand",
    value: "text-brand",
  },
  cyan: {
    tile: "border-[var(--status-invited)]/45 bg-[var(--status-invited)]/12",
    icon: "text-[var(--status-invited)]",
    value: "text-[var(--status-invited)]",
  },
  emerald: {
    tile: "border-[var(--status-active)]/45 bg-[var(--status-active)]/12",
    icon: "text-[var(--status-active)]",
    value: "text-[var(--status-active)]",
  },
  amber: {
    tile: "border-[var(--status-pending)]/45 bg-[var(--status-pending)]/12",
    icon: "text-[var(--status-pending)]",
    value: "text-[var(--status-pending)]",
  },
};

function KpiTile({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: TReportKpiTone;
  icon: TAppIconComponent;
}) {
  const style = KPI_TONE[tone];
  return (
    <div className={cn("rounded-2xl border-[1.5px] px-3.5 py-3", style.tile)}>
      <p className={cn("flex items-center gap-2 text-xs font-semibold", elevatedCardTitleClass)}>
        <Icon className={cn("size-4 shrink-0", style.icon)} aria-hidden />
        {label}
      </p>
      <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", style.value)}>{value}</p>
    </div>
  );
}

type TCoverActionProps = {
  label: string;
  icon: TAppIconComponent;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
};

/** Icon-only glass pill placed on the cover artwork. The label is kept for screen readers. */
function CoverActionButton({ label, icon: Icon, onClick, isLoading = false, disabled, destructive = false }: TCoverActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-white/60 disabled:opacity-60",
        destructive
          ? "border-white/25 bg-white/10 text-white hover:border-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/80"
          : "border-white/25 bg-white/10 text-white hover:bg-white/25",
      )}
    >
      {isLoading ? <Spinner className="size-4" /> : <Icon className="size-4" aria-hidden />}
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
  const periodLabel = formatCompactPeriodLabel(report.periodFrom, report.periodTo);
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
        style={{ background: `linear-gradient(135deg, ${REPORT_PALETTE.accentDark}, ${REPORT_PALETTE.accent})` }}
      >
        <Link
          href={`/reports/${report.id}`}
          aria-label={`${t("open")} ${monthTitle}`}
          className="absolute inset-0 z-0 rounded-t-3xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src="/report-assets/cover-neon.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full origin-center object-cover motion-safe:animate-[report-cover-pan_14s_ease-in-out_infinite]"
          />
          <span
            aria-hidden
            className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent motion-safe:animate-[report-cover-sweep_6s_ease-in-out_infinite]"
          />
          {clientLogoUrl ? (
            <img
              src={clientLogoUrl}
              alt={clientName}
              className="absolute right-4 top-4 h-8 max-w-[6.5rem] rounded-lg bg-white/90 object-contain p-1"
            />
          ) : null}
        </div>

        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
          <CoverActionButton
            label={t("downloadPdf")}
            icon={Icons.download}
            isLoading={isDownloading}
            disabled={isDownloading}
            onClick={() => onDownload(report)}
          />
          {canDelete ? (
            <CoverActionButton
              label={t("deleteAction")}
              icon={Icons.delete}
              destructive
              onClick={() => onDelete(report)}
            />
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className={cn("truncate text-lg font-semibold", elevatedCardTitleClass)}>{monthTitle}</h3>
            <p className={cn("mt-1 flex items-center gap-1.5 text-xs", elevatedCardMutedClass)}>
              {t("createdOn")}:{" "}
              {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(report.createdAt))}
            </p>
          </div>
          <span className="inline-flex max-w-[55%] shrink-0 items-center gap-1.5 rounded-full border border-brand/45 bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand backdrop-blur-sm">
            <Icons.calendar className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{periodLabel}</span>
          </span>
        </div>

        {report.summary ? (
          <div className="space-y-1.5">
            <h4 className={cn("text-sm font-semibold", elevatedCardTitleClass)}>
              {t("summary")}
            </h4>
            <p className={cn("line-clamp-3 text-sm leading-relaxed", elevatedCardBodyClass)}>{report.summary}</p>
          </div>
        ) : null}

        {kpis ? (
          <div className="grid grid-cols-2 gap-2.5">
            <KpiTile label={t("kpiClicks")} value={formatInt(kpis.clicks)} tone="brand" icon={Icons.cursorPointer} />
            <KpiTile label={t("kpiSessions")} value={formatInt(kpis.sessions)} tone="cyan" icon={Icons.view} />
            <KpiTile label={t("kpiLeads")} value={formatInt(kpis.leads)} tone="emerald" icon={Icons.userGroup} />
            <KpiTile label={t("kpiCalls")} value={formatInt(kpis.calls)} tone="amber" icon={Icons.call} />
          </div>
        ) : null}


      </div>
    </article>
  );
}
