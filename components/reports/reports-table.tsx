"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { AppTable, type TAppTableColumn } from "@/components/table/app-table";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { formatInt } from "@/lib/reports/format";
import { formatCompactPeriodLabel, formatMonthTitle } from "@/lib/reports/period";
import { ReportStatChip } from "@/components/reports/report-stat-chip";
import type { TReportListItemDto } from "@/types/reports.types";

type TReportsTableProps = {
  reports: TReportListItemDto[];
  isLoading: boolean;
  canDelete: boolean;
  downloadingId: string | null;
  onDownload: (report: TReportListItemDto) => void;
  onDelete: (report: TReportListItemDto) => void;
};

const ICON_BUTTON =
  "inline-flex size-9 items-center justify-center rounded-full border border-border bg-transparent text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-60";

/** Table view of saved reports. Same AppTable and row behaviour as the projects table. */
export function ReportsTable({
  reports,
  isLoading,
  canDelete,
  downloadingId,
  onDownload,
  onDelete,
}: TReportsTableProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.reports" });

  const columns: TAppTableColumn<TReportListItemDto>[] = [
    {
      key: "report",
      label: t("colTitle"),
      render: (report) => (
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-text-primary">{formatMonthTitle(report.periodFrom)}</p>
            <p className="text-xs text-text-muted">{formatCompactPeriodLabel(report.periodFrom, report.periodTo)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "performance",
      label: t("colPerformance"),
      render: (report) =>
        report.kpis ? (
          <div className="flex flex-wrap gap-1.5">
            <ReportStatChip value={formatInt(report.kpis.clicks)} label={t("kpiClicks")} tone="brand" />
            <ReportStatChip value={formatInt(report.kpis.sessions)} label={t("kpiSessions")} tone="cyan" />
            <ReportStatChip value={formatInt(report.kpis.leads)} label={t("kpiLeads")} tone="emerald" />
            <ReportStatChip value={formatInt(report.kpis.calls)} label={t("kpiCalls")} tone="amber" />
          </div>
        ) : (
          <span className="text-sm text-text-muted">–</span>
        ),
    },
    {
      key: "summary",
      label: t("colSummary"),
      cellClassName: "max-w-sm",
      render: (report) => (
        <p className="line-clamp-2 text-sm leading-relaxed text-text-muted">{report.summary ?? "–"}</p>
      ),
    },
    {
      key: "created",
      label: t("colCreated"),
      render: (report) => (
        <span className="whitespace-nowrap text-sm text-text-muted">
          {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(report.createdAt))}
        </span>
      ),
    },
    {
      key: "actions",
      label: <span className="sr-only">{t("open")}</span>,
      align: "end",
      render: (report) => (
        <div className="flex items-center justify-end gap-1.5" data-row-click-ignore>
          <Link href={`/reports/${report.id}`} aria-label={t("open")} title={t("open")} className={ICON_BUTTON}>
            <Icons.view className="size-4" aria-hidden />
          </Link>
          <button
            type="button"
            aria-label={t("downloadPdf")}
            title={t("downloadPdf")}
            disabled={downloadingId === report.id}
            onClick={() => onDownload(report)}
            className={ICON_BUTTON}
          >
            <Icons.download className="size-4" aria-hidden />
          </button>
          {canDelete ? (
            <button
              type="button"
              aria-label={t("deleteAction")}
              title={t("deleteAction")}
              onClick={() => onDelete(report)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-status-rejected/40 bg-transparent text-status-rejected transition-colors hover:bg-status-rejected/12"
            >
              <Icons.delete className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <AppTable
      columns={columns}
      data={reports}
      getRowId={(report) => report.id}
      isLoading={isLoading}
      emptyTitle={t("emptyTitle")}
      emptyBody={t("emptyBody")}
      onRowClick={(report) => {
        window.location.href = `/reports/${report.id}`;
      }}
      getRowClickLabel={(report) => `${t("open")} ${formatMonthTitle(report.periodFrom)}`}
    />
  );
}
