"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ReportCreateSheet } from "@/components/reports/report-create-sheet";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateActionButton } from "@/components/ui/create-action-button";
import { useProjectAccess } from "@/context/project-access-context";
import { useSelectedProject } from "@/context/selected-project-context";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import {
  fetchReportPdf,
  useDeleteReportMutation,
  useReportsQuery,
} from "@/features/reports/reports.api";
import { downloadBrowserBlob } from "@/lib/frontend/download-file";
import { ReportCard } from "@/components/reports/report-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { notify } from "@/lib/frontend/feedback/notify";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";
import type { TReportListItemDto } from "@/types/reports.types";

export function ReportsSection() {
  const { t } = useTranslation("translation", { keyPrefix: "modules.reports" });
  const router = useRouter();
  const { selectedProject } = useSelectedProject();
  const projectId = selectedProject?.id ?? null;
  const { data: authUser } = useAuthUserQuery();
  const { projectPermissions } = useProjectAccess();
  const permissions = useMemo(
    () => mergePermissions(authUser?.permissions ?? [], projectPermissions),
    [authUser?.permissions, projectPermissions],
  );

  const canView = hasPermission(permissions, "reports.view");
  const canCreate = hasPermission(permissions, "reports.create");
  const canDelete = hasPermission(permissions, "reports.delete");
  const [createOpen, setCreateOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TReportListItemDto | null>(null);
  const reportsQuery = useReportsQuery(canView ? projectId : null);
  const deleteMutation = useDeleteReportMutation(projectId);

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
    } catch {
      notify.error(t("loadError"));
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

  const reports: TReportListItemDto[] = reportsQuery.data ?? [];

  return (
    <div className="w-full min-w-0">
      <div className="space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="type-stack-md">
            <Heading id="reports-title" pageTitle>
              {t("title")}
            </Heading>
            <Paragraph className="text-text-secondary">{t("subtitle")}</Paragraph>
          </div>
          {canCreate ? (
            <CreateActionButton onClick={() => setCreateOpen(true)} className="shrink-0">
              {t("newReport")}
            </CreateActionButton>
          ) : null}
        </div>

        {reportsQuery.isError ? (
          <p className="text-sm text-destructive">{t("loadError")}</p>
        ) : reports.length === 0 && !reportsQuery.isPending ? (
          <EmptyState icon={Icons.file} title={t("emptyTitle")} description={t("emptyBody")} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                clientName={selectedProject?.businessName ?? ""}
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
        onCreated={(report) => {
          notify.success(t("created"));
          router.push(`/reports/${report.id}`);
        }}
      />
    </div>
  );
}
