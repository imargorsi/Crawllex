"use client";

import { useTranslation } from "react-i18next";

import {
  ProjectDetailField,
  ProjectDetailInfoCard,
  ProjectDetailTagList,
} from "@/components/projects/detail/project-detail-info-card";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { displayDetailValue } from "@/lib/frontend/projects/project-detail-display.utils";
import { SEO_GOAL_ICONS } from "@/lib/frontend/projects/seo-goal-icons";
import { elevatedCardMutedClass, elevatedCardTitleClass } from "@/lib/frontend/layout/dashboard-chrome";
import { SEO_GOALS } from "@/lib/projects/constants";
import type { TPublicClientView } from "@/types/client.types";
import { cn } from "@/lib/utils";

type TClientIntakeSnapshotProps = {
  client: TPublicClientView;
};

export function ClientIntakeSnapshot({ client }: TClientIntakeSnapshotProps) {
  const { t: tForm } = useTranslation("translation", { keyPrefix: "modules.clients.createForm" });
  const { t: tDetail } = useTranslation("translation", { keyPrefix: "modules.clients.detail" });
  const { t: tSeoGoals } = useTranslation("translation", { keyPrefix: "modules.projects.seoGoals" });
  const selectedGoals = new Set(client.seoGoals);

  return (
    <div className="space-y-4">
      <ProjectDetailInfoCard
        title={tDetail("sectionBusinessTitle")}
        lead={tDetail("sectionBusinessLead")}
        icon={<Icons.briefcase className="size-4 shrink-0" aria-hidden />}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <ProjectDetailField label={tForm("websiteUrl")} value={displayDetailValue(client.websiteUrl)} />
          <ProjectDetailField label={tForm("businessAddress")} value={displayDetailValue(client.businessAddress)} />
          <ProjectDetailField label={tForm("pocContactNumber")} value={displayDetailValue(client.pocContactNumber)} />
          <ProjectDetailField label={tForm("pocEmail")} value={displayDetailValue(client.pocEmail)} />
          <ProjectDetailField
            label={tForm("primaryServiceToPromote")}
            value={displayDetailValue(client.primaryServiceToPromote)}
          />
        </div>
      </ProjectDetailInfoCard>

      <ProjectDetailInfoCard
        title={tDetail("sectionServicesTitle")}
        lead={tDetail("sectionServicesLead")}
        icon={<Icons.grid className="size-4 shrink-0" aria-hidden />}
      >
        <ProjectDetailTagList items={client.servicesOffered} emptyLabel={tDetail("noServices")} />
      </ProjectDetailInfoCard>

      <ProjectDetailInfoCard
        title={tDetail("sectionIcpTitle")}
        lead={tDetail("sectionIcpLead")}
        icon={<Icons.user className="size-4 shrink-0" aria-hidden />}
      >
        <p className={cn("type-body", client.idealCustomerProfile ? elevatedCardTitleClass : elevatedCardMutedClass)}>
          {displayDetailValue(client.idealCustomerProfile, tDetail("noValue"))}
        </p>
      </ProjectDetailInfoCard>

      <ProjectDetailInfoCard
        title={tDetail("sectionLocationsTitle")}
        lead={tDetail("sectionLocationsLead")}
        icon={<Icons.location className="size-4 shrink-0" aria-hidden />}
      >
        <ProjectDetailTagList items={client.targetLocations} emptyLabel={tDetail("noLocations")} />
      </ProjectDetailInfoCard>

      <ProjectDetailInfoCard
        title={tDetail("sectionSeoGoalsTitle")}
        lead={tDetail("sectionSeoGoalsLead")}
        icon={<Icons.flag className="size-4 shrink-0" aria-hidden />}
      >
        {client.seoGoals.length === 0 ? (
          <p className={cn("type-body", elevatedCardMutedClass)}>{tDetail("noSeoGoals")}</p>
        ) : (
          <ul className="space-y-2">
            {SEO_GOALS.filter((goal) => selectedGoals.has(goal)).map((goal) => {
              const Icon = SEO_GOAL_ICONS[goal];
              return (
                <li
                  key={goal}
                  className="flex items-center gap-3 rounded-xl border border-border bg-bg-input px-4 py-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="type-body-strong text-text-primary">{tSeoGoals(goal)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </ProjectDetailInfoCard>

      <ProjectDetailInfoCard
        title={tDetail("sectionCompetitorsTitle")}
        lead={tDetail("sectionCompetitorsLead")}
        icon={<Icons.link className="size-4 shrink-0" aria-hidden />}
      >
        <ProjectDetailTagList items={client.competitorUrls} emptyLabel={tDetail("noCompetitors")} />
      </ProjectDetailInfoCard>
    </div>
  );
}
