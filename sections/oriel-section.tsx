"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Heading } from "@/components/heading";
import { OrielMark } from "@/components/oriel/oriel-mark";
import { OrielWorkspace } from "@/components/oriel/oriel-workspace";
import { Paragraph } from "@/components/paragraph";
import { EmptyState } from "@/components/ui/empty-state";
import { PageAmbientGlow } from "@/components/ui/page-ambient-glow";
import { useProjectAccess } from "@/context/project-access-context";
import { useSelectedProject } from "@/context/selected-project-context";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { typeStackMdClass } from "@/lib/frontend/layout/dashboard-chrome";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";

/** Oriel module page: header, then the chat workspace for the selected project. */
export function OrielSection() {
  const { t } = useTranslation("translation", { keyPrefix: "oriel" });
  const { t: tHome } = useTranslation("translation", { keyPrefix: "home" });
  const { selectedProject } = useSelectedProject();
  const projectId = selectedProject?.id ?? null;
  const { data: authUser } = useAuthUserQuery();
  const { projectPermissions } = useProjectAccess();

  const permissions = useMemo(
    () => mergePermissions(authUser?.permissions ?? [], projectPermissions),
    [authUser?.permissions, projectPermissions],
  );

  if (!projectId) {
    return (
      <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-center px-4 py-6 sm:px-6">
        <EmptyState title={tHome("selectProjectTitle")} description={tHome("selectProjectBody")} />
      </div>
    );
  }

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5 xl:h-full xl:min-h-0">
      <PageAmbientGlow />

      <div className="relative flex min-w-0 items-center gap-4">
        <OrielMark size="lg" />
        <div className={typeStackMdClass + " min-w-0"}>
          <Heading id="oriel-title" pageTitle>
            {t("title")}
          </Heading>
          <Paragraph className="text-text-secondary">{t("subtitle")}</Paragraph>
        </div>
      </div>

      <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <OrielWorkspace
          projectId={projectId}
          canViewLeads={hasPermission(permissions, "leads.view")}
          canViewAnalytics={hasPermission(permissions, "analytics.view")}
          canViewSeo={hasPermission(permissions, "seo_activities.view")}
        />
      </div>
    </div>
  );
}
