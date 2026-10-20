"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { SeoActivitiesTable } from "@/components/seo-activities/seo-activities-table";
import { SeoActivityDateRangeFilter } from "@/components/seo-activities/seo-activity-date-range-filter";
import {
  SeoActivityQuickAdd,
  type TSeoActivityEditorTarget,
} from "@/components/seo-activities/seo-activity-quick-add";
import { SeoActivitySummaryCards } from "@/components/seo-activities/seo-activity-summary-cards";
import { SeoActivityTypeFilter } from "@/components/seo-activities/seo-activity-type-filter";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateActionButton } from "@/components/ui/create-action-button";
import { useSelectedProject } from "@/context/selected-project-context";
import { useProjectAccess } from "@/context/project-access-context";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import {
  fetchSeoActivitiesForExport,
  useCreateSeoActivityMutation,
  useDeleteSeoActivityMutation,
  useSeoActivitiesQuery,
  useUpdateSeoActivityMutation,
  type TSeoActivityUpdatePayload,
} from "@/features/seo-activities/seo-activities.api";
import { useQueryParams } from "@/hooks/use-query-params.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import { type TDateRange } from "@/lib/frontend/seo-activities/date-range.utils";
import { downloadSeoActivitiesExcel } from "@/lib/frontend/seo-activities/export.utils";
import { parseSeoActivitiesListQuery } from "@/lib/frontend/seo-activities/list-query.utils";
import { notify } from "@/lib/frontend/feedback/notify";
import type { TSeoActivityQuickAddValues } from "@/lib/frontend/seo-activities/quick-add.utils";
import { buildSeoActivityRangeStatsFromCounts } from "@/lib/frontend/seo-activities/summary.utils";
import { SEO_ACTIVITY_DEFAULT_PER_PAGE } from "@/lib/seo-activities/constants";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";
import { cn } from "@/lib/utils";
import {
  toSeoActivityTableRow,
  type TSeoActivityBacklink,
  type TSeoActivityBlog,
  type TSeoActivityType,
  type TSeoActivityTypeCounts,
  type TSeoActivityTechnicalWork,
} from "@/types/seo-activity.types";

type TSeoActivityRow = TSeoActivityBlog | TSeoActivityBacklink | TSeoActivityTechnicalWork;

const EMPTY_COUNTS: TSeoActivityTypeCounts = {
  blogs: 0,
  backlinks: 0,
  technical_work: 0,
};

