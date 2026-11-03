"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { AssistantChat } from "@/components/assistant-chat/assistant-chat";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { EmptyState } from "@/components/ui/empty-state";
import { PageAmbientGlow } from "@/components/ui/page-ambient-glow";
import { useProjectAccess } from "@/context/project-access-context";
import { useSelectedProject } from "@/context/selected-project-context";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { typeStackMdClass } from "@/lib/frontend/layout/dashboard-chrome";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";
import { cn } from "@/lib/utils";

export function DashboardHomeSection() {
  const { t } = useTranslation("translation", { keyPrefix: "home" });
  const { selectedProject } = useSelectedProject();
  const projectId = selectedProject?.id ?? null;
  const { data: authUser } = useAuthUserQuery();
  const { projectPermissions } = useProjectAccess();

  const permissions = useMemo(
    () => mergePermissions(authUser?.permissions ?? [], projectPermissions),
    [authUser?.permissions, projectPermissions]
  );

  if (!projectId) {
    return (
      <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-center px-4 py-6 sm:px-6">
        <EmptyState title={t("selectProjectTitle")} description={t("selectProjectBody")} />
      </div>
    );
  }

  return (
    <div className="relative flex w-full min-w-0 flex-col xl:h-full xl:min-h-0">
      <PageAmbientGlow />

      <div className="relative flex w-full min-w-0 flex-col gap-4 px-4 py-2.5 sm:px-6 sm:py-3 xl:min-h-0 xl:flex-1">
        <div className={cn(typeStackMdClass, "max-w-xl min-w-0")}>
          <Heading id="dashboard-home-title" pageTitle>
            {t("title")}
          </Heading>
          <Paragraph className="text-text-secondary">{t("subtitle")}</Paragraph>
        </div>

        <AssistantChat
          projectId={projectId}
          canViewLeads={hasPermission(permissions, "leads.view")}
          canViewAnalytics={hasPermission(permissions, "analytics.view")}
          canViewSeo={hasPermission(permissions, "seo_activities.view")}
          className="border-border/40 bg-bg-card/25 flex min-h-[60vh] w-full min-w-0 flex-col gap-4 rounded-3xl border p-4 sm:p-5 xl:h-full xl:min-h-0 xl:flex-row xl:gap-4"
        />
      </div>
    </div>
  );
}
