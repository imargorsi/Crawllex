"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { useSelectedProject } from "@/context/selected-project-context";
import { useEnrollProjectInLensMutation } from "@/features/projects/projects.api";
import { elevatedCardSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
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
      <ProjectDropdown />
      {selectedProject ? (
        <LensAgentCard project={selectedProject} />
      ) : (
        <EmptyState title={t("title")} description={t("noProject")} />
      )}
    </div>
  );
}

function ProjectDropdown() {
  const { t } = useTranslation("translation", { keyPrefix: "settings.agents" });
  const { projects, selectedProject, setSelectedProjectId } = useSelectedProject();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center gap-3 rounded-xl border border-border px-4 text-start transition-colors hover:border-brand/50 focus-visible:ring-2 focus-visible:ring-accent-border focus-visible:outline-none"
      >
        <Icons.briefcase className="size-4 shrink-0 text-brand" aria-hidden />
        <span className="type-caption text-text-muted">{t("projectLabel")}:</span>
        <span className="min-w-0 flex-1 truncate type-body-strong text-text-primary">
          {selectedProject ? selectedProject.businessName : t("selectPrompt")}
        </span>
        <Icons.arrowDown
          className={cn("size-4 shrink-0 text-text-muted transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={t("projectLabel")}
          className="absolute start-0 top-full z-40 mt-2 w-full overflow-hidden rounded-xl border border-border bg-bg-card shadow-(--shadow-elevated)"
        >
          {projects.map((project) => {
            const isSelected = project.id === selectedProject?.id;
            return (
              <button
                key={project.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-start type-body transition-colors",
                  isSelected ? "text-brand" : "text-text-primary hover:bg-bg-hover/45",
                )}
              >
                <span className="truncate">{project.businessName}</span>
                {isSelected ? <Icons.tick className="size-4 shrink-0" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
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
    <section className={cn(elevatedCardSurfaceClass, "rounded-3xl p-5 sm:p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-brand/40 bg-brand/10" aria-hidden>
            <Icons.search className="size-5 text-brand" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="type-title text-text-primary">{t("lensTitle")}</h3>
            <p className="type-caption text-text-muted">{t("lensLead")}</p>
            {project.status !== "active" && !project.lensEnrolled ? (
              <p className="type-caption text-text-muted">{t("lensNeedsActive")}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 type-caption text-text-secondary">
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

      <div className="my-6 h-px bg-border/60" aria-hidden />

      <div className="grid gap-4 md:grid-cols-2">
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
    <div className="flex flex-col gap-4 rounded-2xl border border-border p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60" aria-hidden>
          <Icon className="size-4 text-text-secondary" />
        </span>
        <span className="type-body-strong text-text-primary">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <Input type="number" value={value} disabled readOnly className="w-28" aria-label={label} />
        {suffix ? <span className="type-body text-text-muted">{suffix}</span> : null}
      </div>
      <span className="type-caption-xs text-text-muted">{note}</span>
    </div>
  );
}
