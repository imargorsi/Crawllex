"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";
import { LeadEditorModal, type TLeadEditorTarget } from "@/components/leads/lead-editor-modal";
import { LeadsImportExportMenu } from "@/components/leads/leads-import-export-menu";
import { LeadsImportModal } from "@/components/leads/leads-import-modal";
import { LeadsSummaryCards } from "@/components/leads/leads-summary-cards";
import { LeadsTable } from "@/components/leads/leads-table";
import { SeoActivityDateRangeFilter } from "@/components/seo-activities/seo-activity-date-range-filter";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateActionButton } from "@/components/ui/create-action-button";
import { useSelectedProject } from "@/context/selected-project-context";
import { useProjectAccess } from "@/context/project-access-context";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import {
  fetchLeadsForExport,
  leadsKeys,
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useLeadsQuery,
  useUpdateLeadMutation,
} from "@/features/leads/leads.api";
import { useQueryClient } from "@tanstack/react-query";
import { useDetailSheetState } from "@/hooks/use-detail-sheet-state.hook";
import { useQueryParams } from "@/hooks/use-query-params.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import { downloadLeadsExcel } from "@/lib/frontend/leads/export.utils";
import type { TLeadEditorValues } from "@/lib/frontend/leads/editor.utils";
import { parseLeadsListQuery } from "@/lib/frontend/leads/list-query.utils";
import { type TDateRange } from "@/lib/frontend/seo-activities/date-range.utils";
import { notify } from "@/lib/frontend/feedback/notify";
import { LEAD_DEFAULT_PER_PAGE } from "@/lib/leads/constants";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";
import { cn } from "@/lib/utils";
import type { TLeadDto, TLeadSummaryCounts, TLeadsImportResult } from "@/types/lead.types";

const EMPTY_COUNTS: TLeadSummaryCounts = {
  total: 0,
  this_month: 0,
  last_month: 0,
  this_year: 0,
};

