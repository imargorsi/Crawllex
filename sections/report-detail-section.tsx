"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ReportDetailView } from "@/components/reports/report-view/report-detail-view";
import { ReportHero } from "@/components/reports/report-view/report-hero";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useProjectAccess } from "@/context/project-access-context";
import { useSelectedProject } from "@/context/selected-project-context";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { fetchReportPdf, useDeleteReportMutation, useReportQuery } from "@/features/reports/reports.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { downloadBrowserBlob } from "@/lib/frontend/download-file";
import { notify } from "@/lib/frontend/feedback/notify";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";
import { formatCompactPeriodLabel, formatMonthTitle } from "@/lib/reports/period";
import { buildReportView } from "@/lib/reports/view-model";
import { cn } from "@/lib/utils";

type TReportDetailSectionProps = {
  reportId: string;
};

export function ReportDetailSection({ reportId }: TReportDetailSectionProps) {
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
  const canDelete = hasPermission(permissions, "reports.delete");
  const reportQuery = useReportQuery(canView ? projectId : null, reportId);
  const deleteMutation = useDeleteReportMutation(projectId);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const view = useMemo(() => (reportQuery.data ? buildReportView(reportQuery.data.snapshot) : null), [reportQuery.data]);

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

  if (reportQuery.isError) {
    const notFound = reportQuery.error instanceof ApiError && reportQuery.error.status === 404;
    return (
      <div className="w-full min-w-0 px-4 py-6 sm:px-6">
        <EmptyState
          title={notFound ? t("notFoundTitle") : t("loadError")}
          description={notFound ? t("notFoundBody") : t("loadError")}
        />
      </div>
    );
  }

  const report = reportQuery.data;

  async function downloadPdf() {
    if (!projectId || !report) return;
    setIsDownloading(true);
    try {
      const blob = await fetchReportPdf(projectId, reportId);
      downloadBrowserBlob(`${report.title.replace(/[^\w]+/g, "-").toLowerCase()}.pdf`, blob);
    } catch {
      notify.error(t("pdfError"));
    } finally {
      setIsDownloading(false);
    }
  }

  async function confirmDelete() {
    try {
      await deleteMutation.mutateAsync(reportId);
      notify.success(t("deleted"));
      setDeleteOpen(false);
      router.push("/reports");
    } catch {
      notify.error(t("loadError"));
    }
  }

  return (
    <div className="w-full min-w-0">
      <div className="space-y-6 px-4 py-6 sm:px-6">
        <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary">
          <Icons.arrowLeft className="size-4" aria-hidden />
          {t("backToList")}
        </Link>

        {report && view ? (
          <>
            <ReportHero
              clientName={view.cover.clientName}
              monthTitle={formatMonthTitle(report.periodFrom)}
              periodLabel={formatCompactPeriodLabel(report.periodFrom, report.periodTo)}
              createdAt={report.createdAt}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => void downloadPdf()}
                    disabled={isDownloading}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/25 disabled:opacity-60"
                  >
                    {isDownloading ? <Spinner className="size-4" /> : <Icons.download className="size-4" aria-hidden />}
                    {t("downloadPdf")}
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/80"
                    >
                      <Icons.delete className="size-4" aria-hidden />
                      {t("deleteAction")}
                    </button>
                  ) : null}
                </>
              }
            />

            <ReportDetailView view={view} />
          </>
        ) : (
          <div className="flex justify-center py-16">
            <Spinner className="size-6" />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
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
    </div>
  );
}
