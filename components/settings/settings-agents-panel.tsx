"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useSelectedProject } from "@/context/selected-project-context";
import { useEnrollProjectInLensMutation } from "@/features/projects/projects.api";
import { analyticsHeadingStackClass, analyticsPanelClass, elevatedCardSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { getStatusChipClassName } from "@/lib/frontend/theme/status-colors";
import { cn } from "@/lib/utils";
import type { TProjectListItem } from "@/types/project.types";

/**
 * Settings > Agents & AI (super admin only). Control panel for the AI and agent modules of the selected project.
 * Lens: enrolling runs the first SEO audit in the background. Once enrolled, the Lens page appears for the project.
 */
export function SettingsAgentsPanel() {
  const { t } = useTranslation("translation", { keyPrefix: "settings.agents" });
  const { selectedProject } = useSelectedProject();

  if (!selectedProject) {
    return <EmptyState title={t("title")} description={t("noProject")} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={cn(analyticsHeadingStackClass, "max-w-2xl")}>
        <p className="type-label text-text-primary">{t("projectContext", { name: selectedProject.businessName })}</p>
        <p className="type-caption text-text-muted">{t("lead")}</p>
      </div>
      <LensAgentCard project={selectedProject} />
    </div>
  );
}

function LensAgentCard({ project }: { project: TProjectListItem }) {
  const { t } = useTranslation("translation", { keyPrefix: "settings.agents" });
  const enroll = useEnrollProjectInLensMutation();
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const canEnroll = !project.lensEnrolled && project.status === "active";

  const onEnroll = () => {
    setMessage(null);
    setFailed(false);
    enroll.mutate(project.id, {
      onSuccess: (result) => setMessage(result.alreadyEnrolled ? t("lensEnrollAlready") : t("lensEnrollQueued")),
      onError: () => setFailed(true),
    });
  };

  return (
    <section className={cn(elevatedCardSurfaceClass, analyticsPanelClass)}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className={cn(analyticsHeadingStackClass, "max-w-2xl")}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-bg-card/40 dark:border-text-primary/40 dark:bg-transparent"
                aria-hidden
              >
                <Icons.search className="size-4 text-brand" />
              </span>
              <h3 className="type-title text-text-primary">{t("lensTitle")}</h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 type-caption-xs font-medium",
                  getStatusChipClassName(project.lensEnrolled ? "active" : "inactive"),
                )}
              >
                {project.lensEnrolled ? t("lensStatusEnrolled") : t("lensStatusNotEnrolled")}
              </span>
            </div>
            <p className="type-caption text-text-muted">{t("lensLead")}</p>
            {project.status !== "active" && !project.lensEnrolled ? (
              <p className="type-caption text-text-muted">{t("lensNeedsActive")}</p>
            ) : null}
          </div>
          {canEnroll ? (
            <Button type="button" variant="outlined" size="md" disabled={enroll.isPending} onClick={onEnroll} className="shrink-0">
              <Icons.rocket className="size-4" aria-hidden />
              {enroll.isPending ? t("lensEnrollBusy") : t("lensEnrollButton")}
            </Button>
          ) : null}
        </div>
        {message ? <p className="type-caption text-success">{message}</p> : null}
        {failed ? <p className="type-caption text-destructive">{t("lensEnrollFailed")}</p> : null}
      </div>
    </section>
  );
}
