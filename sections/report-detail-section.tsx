"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { useProjectAccess } from "@/context/project-access-context";
import { useSelectedProject } from "@/context/selected-project-context";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import {
  fetchReportPdf,
  useDeleteReportMutation,
  useReportHtmlQuery,
  useReportQuery,
} from "@/features/reports/reports.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { downloadBrowserBlob } from "@/lib/frontend/download-file";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { notify } from "@/lib/frontend/feedback/notify";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";
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

  const [pdfBusy, setPdfBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const htmlQuery = useReportHtmlQuery(canView ? projectId : null, reportId, Boolean(reportQuery.data));

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
    setPdfBusy(true);
    try {
      const blob = await fetchReportPdf(projectId, reportId);
      downloadBrowserBlob(`${report.title.replace(/[^\w]+/g, "-").toLowerCase()}.pdf`, blob);
    } catch {
      notify.error(t("pdfError"));
    } finally {
      setPdfBusy(false);
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
      <div className="space-y-5 px-4 py-6 sm:px-6">
        <Link href="/reports" className="text-sm text-text-secondary hover:text-text-primary">
          ← {t("backToList")}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="type-stack-md min-w-0">
            <Heading id="report-title" pageTitle>
              {report?.title ?? ""}
            </Heading>
            {report ? (
              <Paragraph className="text-text-secondary">
                {report.snapshot.period.label}
              </Paragraph>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button type="button" onClick={() => void downloadPdf()} disabled={pdfBusy || !report}>
              {pdfBusy ? t("preparingPdf") : t("downloadPdf")}
            </Button>
            {canDelete ? (
              <button
                type="button"
                className={cn(buttonVariants({ variant: "destructive", size: "md" }))}
                onClick={() => setDeleteOpen(true)}
              >
                {t("deleteAction")}
              </button>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-bg-hover">
          {htmlQuery.isError ? (
            <p className="p-6 text-sm text-destructive">{t("previewError")}</p>
          ) : htmlQuery.data ? (
            <iframe
              title={report?.title ?? t("title")}
              srcDoc={htmlQuery.data}
              sandbox=""
              className="h-[80vh] w-full bg-white"
            />
          ) : (
            <p className="p-6 text-sm text-text-secondary">{t("previewLoading")}</p>
          )}
        </div>
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
