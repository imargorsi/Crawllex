"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";
import { useSelectedProject } from "@/context/selected-project-context";
import { useEnrollProjectInLensMutation } from "@/features/projects/projects.api";
import type { TProjectListItem } from "@/types/project.types";

/**
 * Settings > Modules (super admin only). Optional modules for the selected project.
 * Lens: enrolling runs the first SEO audit in the background. Once enrolled, the Lens page appears for the project.
 */
export function SettingsModulesPanel() {
  const { t } = useTranslation("translation", { keyPrefix: "settings.modules" });
  const { selectedProject } = useSelectedProject();

  if (!selectedProject) {
    return <EmptyState title={t("title")} description={t("noProject")} />;
  }

  return (
    <div className="space-y-4">
      <p className="type-body text-text-muted">{t("lead")}</p>
      <LensModuleRow project={selectedProject} />
    </div>
  );
}

function LensModuleRow({ project }: { project: TProjectListItem }) {
  const { t } = useTranslation("translation", { keyPrefix: "settings.modules" });
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
    <section className="flex flex-col gap-3 rounded-3xl border border-border p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="type-body-strong text-text-primary">{t("lensTitle")}</h3>
          <p className="type-caption text-text-muted">{t("lensLead")}</p>
        </div>
        <span className="type-caption rounded-full border border-border px-3 py-1 text-text-primary">
          {project.lensEnrolled ? t("lensStatusEnrolled") : t("lensStatusNotEnrolled")}
        </span>
      </div>
      {project.status !== "active" && !project.lensEnrolled ? (
        <p className="type-caption text-text-muted">{t("lensNeedsActive")}</p>
      ) : null}
      {canEnroll ? (
        <button
          type="button"
          onClick={onEnroll}
          disabled={enroll.isPending}
          className="type-caption inline-flex h-9 w-fit items-center rounded-xl border border-brand/50 px-4 font-medium text-brand transition-colors hover:bg-brand/10 disabled:opacity-40"
        >
          {enroll.isPending ? t("lensEnrollBusy") : t("lensEnrollButton")}
        </button>
      ) : null}
      {message ? <p className="type-caption text-success">{message}</p> : null}
      {failed ? <p className="type-caption text-destructive">{t("lensEnrollFailed")}</p> : null}
    </section>
  );
}
