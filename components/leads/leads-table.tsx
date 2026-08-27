"use client";

import { useTranslation } from "react-i18next";

import { AppTable } from "@/components/table/app-table";
import { useLeadsTableColumns } from "@/hooks/use-leads-table-columns.hook";
import type { TLeadDto } from "@/types/lead.types";

type TLeadsTableProps = {
  rows: TLeadDto[];
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  onView?: (row: TLeadDto) => void;
  onEdit?: (row: TLeadDto) => void;
  onDelete?: (row: TLeadDto) => void;
  isLoading?: boolean;
  className?: string;
};

export function LeadsTable({
  rows,
  page,
  perPage,
  total,
  onPageChange,
  canUpdate = false,
  canDelete = false,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
  className,
}: TLeadsTableProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.leads" });
  const columns = useLeadsTableColumns({
    canUpdate,
    canDelete,
    onView,
    onEdit,
    onDelete,
  });
  const shown = Math.min(rows.length, perPage);

  return (
    <AppTable<TLeadDto>
      className={className}
      columns={columns}
      data={rows}
      getRowId={(item) => item.id}
      emptyTitle={t("table.emptyTitle")}
      emptyBody={t("table.emptyBody")}
      isLoading={isLoading}
      pagination={{
        page,
        perPage,
        total,
        onPageChange,
        summaryLabel: t("table.summary", { shown, total }),
        previousPageLabel: t("table.previousPage"),
        nextPageLabel: t("table.nextPage"),
        pageNumberLabel: (pageNumber: number) => t("table.pageNumber", { page: pageNumber }),
      }}
    />
  );
}
