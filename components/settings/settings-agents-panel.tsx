"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { useSelectedProject } from "@/context/selected-project-context";
import { useEnrollProjectInLensMutation } from "@/features/projects/projects.api";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";
import type { TProjectListItem } from "@/types/project.types";

/**
 * Settings > Agents & AI (super admin only). AI and agent modules for the selected project.
 * Project dropdown sets the selected project for the whole dashboard.
 * Lens: switching on enrolls the project and runs the first SEO audit in the background.
 */
export function SettingsAgentsPanel() {
  const { t } = useTranslation("translation", { keyPrefix: "settings.agents" });
  const { selectedProject } = useSelectedProject();

  return (
    <div className="flex flex-col gap-6">
      <p className="type-caption text-text-muted">{t("lead")}</p>
      {selectedProject ? (
        <LensAgentCard project={selectedProject} />
      ) : (
        <EmptyState title={t("title")} description={t("noProject")} />
      )}
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

  const statusLabel = enroll.isPending
    ? t("lensEnrollBusy")
    : project.lensEnrolled
      ? t("lensStatusEnrolled")
      : t("lensStatusNotEnrolled");

  return (
    <section className="rounded-3xl border border-text-primary/30 bg-text-primary/[0.04] p-6 shadow-(--shadow-elevated) backdrop-blur-xl sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-5">
          <span
            className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl border border-brand/60 bg-brand/10 shadow-[0_0_28px_-8px_var(--brand)]"
            aria-hidden
          >
            <Icons.search className="size-6 text-brand" />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="text-2xl font-semibold text-text-primary">{t("lensTitle")}</h3>
            <p className="text-base text-text-muted">{t("lensLead")}</p>
            {project.status !== "active" && !project.lensEnrolled ? (
              <p className="type-caption text-text-muted">{t("lensNeedsActive")}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-text-primary/30 bg-text-primary/[0.03] px-4 py-2 text-base text-text-primary">
            <span
              aria-hidden
              className={cn("size-2 rounded-full", project.lensEnrolled ? "bg-status-active" : "bg-text-muted")}
            />
            {statusLabel}
          </span>
          <Switch
            checked={project.lensEnrolled}
            onCheckedChange={onToggle}
            disabled={!canEnroll || enroll.isPending}
            ariaLabel={t("lensTitle")}
          />
        </div>
      </div>

      <div className="my-7 h-px bg-text-primary/15" aria-hidden />

      <div className="grid gap-5 md:grid-cols-2">
        <LensFixedField icon={Icons.analytics} label={t("uptimeWindowLabel")} value="30" suffix={t("daysUnit")} note={t("fixedNote")} />
        <LensFixedField icon={Icons.grid} label={t("pagesLimitLabel")} value="30" note={t("fixedNote")} />
      </div>

      {message ? <p className="mt-5 type-caption text-success">{message}</p> : null}
      {failed ? <p className="mt-5 type-caption text-destructive">{t("lensEnrollFailed")}</p> : null}
    </section>
  );
}

/** Disabled field that shows the fixed value as it would look when editable. Not changeable yet. */
function LensFixedField({
  icon: Icon,
  label,
  value,
  suffix,
  note,
}: {
  icon: typeof Icons.grid;
  label: string;
  value: string;
  suffix?: string;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-text-primary/25 bg-text-primary/[0.03] p-5">
      <div className="flex items-center gap-3.5">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-text-primary/25 bg-text-primary/[0.04]" aria-hidden>
          <Icon className="size-4 text-text-primary" />
        </span>
        <span className="text-lg font-semibold text-text-primary">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={value}
          disabled
          readOnly
          className="h-12 w-36 border-text-primary/35 bg-transparent text-lg text-text-primary/75"
          aria-label={label}
        />
        {suffix ? <span className="text-base text-text-muted">{suffix}</span> : null}
      </div>
      <span className="text-sm text-text-muted">{note}</span>
    </div>
  );
}
