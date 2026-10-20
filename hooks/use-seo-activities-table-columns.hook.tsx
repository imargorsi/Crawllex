"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { TAppTableColumn } from "@/components/table/app-table";
import { TableRowIconActions } from "@/components/table/table-row-icon-actions";
import { Badge } from "@/components/ui/badge";
import {
  SeoActivityDetailsCell,
  SeoActivityLinkCell,
  SeoActivityStackedDateCell,
} from "@/components/seo-activities/seo-activity-cells";
import type {
  TSeoActivityBacklink,
  TSeoActivityBlog,
  TSeoActivityType,
  TSeoActivityTechnicalWork,
} from "@/types/seo-activity.types";

type TSeoActivityRow = TSeoActivityBlog | TSeoActivityBacklink | TSeoActivityTechnicalWork;

type TUseSeoActivitiesTableColumnsOptions = {
  type: TSeoActivityType;
  canUpdate?: boolean;
  canDelete?: boolean;
  onEdit?: (row: TSeoActivityRow) => void;
  onDelete?: (row: TSeoActivityRow) => void;
};

function buildActionsColumn<T extends TSeoActivityRow>({
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  t,
}: {
  canUpdate?: boolean;
  canDelete?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  t: (key: "colActions" | "editActivity" | "deleteActivity") => string;
}): TAppTableColumn<T> | null {
  if (!canUpdate && !canDelete) return null;

  return {
    key: "actions",
    label: t("colActions"),
    align: "end",
    render: (item) => (
      <TableRowIconActions
        actions={[
          ...(canUpdate && onEdit
            ? [
                {
                  key: "edit",
                  icon: <Icons.pencil className="size-4" aria-hidden />,
                  label: t("editActivity"),
                  onClick: () => onEdit(item),
                },
              ]
            : []),
          ...(canDelete && onDelete
            ? [
                {
                  key: "delete",
                  icon: <Icons.delete className="size-4" aria-hidden />,
                  label: t("deleteActivity"),
                  onClick: () => onDelete(item),
                  className:
                    "text-destructive hover:bg-destructive/10 hover:text-destructive",
                },
              ]
            : []),
        ]}
      />
    ),
  };
}

export function useSeoActivitiesTableColumns({
  type,
  canUpdate = false,
  canDelete = false,
  onEdit,
  onDelete,
}: TUseSeoActivitiesTableColumnsOptions) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.seoActivities.table" });

  return useMemo(() => {
    const actionsColumn = buildActionsColumn({
      canUpdate,
      canDelete,
      onEdit,
      onDelete,
      t,
    });

    if (type === "blogs") {
      const columns: TAppTableColumn<TSeoActivityBlog>[] = [
        {
          key: "occurredOn",
          label: t("colDate"),
          render: (item) => <SeoActivityStackedDateCell isoDate={item.occurredOn} />,
        },
        {
          key: "title",
          label: t("colBlogDetails"),
          render: (item) => (
            <div className="flex min-w-0 flex-col items-start gap-1.5">
              <SeoActivityDetailsCell title={item.title} />
              {item.pushedToWordpress ? (
                <Badge variant="success">{t("pushedBadge")}</Badge>
              ) : null}
            </div>
          ),
        },
        {
          key: "url",
          label: t("colBlogLink"),
          render: (item) => <SeoActivityLinkCell href={item.url} />,
        },
      ];
      if (actionsColumn) columns.push(actionsColumn as TAppTableColumn<TSeoActivityBlog>);
      return columns;
    }

    if (type === "backlinks") {
      const columns: TAppTableColumn<TSeoActivityBacklink>[] = [
        {
          key: "occurredOn",
          label: t("colDate"),
          render: (item) => <SeoActivityStackedDateCell isoDate={item.occurredOn} />,
        },
        {
          key: "anchorText",
          label: t("colBacklinkDetails"),
          render: (item) => <SeoActivityDetailsCell title={item.anchorText} />,
        },
        {
          key: "url",
          label: t("colUrls"),
          render: (item) => <SeoActivityLinkCell href={item.url} />,
        },
      ];
      if (actionsColumn) columns.push(actionsColumn as TAppTableColumn<TSeoActivityBacklink>);
      return columns;
    }

    const columns: TAppTableColumn<TSeoActivityTechnicalWork>[] = [
      {
        key: "occurredOn",
        label: t("colDate"),
        render: (item) => <SeoActivityStackedDateCell isoDate={item.occurredOn} />,
      },
      {
        key: "details",
        label: t("colChangeDetails"),
        render: (item) => <SeoActivityDetailsCell title={item.details} />,
      },
      {
        key: "url",
        label: t("colPageLink"),
        render: (item) => <SeoActivityLinkCell href={item.url} />,
      },
    ];
    if (actionsColumn) columns.push(actionsColumn as TAppTableColumn<TSeoActivityTechnicalWork>);
    return columns;
  }, [canDelete, canUpdate, onDelete, onEdit, t, type]);
}
