"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { TAppTableColumn } from "@/components/table/app-table";
import { TableRowIconActions } from "@/components/table/table-row-icon-actions";
import { LeadSourceBadge } from "@/components/leads/lead-source-badge";
import { formatLeadDisplayName } from "@/lib/leads/serialize-lead";
import type { TLeadDto } from "@/types/lead.types";

type TUseLeadsTableColumnsOptions = {
  canUpdate?: boolean;
  canDelete?: boolean;
  onView?: (row: TLeadDto) => void;
  onEdit?: (row: TLeadDto) => void;
  onDelete?: (row: TLeadDto) => void;
};

function formatShortDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "—";
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function useLeadsTableColumns({
  canUpdate = false,
  canDelete = false,
  onView,
  onEdit,
  onDelete,
}: TUseLeadsTableColumnsOptions) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.leads.table" });

  return useMemo(() => {
    const columns: TAppTableColumn<TLeadDto>[] = [
      {
        key: "leadDate",
        label: t("colDate"),
        render: (item) => (
          <span className="type-body-strong text-text-primary">{formatShortDate(item.leadDate)}</span>
        ),
      },
      {
        key: "name",
        label: t("colName"),
        render: (item) => (
          <span className="type-body text-text-primary">
            {formatLeadDisplayName(item.firstName, item.lastName)}
          </span>
        ),
      },
      {
        key: "origin",
        label: t("colSource"),
        render: (item) => <LeadSourceBadge origin={item.origin} />,
      },
      {
        key: "email",
        label: t("colEmail"),
        render: (item) => <span className="type-body text-text-secondary">{item.email}</span>,
      },
      {
        key: "phone",
        label: t("colPhone"),
        render: (item) => <span className="type-body text-text-secondary">{item.phone}</span>,
      },
    ];

    columns.push({
      key: "message",
      label: t("colMessage"),
      render: (item) => (
        <span className="line-clamp-2 max-w-xs type-body text-text-muted">{item.message}</span>
      ),
    });

    columns.push({
      key: "actions",
      label: t("colActions"),
      align: "end",
      render: (item) => (
        <TableRowIconActions
          actions={[
            ...(onView
              ? [
                  {
                    key: "view",
                    icon: <Icons.view className="size-4" aria-hidden />,
                    label: t("viewLead"),
                    onClick: () => onView(item),
                  },
                ]
              : []),
            ...(canUpdate && onEdit
              ? [
                  {
                    key: "edit",
                    icon: <Icons.pencil className="size-4" aria-hidden />,
                    label: t("editLead"),
                    onClick: () => onEdit(item),
                  },
                ]
              : []),
            ...(canDelete && onDelete
              ? [
                  {
                    key: "delete",
                    icon: <Icons.delete className="size-4" aria-hidden />,
                    label: t("deleteLead"),
                    onClick: () => onDelete(item),
                    className:
                      "text-destructive hover:bg-destructive/10 hover:text-destructive",
                  },
                ]
              : []),
          ]}
        />
      ),
    });

    return columns;
  }, [canDelete, canUpdate, onDelete, onEdit, onView, t]);
}
