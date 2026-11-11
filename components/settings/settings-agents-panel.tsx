"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { useSelectedProject } from "@/context/selected-project-context";
import { useEnrollProjectInLensMutation } from "@/features/projects/projects.api";
import { analyticsHeadingStackClass, analyticsPanelClass, elevatedCardSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { Icons } from "@/lib/frontend/icons/app-icons";
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

  // No un-enroll route yet: once enrolled the switch stays on.
  const canEnroll = !project.lensEnrolled && project.status === "active";

  const onToggle = (next: boolean) => {
    if (!next || !canEnroll) return;
    setMessage(null);
    setFailed(false);
    enroll.mutate(project.id, {
      onSuccess: (result) => setMessage(result.alreadyEnrolled ? t("lensEnrollAlready") : t("lensEnrollQueued")),
      onError: () => setFailed(true),
    });
  };

  return (
    <section className={cn(elevatedCardSurfaceClass, analyticsPanelClass)}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className={cn(analyticsHeadingStackClass, "min-w-0 max-w-2xl")}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-bg-card/40 dark:border-text-primary/40 dark:bg-transparent"
                aria-hidden
              >
                <Icons.search className="size-4 text-brand" />
              </span>
              <h3 className="type-title text-text-primary">{t("lensTitle")}</h3>
            </div>
            <p className="type-caption text-text-muted">{t("lensLead")}</p>
            {project.status !== "active" && !project.lensEnrolled ? (
              <p className="type-caption text-text-muted">{t("lensNeedsActive")}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Switch
              checked={project.lensEnrolled}
              onCheckedChange={onToggle}
              disabled={!canEnroll || enroll.isPending}
              ariaLabel={t("lensTitle")}
            />
            <span className="type-caption text-text-muted">
              {enroll.isPending
                ? t("lensEnrollBusy")
                : project.lensEnrolled
                  ? t("lensStatusEnrolled")
                  : t("lensStatusNotEnrolled")}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <LensFixedField label={t("uptimeWindowLabel")} value="30" suffix={t("daysUnit")} note={t("fixedNote")} />
          <LensFixedField label={t("pagesLimitLabel")} value="30" note={t("fixedNote")} />
        </div>

        {message ? <p className="type-caption text-success">{message}</p> : null}
        {failed ? <p className="type-caption text-destructive">{t("lensEnrollFailed")}</p> : null}
      </div>
    </section>
  );
}

/** Disabled field that shows the value as it would look when editable. Not changeable yet. */
function LensFixedField({ label, value, suffix, note }: { label: string; value: string; suffix?: string; note: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="type-caption text-text-primary">{label}</label>
      <div className="flex items-center gap-2">
        <Input type="number" value={value} disabled readOnly className="max-w-32" aria-label={label} />
        {suffix ? <span className="type-caption text-text-muted">{suffix}</span> : null}
      </div>
      <span className="type-caption-xs text-text-muted">{note}</span>
    </div>
  );
}
