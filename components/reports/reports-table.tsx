"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { AppTable, type TAppTableColumn } from "@/components/table/app-table";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { formatMonthTitle, formatPeriodLabel } from "@/lib/reports/period";
import type { TReportListItemDto } from "@/types/reports.types";

type TReportsTableProps = {
  reports: TReportListItemDto[];
  clientName: string;
  isLoading: boolean;
  canDelete: boolean;
  downloadingId: string | null;
  onDownload: (report: TReportListItemDto) => void;
  onDelete: (report: TReportListItemDto) => void;
};

/** Table view of saved reports. Same AppTable and row behaviour as the projects table. */
export function ReportsTable({
  reports,
  clientName,
  isLoading,
  canDelete,
  downloadingId,
  onDownload,
  onDelete,
}: TReportsTableProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.reports" });

  const columns: TAppTableColumn<TReportListItemDto>[] = [
    {
      key: "title",
      label: t("colTitle"),
      render: (report) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-text-primary">{formatMonthTitle(report.periodFrom)}</p>
          <span className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand/35 bg-brand/12 px-2 py-0.5 text-xs font-semibold text-brand">
            <Icons.globe className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{clientName}</span>
          </span>
        </div>
      ),
    },
    {
      key: "period",
      label: t("colPeriod"),
      render: (report) => (
        <span className="text-sm text-text-muted">{formatPeriodLabel(report.periodFrom, report.periodTo)}</span>
      ),
    },
    {
      key: "summary",
      label: t("colSummary"),
      cellClassName: "max-w-md",
      render: (report) => (
        <p className="line-clamp-2 text-sm text-text-muted">{report.summary ?? "–"}</p>
      ),
    },
    {
      key: "created",
      label: t("colCreated"),
      render: (report) => (
        <span className="text-sm text-text-muted">
          {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(report.createdAt))}
        </span>
      ),
    },
    {
      key: "actions",
      label: <span className="sr-only">{t("open")}</span>,
      align: "end",
      render: (report) => (
        <div className="flex items-center justify-end gap-1" data-row-click-ignore>
          <Link
            href={`/reports/${report.id}`}
            aria-label={t("open")}
            title={t("open")}
            className="inline-flex size-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <Icons.view className="size-4" aria-hidden />
          </Link>
          <button
            type="button"
            aria-label={t("downloadPdf")}
            title={t("downloadPdf")}
            disabled={downloadingId === report.id}
            onClick={() => onDownload(report)}
            className="inline-flex size-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary disabled:opacity-60"
          >
            <Icons.cloudDownload className="size-4" aria-hidden />
          </button>
          {canDelete ? (
            <button
              type="button"
              aria-label={t("deleteAction")}
              title={t("deleteAction")}
              onClick={() => onDelete(report)}
              className="inline-flex size-8 items-center justify-center rounded-full text-status-rejected transition-colors hover:bg-status-rejected/12"
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
