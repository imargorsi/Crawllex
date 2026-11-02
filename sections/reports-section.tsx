"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ReportCard } from "@/components/reports/report-card";
import { ReportCreateSheet } from "@/components/reports/report-create-sheet";
import { ReportsTable } from "@/components/reports/reports-table";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { ProjectListViewToggle } from "@/components/projects/project-list-view-toggle";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateActionButton } from "@/components/ui/create-action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { useProjectAccess } from "@/context/project-access-context";
import { useSelectedProject } from "@/context/selected-project-context";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import {
  fetchReportPdf,
  useDeleteReportMutation,
  useReportsQuery,
} from "@/features/reports/reports.api";
import { useQueryParams } from "@/hooks/use-query-params.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import { downloadBrowserBlob } from "@/lib/frontend/download-file";
import { notify } from "@/lib/frontend/feedback/notify";
import { Icons } from "@/lib/frontend/icons/app-icons";
import {
  DEFAULT_PROJECT_LIST_VIEW_MODE,
  parseProjectListViewMode,
  type TProjectListViewMode,
} from "@/lib/frontend/projects/projects-list-view.utils";
import { cn } from "@/lib/utils";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";
import type { TReportListItemDto } from "@/types/reports.types";

export function ReportsSection() {
  const { t } = useTranslation("translation", { keyPrefix: "modules.reports" });
  const router = useRouter();
  const { selectedProject } = useSelectedProject();
  const projectId = selectedProject?.id ?? null;
  const clientName = selectedProject?.businessName ?? "";
  const { data: authUser } = useAuthUserQuery();
  const { projectPermissions } = useProjectAccess();
  const permissions = useMemo(
    () => mergePermissions(authUser?.permissions ?? [], projectPermissions),
    [authUser?.permissions, projectPermissions],
  );

  const canView = hasPermission(permissions, "reports.view");
  const canCreate = hasPermission(permissions, "reports.create");
  const canDelete = hasPermission(permissions, "reports.delete");

  const { queryParams, setQueryParams, deleteQueryParams } = useQueryParams();
  const viewMode = parseProjectListViewMode(queryParams.view);

  const [createOpen, setCreateOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TReportListItemDto | null>(null);

  const reportsQuery = useReportsQuery(canView ? projectId : null);
  const deleteMutation = useDeleteReportMutation(projectId);
  const reports: TReportListItemDto[] = reportsQuery.data ?? [];

  function onViewModeChange(nextMode: TProjectListViewMode) {
    if (nextMode === DEFAULT_PROJECT_LIST_VIEW_MODE) {
      deleteQueryParams(["view"]);
      return;
    }
    setQueryParams({ view: nextMode });
  }

  async function downloadReport(report: TReportListItemDto) {
    if (!projectId) return;
    setDownloadingId(report.id);
    try {
      const blob = await fetchReportPdf(projectId, report.id);
      downloadBrowserBlob(`${report.title.replace(/[^\w]+/g, "-").toLowerCase()}.pdf`, blob);
    } catch {
      notify.error(t("pdfError"));
    } finally {
      setDownloadingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      notify.success(t("deleted"));
      setDeleteTarget(null);
    } catch (error) {
      notify.error(error instanceof ApiError ? error.message : t("loadError"));
    }
  }

  if (!projectId) {
    return (
      <div className="w-full min-w-0 px-4 py-6 sm:px-6">
        <EmptyState title={t("selectProjectTitle")} description={t("selectProjectBody")} />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="w-full min-w-0 px-4 py-6 sm:px-6">
        <EmptyState title={t("noAccessTitle")} description={t("noAccessBody")} />
      </div>
    );
  }

  const hasReports = reports.length > 0;

  return (
    <div className="w-full min-w-0">
      <div className="space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="type-stack-md">
            <Heading id="reports-title" pageTitle>
              {t("title")}
            </Heading>
            <Paragraph className="text-text-muted">{t("subtitle")}</Paragraph>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {hasReports ? (
              <ProjectListViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            ) : null}
            {canCreate && (hasReports || reportsQuery.isPending) ? (
              <CreateActionButton onClick={() => setCreateOpen(true)}>{t("newReport")}</CreateActionButton>
            ) : null}
          </div>
        </div>

        {reportsQuery.isError ? (
          <p className="text-sm text-destructive">{t("loadError")}</p>
        ) : reportsQuery.isPending ? (
          <CardGridSkeleton count={3} className="xl:grid-cols-3" />
        ) : !hasReports ? (
          <div className="flex flex-col items-center gap-4">
            <EmptyState icon={Icons.file} title={t("emptyTitle")} description={t("emptyBody")} />
            {canCreate ? (
              <CreateActionButton onClick={() => setCreateOpen(true)}>{t("newReport")}</CreateActionButton>
            ) : null}
          </div>
        ) : viewMode === "table" ? (
          <ReportsTable
            reports={reports}
            isLoading={false}
            canDelete={canDelete}
            downloadingId={downloadingId}
            onDownload={(report) => void downloadReport(report)}
            onDelete={(report) => setDeleteTarget(report)}
          />
        ) : (
          <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3")}>
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                clientName={clientName}
                clientLogoUrl={selectedProject?.imageUrl ?? null}
                canDelete={canDelete}
                isDownloading={downloadingId === report.id}
                onDownload={(item) => void downloadReport(item)}
                onDelete={(item) => setDeleteTarget(item)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        icon={Icons.delete}
        tone="destructive"
        title={t("deleteTitle")}
        description={t("deleteBody")}
        action={
          <>
            <AlertDialogCancel>{t("backToList")}</AlertDialogCancel>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "destructive", size: "md" }))}
              onClick={() => void confirmDelete()}
              disabled={deleteMutation.isPending}
            >
              {t("deleteAction")}
            </button>
          </>
        }
      />

      <ReportCreateSheet
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(report) => router.push(`/reports/${report.id}`)}
      />
    </div>
  );
}
