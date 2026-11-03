"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ReportCreateForm } from "@/components/reports/report-create-form";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useProjectAccess } from "@/context/project-access-context";
import { useSelectedProject } from "@/context/selected-project-context";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";

/** Page to create a monthly report. Needs a selected project and `reports.create`. */
export function ReportsCreateSection() {
  const { t } = useTranslation("translation", { keyPrefix: "modules.reports" });
  const router = useRouter();
  const { selectedProject } = useSelectedProject();
  const { data: authUser, isLoading } = useAuthUserQuery();
  const { projectPermissions } = useProjectAccess();
  const canCreate = hasPermission(mergePermissions(authUser?.permissions ?? [], projectPermissions), "reports.create");
  const projectId = selectedProject?.id ?? null;

  useEffect(() => {
    if (!isLoading && authUser && !canCreate) router.replace("/reports");
  }, [authUser, canCreate, isLoading, router]);

  if (isLoading || !authUser) return <LoadingState skeletonVariant="form" />;
  if (!canCreate) return null;

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="type-stack-md">
          <Heading id="reports-create-title" pageTitle>
            {t("createTitle")}
          </Heading>
          <Paragraph className="text-text-muted">{t("createBody")}</Paragraph>
        </div>
        {projectId ? (
          <ReportCreateForm projectId={projectId} />
        ) : (
          <EmptyState title={t("selectProjectTitle")} description={t("selectProjectBody")} icon={Icons.folderOpen} />
        )}
      </div>
    </div>
  );
}
