"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { useReportsQuery } from "@/features/reports/reports.api";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { notify } from "@/lib/frontend/feedback/notify";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";
import { formatPeriodLabel } from "@/lib/reports/period";
import type { TReportListItemDto } from "@/types/reports.types";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso));
}

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
  const [createOpen, setCreateOpen] = useState(false);
  const reportsQuery = useReportsQuery(canView ? projectId : null);

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
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-bg-hover text-start text-xs uppercase tracking-wide text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("colTitle")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("colPeriod")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("colCreated")}</th>
                  <th className="px-4 py-3 text-end font-medium">
                    <span className="sr-only">{t("open")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-text-primary">{report.title}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatPeriodLabel(report.periodFrom, report.periodTo)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{formatDate(report.createdAt)}</td>
                    <td className="px-4 py-3 text-end">
                      <Link
                        href={`/reports/${report.id}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {t("open")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