export function SeoActivitiesSection() {
  const { t } = useTranslation("translation", { keyPrefix: "modules.seoActivities" });
  const { queryParams, updateQueryParams, deleteQueryParams } = useQueryParams();
  const listQuery = parseSeoActivitiesListQuery(queryParams);
  const { selectedProject } = useSelectedProject();
  const projectId = selectedProject?.id ?? null;
  const { data: authUser } = useAuthUserQuery();
  const { projectPermissions } = useProjectAccess();

  const permissions = useMemo(
    () => mergePermissions(authUser?.permissions ?? [], projectPermissions),
    [authUser?.permissions, projectPermissions],
  );
  const canCreate = hasPermission(permissions, "seo_activities.create");
  const canUpdate = hasPermission(permissions, "seo_activities.update");
  const canDelete = hasPermission(permissions, "seo_activities.delete");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTarget, setEditorTarget] = useState<TSeoActivityEditorTarget>({
    mode: "create",
    type: listQuery.type,
  });
  const [deleteTarget, setDeleteTarget] = useState<TSeoActivityRow | null>(null);
  const loadErrorNotified = useRef(false);

  const listParams = {
    type: listQuery.type,
    page: listQuery.page,
    per_page: listQuery.perPage || SEO_ACTIVITY_DEFAULT_PER_PAGE,
    from: listQuery.dateRange.from,
    to: listQuery.dateRange.to,
  };

  const { data, error, isLoading, isFetching } = useSeoActivitiesQuery(projectId, listParams, {
    enabled: Boolean(projectId),
  });
  const createMutation = useCreateSeoActivityMutation(projectId);
  const updateMutation = useUpdateSeoActivityMutation(projectId);
  const deleteMutation = useDeleteSeoActivityMutation(projectId);

  useEffect(() => {
    if (!error || loadErrorNotified.current) return;
    loadErrorNotified.current = true;
    notify.error(error instanceof Error ? error.message : t("table.loadErrorBody"));
  }, [error, t]);

  const counts = data?.filters.type_counts ?? EMPTY_COUNTS;
  const { metrics } = buildSeoActivityRangeStatsFromCounts(counts);
  const rows = (data?.items ?? []).map(toSeoActivityTableRow);
  const total = data?.pagination.total ?? 0;
  const page = data?.pagination.current_page ?? listQuery.page;
  const perPage = data?.pagination.per_page ?? listParams.per_page;

  function onTypeChange(type: TSeoActivityType) {
    if (type === "blogs") {
      deleteQueryParams(["type", "page"]);
      return;
    }
    updateQueryParams({ type }, ["page"]);
  }

  function onPageChange(nextPage: number) {
    if (nextPage <= 1) {
      deleteQueryParams(["page"]);
      return;
    }
    updateQueryParams({ page: nextPage });
  }

  function onDateRangeChange(range: TDateRange) {
    if (!range.from && !range.to) {
      updateQueryParams({ range: "all" }, ["from", "to", "page"]);
      return;
    }

    const next: Record<string, string> = {};
    if (range.from) next.from = range.from;
    if (range.to) next.to = range.to;
    updateQueryParams(next, ["page", "range"]);
  }

  function openCreate() {
    setEditorTarget({ mode: "create", type: listQuery.type });
    setEditorOpen(true);
  }

  function openEdit(row: TSeoActivityRow) {
    setEditorTarget({ mode: "edit", type: listQuery.type, row });
    setEditorOpen(true);
  }

  function buildPayload(type: TSeoActivityType, values: TSeoActivityQuickAddValues) {
    const base = {
      url: values.url.trim(),
      occurredOn: values.occurredOn.trim(),
    };

    if (type === "blogs") {
      if (values.pushToWordpress) {
        // The post's URL comes back from WordPress, so no url is sent.
        return {
          url: undefined,
          occurredOn: base.occurredOn,
          type,
          title: values.title.trim(),
          pushToWordpress: true,
          docUrl: values.docUrl.trim(),
        };
      }
      return { ...base, type, title: values.title.trim() };
    }
    if (type === "backlinks") {
      return { ...base, type, anchorText: values.anchorText.trim() };
    }
    return { ...base, type, details: values.details.trim() };
  }

  /** Edit never re-pushes to WordPress, so an update always carries a url and no push fields. */
  function buildUpdatePayload(
    type: TSeoActivityType,
    values: TSeoActivityQuickAddValues,
  ): TSeoActivityUpdatePayload {
    const base = {
      url: values.url.trim(),
      occurredOn: values.occurredOn.trim(),
    };

    if (type === "blogs") return { ...base, title: values.title.trim() };
    if (type === "backlinks") return { ...base, anchorText: values.anchorText.trim() };
    return { ...base, details: values.details.trim() };
  }

  async function onSave(input: {
    mode: "create" | "edit";
    type: TSeoActivityType;
    values: TSeoActivityQuickAddValues;
    activityId?: string;
  }) {
    try {
      if (input.mode === "edit" && input.activityId) {
        await updateMutation.mutateAsync({
          activityId: input.activityId,
          payload: buildUpdatePayload(input.type, input.values),
        });
        notify.success(t(`quickAdd.updateSuccess.${input.type}`));
        return;
      }

      await createMutation.mutateAsync(buildPayload(input.type, input.values));
      if (input.type !== listQuery.type) onTypeChange(input.type);
      else deleteQueryParams(["page"]);
      notify.success(
        input.type === "blogs" && input.values.pushToWordpress
          ? t("quickAdd.pushSuccess")
          : t(`quickAdd.success.${input.type}`),
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : input.mode === "edit"
            ? t("quickAdd.updateErrorFallback")
            : t("quickAdd.createErrorFallback");
      notify.error(message);
      throw err;
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      notify.success(t("table.deleteSuccess"));
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : t("table.deleteErrorFallback"));
    }
  }

  async function onExportExcel() {
    if (!projectId) return;
    if (total === 0) {
      notify.info(t("export.empty"));
      return;
    }

    try {
      const items = await fetchSeoActivitiesForExport(projectId, {
        type: listQuery.type,
        from: listQuery.dateRange.from,
        to: listQuery.dateRange.to,
      });

      if (items.length === 0) {
        notify.info(t("export.empty"));
        return;
      }

      downloadSeoActivitiesExcel({
        type: listQuery.type,
        rows: items.map(toSeoActivityTableRow),
        range: listQuery.dateRange,
        labels: {
          date: t("table.colDate"),
          title: t("table.colBlogDetails"),
          url:
            listQuery.type === "blogs"
              ? t("table.colBlogLink")
              : listQuery.type === "backlinks"
                ? t("table.colUrls")
                : t("table.colPageLink"),
          anchorText: t("table.colBacklinkDetails"),
          details: t("table.colChangeDetails"),
        },
      });
      notify.success(t("export.success"));
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : t("export.errorFallback"));
    }
  }

  if (!projectId) {
    return (
      <div className="w-full min-w-0 px-4 py-6 sm:px-6">
        <EmptyState title={t("selectProjectTitle")} description={t("selectProjectBody")} />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="type-stack-md">
            <Heading id="seo-activities-title" pageTitle>
              {t("title")}
            </Heading>
            <Paragraph className="text-text-secondary">{t("subtitle")}</Paragraph>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <SeoActivityTypeFilter
              activeType={listQuery.type}
              counts={counts}
              onTypeChange={onTypeChange}
            />

            {canCreate ? (
              <CreateActionButton onClick={openCreate} className="shrink-0">
                {t("quickAdd.trigger")}
              </CreateActionButton>
            ) : null}
          </div>
        </div>

        <SeoActivitySummaryCards metrics={metrics} isLoading={isLoading && !data} />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SeoActivityDateRangeFilter value={listQuery.dateRange} onChange={onDateRangeChange} />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => void onExportExcel()}
              className="shrink-0"
            >
              <Icons.cloudDownload className="size-4" aria-hidden />
              {t("export.excel")}
            </Button>
          </div>

          <SeoActivitiesTable
            type={listQuery.type}
            rows={rows as TSeoActivityBlog[] | TSeoActivityBacklink[] | TSeoActivityTechnicalWork[]}
            page={page}
            perPage={perPage}
            total={total}
            onPageChange={onPageChange}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            isLoading={isLoading || isFetching}
          />
        </div>
      </div>

      <SeoActivityQuickAdd
        open={editorOpen}
        target={editorTarget}
        onOpenChange={setEditorOpen}
        onSave={onSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        icon={Icons.delete}
        title={t("table.deleteTitle")}
        description={t("table.deleteBody")}
        action={
          <>
            <AlertDialogCancel>{t("table.deleteCancel")}</AlertDialogCancel>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "destructive", size: "md" }))}
              onClick={() => void confirmDelete()}
              disabled={deleteMutation.isPending}
            >
              {t("table.deleteConfirm")}
            </button>
          </>
        }
      />
    </div>
  );
}