export function LeadsSection() {
  const { t } = useTranslation("translation", { keyPrefix: "modules.leads" });
  const queryClient = useQueryClient();
  const { queryParams, updateQueryParams, deleteQueryParams } = useQueryParams();
  const listQuery = parseLeadsListQuery(queryParams);
  const { selectedProject } = useSelectedProject();
  const projectId = selectedProject?.id ?? null;
  const projectStatus = selectedProject?.status ?? null;
  const { data: authUser } = useAuthUserQuery();
  const { projectPermissions } = useProjectAccess();

  const permissions = useMemo(
    () => mergePermissions(authUser?.permissions ?? [], projectPermissions),
    [authUser?.permissions, projectPermissions],
  );
  const canCreate = hasPermission(permissions, "leads.create");
  const canUpdate = hasPermission(permissions, "leads.update");
  const canDelete = hasPermission(permissions, "leads.delete");
  const canImport = hasPermission(permissions, "leads.import") && projectStatus === "active";
  const canExport = hasPermission(permissions, "leads.export");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTarget, setEditorTarget] = useState<TLeadEditorTarget>({ mode: "create" });
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TLeadDto | null>(null);
  const {
    selected: selectedLead,
    isOpen: isDetailOpen,
    open: openDetail,
    onOpenChange: onDetailOpenChange,
    clear: clearDetail,
  } = useDetailSheetState<TLeadDto>();
  const loadErrorNotified = useRef(false);

  const listParams = {
    page: listQuery.page,
    per_page: listQuery.perPage || LEAD_DEFAULT_PER_PAGE,
    from: listQuery.dateRange.from,
    to: listQuery.dateRange.to,
    q: listQuery.q,
  };

  const { data, error, isLoading, isFetching } = useLeadsQuery(projectId, listParams, {
    enabled: Boolean(projectId),
  });
  const createMutation = useCreateLeadMutation(projectId);
  const updateMutation = useUpdateLeadMutation(projectId);
  const deleteMutation = useDeleteLeadMutation(projectId);

  useEffect(() => {
    if (!error || loadErrorNotified.current) return;
    loadErrorNotified.current = true;
    notify.error(error instanceof Error ? error.message : t("table.loadErrorBody"));
  }, [error, t]);

  const counts = data?.filters.counts ?? EMPTY_COUNTS;
  const rows = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const page = data?.pagination.current_page ?? listQuery.page;
  const perPage = data?.pagination.per_page ?? listParams.per_page;

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
    if (projectStatus !== "active") {
      notify.error(t("editor.inactiveProject"));
      return;
    }
    setEditorTarget({ mode: "create" });
    setEditorOpen(true);
  }

  function openEdit(row: TLeadDto) {
    setEditorTarget({ mode: "edit", lead: row });
    setEditorOpen(true);
  }

  async function onSave(input: {
    mode: "create" | "edit";
    values: TLeadEditorValues;
    leadId?: string;
  }) {
    const payload = {
      firstName: input.values.firstName.trim(),
      lastName: input.values.lastName.trim(),
      email: input.values.email.trim(),
      phone: input.values.phone.trim(),
      servicesInterestedIn: input.values.servicesInterestedIn.trim(),
      message: input.values.message.trim(),
      leadDate: input.values.leadDate.trim(),
    };

    try {
      if (input.mode === "edit" && input.leadId) {
        await updateMutation.mutateAsync({ leadId: input.leadId, payload });
        notify.success(t("editor.updateSuccess"));
        return;
      }

      await createMutation.mutateAsync(payload);
      deleteQueryParams(["page"]);
      notify.success(t("editor.createSuccess"));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : input.mode === "edit"
            ? t("editor.updateErrorFallback")
            : t("editor.createErrorFallback");
      notify.error(message);
      throw err;
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      if (selectedLead?.id === deleteTarget.id) clearDetail();
      setDeleteTarget(null);
      notify.success(t("table.deleteSuccess"));
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : t("table.deleteErrorFallback"));
    }
  }

  async function onExportExcel() {
    if (!projectId || !canExport) return;
    if (total === 0) {
      notify.info(t("importExport.exportEmpty"));
      return;
    }

    try {
      const items = await fetchLeadsForExport(projectId, {
        from: listQuery.dateRange.from,
        to: listQuery.dateRange.to,
        q: listQuery.q,
      });

      if (items.length === 0) {
        notify.info(t("importExport.exportEmpty"));
        return;
      }

      downloadLeadsExcel({
        rows: items,
        range: listQuery.dateRange,
        labels: {
          leadDate: t("table.colDate"),
          firstName: t("table.colFirstName"),
          lastName: t("table.colLastName"),
          email: t("table.colEmail"),
          phone: t("table.colPhone"),
          servicesInterestedIn: t("table.colServices"),
          message: t("table.colMessage"),
          source: t("table.colSource"),
          sourceWordpress: t("source.wordpress"),
          sourceOthers: t("source.others"),
        },
      });
      notify.success(t("importExport.exportSuccess"));
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : t("importExport.exportErrorFallback"));
    }
  }

  function onImported(result: TLeadsImportResult) {
    if (projectId) {
      void queryClient.invalidateQueries({ queryKey: [...leadsKeys.all, "list", projectId] });
    }
    const skipped = result.skippedDuplicates + result.skippedInvalid;
    if (result.imported === 0) {
      notify.info(
        t("importModal.importNone", {
          skippedDuplicates: result.skippedDuplicates,
          skippedInvalid: result.skippedInvalid,
        }),
      );
      return;
    }
    if (skipped > 0) {
      notify.success(
        t("importModal.importSuccessWithSkips", {
          imported: result.imported,
          skippedDuplicates: result.skippedDuplicates,
          skippedInvalid: result.skippedInvalid,
        }),
      );
      return;
    }
    notify.success(
      t("importModal.importSuccess", {
        imported: result.imported,
      }),
    );
  }

  function openImport() {
    if (!canImport) {
      notify.error(t("importModal.inactiveProject"));
      return;
    }
    setImportOpen(true);
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
            <Heading id="leads-title" pageTitle>
              {t("title")}
            </Heading>
            <Paragraph className="text-text-secondary">{t("subtitle")}</Paragraph>
          </div>

          {canCreate ? (
            <CreateActionButton onClick={openCreate} className="shrink-0">
              {t("editor.trigger")}
            </CreateActionButton>
          ) : null}
        </div>

        <LeadsSummaryCards counts={counts} isLoading={isLoading && !data} />

        <div className="space-y-3">
          <div className="relative z-20 flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
            <SeoActivityDateRangeFilter
              value={listQuery.dateRange}
              onChange={onDateRangeChange}
            />
            <LeadsImportExportMenu
              canImport={canImport}
              canExport={canExport}
              onImport={openImport}
              onExport={() => void onExportExcel()}
            />
          </div>

          <LeadsTable
            rows={rows}
            page={page}
            perPage={perPage}
            total={total}
            onPageChange={onPageChange}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onView={openDetail}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            isLoading={isLoading || isFetching}
          />
        </div>
      </div>

      <LeadDetailSheet
        lead={selectedLead}
        open={isDetailOpen}
        onOpenChange={onDetailOpenChange}
      />

      <LeadEditorModal
        open={editorOpen}
        target={editorTarget}
        onOpenChange={setEditorOpen}
        onSave={onSave}
      />

      {projectId ? (
        <LeadsImportModal
          open={importOpen}
          projectId={projectId}
          onOpenChange={setImportOpen}
          onImported={onImported}
        />
      ) : null}

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
