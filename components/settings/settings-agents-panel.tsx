"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { useSelectedProject } from "@/context/selected-project-context";
import { useEnrollProjectInLensMutation, useLensScheduleQuery, useSetLensFrequencyMutation } from "@/features/projects/projects.api";
import { LENS_FREQUENCIES, type TLensFrequency } from "@/lib/lens/schedule";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { analyticsPanelClass, elevatedCardSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
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
    <section className={cn(elevatedCardSurfaceClass, analyticsPanelClass)}>
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-5">
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-bg-card/40 dark:border-text-primary/40 dark:bg-transparent"
            aria-hidden
          >
            <Icons.search className="size-4 text-brand" />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="type-title text-text-primary">{t("lensTitle")}</h3>
            <p className="type-caption text-text-muted">{t("lensLead")}</p>
            {project.status !== "active" && !project.lensEnrolled ? (
              <p className="type-caption text-text-muted">{t("lensNeedsActive")}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-0.5 type-caption-xs font-medium text-text-secondary">
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

      <div className="my-5 h-px bg-border/60" aria-hidden />

      {project.lensEnrolled ? <LensFrequencyField projectId={project.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <LensFixedField icon={Icons.analytics} label={t("uptimeWindowLabel")} value="30" suffix={t("daysUnit")} note={t("fixedNote")} />
        <LensFixedField icon={Icons.grid} label={t("pagesLimitLabel")} value="100" note={t("fixedNote")} />
      </div>

      {message ? <p className="mt-4 type-caption text-success">{message}</p> : null}
      {failed ? <p className="mt-4 type-caption text-destructive">{t("lensEnrollFailed")}</p> : null}
    </section>
  );
}

const FREQUENCY_LABEL_KEY: Record<TLensFrequency, "frequencyWeekly" | "frequencyTwiceMonthly" | "frequencyMonthly"> = {
  weekly: "frequencyWeekly",
  twice_monthly: "frequencyTwiceMonthly",
  monthly: "frequencyMonthly",
};

/** How often Lens audits the project: weekly, twice a month or monthly (default). Shown once the project is enrolled. */
function LensFrequencyField({ projectId }: { projectId: string }) {
  const { t, i18n } = useTranslation("translation", { keyPrefix: "settings.agents" });
  const schedule = useLensScheduleQuery(projectId, true);
  const save = useSetLensFrequencyMutation(projectId);
  const [saved, setSaved] = useState(false);
  const current = schedule.data?.frequency ?? null;
  const next = schedule.data?.nextRunAt ? new Date(schedule.data.nextRunAt) : null;

  const choose = (frequency: TLensFrequency) => {
    if (frequency === current || save.isPending) return;
    setSaved(false);
    save.mutate(frequency, { onSuccess: () => setSaved(true) });
  };

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border p-4 dark:border-text-primary/35">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 dark:border-text-primary/40" aria-hidden>
          <Icons.clock className="size-3.5 text-text-secondary" />
        </span>
        <span className="type-body-strong text-text-primary">{t("frequencyLabel")}</span>
      </div>
      <div role="radiogroup" aria-label={t("frequencyLabel")} className="flex flex-wrap gap-2">
        {LENS_FREQUENCIES.map((frequency) => {
          const active = frequency === current;
          return (
            <button
              key={frequency}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={schedule.isLoading || save.isPending}
              onClick={() => choose(frequency)}
              className={cn(
                "rounded-full border px-3 py-1 type-caption font-medium transition-colors disabled:opacity-60",
                active ? "border-brand bg-brand/10 text-text-primary" : "border-border text-text-secondary hover:border-brand/50 hover:text-text-primary",
              )}
            >
              {t(FREQUENCY_LABEL_KEY[frequency])}
            </button>
          );
        })}
      </div>
      <span className="type-caption-xs text-text-muted">
        {t("frequencyNote")}
        {next ? ` ${t("frequencyNext", { date: next.toLocaleDateString(i18n.language, { dateStyle: "medium" }) })}` : ""}
      </span>
      {saved ? <span className="type-caption-xs text-success">{t("frequencySaved")}</span> : null}
      {save.isError || schedule.isError ? <span className="type-caption-xs text-destructive">{t("frequencyFailed")}</span> : null}
    </div>
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
    <div className="flex flex-col gap-3 rounded-2xl border border-border p-4 dark:border-text-primary/35">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 dark:border-text-primary/40" aria-hidden>
          <Icon className="size-3.5 text-text-secondary" />
        </span>
        <span className="type-body-strong text-text-primary">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={value}
          disabled
          readOnly
          className="h-9 w-24 text-text-muted"
          aria-label={label}
        />
        {suffix ? <span className="type-caption text-text-muted">{suffix}</span> : null}
      </div>
      <span className="type-caption-xs text-text-muted">{note}</span>
    </div>
  );
}
