"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useTranslation } from "react-i18next";

import {
  ProjectDetailInfoCard,
  ProjectDetailTagList,
} from "@/components/projects/detail/project-detail-info-card";
import { ProjectDetailMembersCard } from "@/components/projects/detail/project-detail-members-card";
import type { TProjectDetail } from "@/features/projects/projects.api";
import {
  formatProjectDate,
  isHttpUrl,
  toExternalHref,
} from "@/lib/frontend/projects/project-detail-display.utils";
import {
  elevatedCardBodyClass,
  elevatedCardMutedClass,
  elevatedCardTitleClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

type ProjectDetailSidebarProps = {
  project: TProjectDetail;
};

type TimelineEntry = {
  id: string;
  label: string;
  date: string | null;
  tone: "brand" | "success" | "destructive" | "muted";
};

function TimelineDot({ tone }: { tone: TimelineEntry["tone"] }) {
  const toneClass =
    tone === "success"
      ? "bg-status-active"
      : tone === "destructive"
        ? "bg-status-rejected"
        : tone === "brand"
          ? "bg-brand"
          : "bg-text-muted";

  return <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", toneClass)} aria-hidden />;
}

export function ProjectDetailSidebar({ project }: ProjectDetailSidebarProps) {
  const { i18n, t } = useTranslation("translation", { keyPrefix: "modules.projects.detail" });
  const locale = i18n.language?.startsWith("ar") ? "ar" : "en";

  const timeline: TimelineEntry[] = [
    { id: "created", label: t("timelineCreated"), date: project.createdAt, tone: "brand" },
  ];

  if (project.approvedAt) {
    timeline.push({
      id: "approved",
      label: t("timelineApproved"),
      date: project.approvedAt,
      tone: "success",
    });
  }

  if (project.rejectedAt) {
    timeline.push({
      id: "rejected",
      label: t("timelineRejected"),
      date: project.rejectedAt,
      tone: "destructive",
    });
  }

  timeline.push({
    id: "updated",
    label: t("timelineUpdated"),
    date: project.updatedAt,
    tone: "muted",
  });

  return (
    <div className="space-y-4">
      <ProjectDetailMembersCard project={project} />

      <ProjectDetailInfoCard
        title={t("timelineTitle")}
        icon={<Icons.clock className="size-4 shrink-0" aria-hidden />}
      >
        <ol className="space-y-4">
          {timeline.map((entry) => (
            <li key={entry.id} className="flex gap-3">
              <TimelineDot tone={entry.tone} />
              <div className="min-w-0">
                <p className={cn("type-body-strong", elevatedCardTitleClass)}>{entry.label}</p>
                <p className={cn("type-caption", elevatedCardBodyClass)}>
                  {entry.date ? formatProjectDate(entry.date, locale) : t("noValue")}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </ProjectDetailInfoCard>

      <ProjectDetailInfoCard
        title={t("sectionLocationsTitle")}
        lead={t("sectionLocationsLead")}
        icon={<Icons.location className="size-4 shrink-0" aria-hidden />}
      >
        <ProjectDetailTagList items={project.targetLocations} emptyLabel={t("noLocations")} />
      </ProjectDetailInfoCard>

      <ProjectDetailInfoCard
        title={t("sectionCompetitorsTitle")}
        lead={t("sectionCompetitorsLead")}
        icon={<Icons.gitCompare className="size-4 shrink-0" aria-hidden />}
      >
        {project.competitorUrls.length === 0 ? (
          <p className={cn("type-body", elevatedCardMutedClass)}>{t("noCompetitors")}</p>
        ) : (
          <ul className="space-y-2">
            {project.competitorUrls.map((competitor) => {
              const linkable = isHttpUrl(competitor);

              return (
                <li key={competitor}>
                  {linkable ? (
                    <a
                      href={toExternalHref(competitor)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "type-body break-all text-brand underline-offset-4 transition-colors hover:underline",
                      )}
                    >
                      {competitor}
                    </a>
                  ) : (
                    <span className={cn("type-body break-all", elevatedCardBodyClass)}>{competitor}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </ProjectDetailInfoCard>
    </div>
  );
}
