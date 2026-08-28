"use client";

import { useTranslation } from "react-i18next";

import {
  ProjectDetailField,
  ProjectDetailInfoCard,
  ProjectDetailTagList,
} from "@/components/projects/detail/project-detail-info-card";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { displayDetailValue } from "@/lib/frontend/projects/project-detail-display.utils";
import { clientHasExistingSystem } from "@/lib/clients/intake-constants";
import { elevatedCardMutedClass, elevatedCardTitleClass } from "@/lib/frontend/layout/dashboard-chrome";
import type { TPublicClientView } from "@/types/client.types";
import { cn } from "@/lib/utils";

type TClientIntakeSnapshotProps = {
  client: TPublicClientView;
};

function LongText({ value, empty }: { value: string | null | undefined; empty: string }) {
  return (
    <p className={cn("type-body whitespace-pre-wrap", value ? elevatedCardTitleClass : elevatedCardMutedClass)}>
      {displayDetailValue(value, empty)}
    </p>
  );
}

export function ClientIntakeSnapshot({ client }: TClientIntakeSnapshotProps) {
  const { t: tForm } = useTranslation("translation", { keyPrefix: "modules.clients.createForm" });
  const { t: tDetail } = useTranslation("translation", { keyPrefix: "modules.clients.detail" });
  const yesNo = (value: boolean) => (value ? tForm("yes") : tForm("no"));

  return (
    <div className="space-y-4">
      <ProjectDetailInfoCard
        title={tDetail("sectionClientTitle")}
        lead={tDetail("sectionClientLead")}
        icon={<Icons.briefcase className="size-4 shrink-0" aria-hidden />}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <ProjectDetailField label={tForm("contactPerson")} value={displayDetailValue(client.contactPerson)} />
          <ProjectDetailField label={tForm("pocEmail")} value={displayDetailValue(client.pocEmail)} />
          <ProjectDetailField label={tForm("pocContactNumber")} value={displayDetailValue(client.pocContactNumber)} />
        </div>
        <div className="mt-5 space-y-4">
          <ProjectDetailField
            label={tForm("businessSummary")}
            value={<LongText value={client.businessSummary} empty={tDetail("noValue")} />}
          />
          <ProjectDetailField
            label={tForm("idealCustomerProfile")}
            value={<LongText value={client.idealCustomerProfile} empty={tDetail("noValue")} />}
          />
        </div>
      </ProjectDetailInfoCard>

      <ProjectDetailInfoCard
        title={tDetail("sectionProjectTitle")}
        lead={tDetail("sectionProjectLead")}
        icon={<Icons.grid className="size-4 shrink-0" aria-hidden />}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <ProjectDetailField label={tForm("projectName")} value={displayDetailValue(client.projectName)} />
        </div>
        <div className="mt-5 space-y-4">
          <p className="type-caption text-text-secondary">{tForm("projectTypesLabel")}</p>
          <ProjectDetailTagList
            items={client.projectTypes.map((type) => tForm(`projectTypes.${type}`))}
            emptyLabel={tDetail("noProjectTypes")}
          />
          <p className="type-caption text-text-secondary">{tForm("platformsLabel")}</p>
          <ProjectDetailTagList
            items={client.platforms.map((platform) => tForm(`platforms.${platform}`))}
            emptyLabel={tDetail("noPlatforms")}
          />
          <ProjectDetailField
            label={tForm("projectDescription")}
            value={<LongText value={client.projectDescription} empty={tDetail("noValue")} />}
          />
        </div>
      </ProjectDetailInfoCard>

      <ProjectDetailInfoCard
        title={tDetail("sectionGoalsTitle")}
        lead={tDetail("sectionGoalsLead")}
        icon={<Icons.flag className="size-4 shrink-0" aria-hidden />}
      >
        <div className="space-y-4">
          <ProjectDetailField
            label={tForm("successLooksLike")}
            value={<LongText value={client.successLooksLike} empty={tDetail("noValue")} />}
          />
          <ProjectDetailField
            label={tForm("existingSystem")}
            value={tForm(`existingSystems.${client.existingSystem}`)}
          />
          {clientHasExistingSystem(client.existingSystem) ? (
            <>
              <ProjectDetailField label={tForm("websiteUrl")} value={displayDetailValue(client.websiteUrl)} />
              <ProjectDetailField
                label={tForm("changeNotes")}
                value={<LongText value={client.changeNotes} empty={tDetail("noValue")} />}
              />
            </>
          ) : null}
        </div>
      </ProjectDetailInfoCard>

      <ProjectDetailInfoCard
        title={tDetail("sectionScopeTitle")}
        lead={tDetail("sectionScopeLead")}
        icon={<Icons.file className="size-4 shrink-0" aria-hidden />}
      >
        <div className="space-y-4">
          <ProjectDetailField
            label={tForm("launchMustHaves")}
            value={<LongText value={client.launchMustHaves} empty={tDetail("noValue")} />}
          />
          <ProjectDetailField
            label={tForm("laterFeatures")}
            value={<LongText value={client.laterFeatures} empty={tDetail("noValue")} />}
          />
          <p className="type-caption text-text-secondary">{tForm("userRolesLabel")}</p>
          <ProjectDetailTagList
            items={client.userRoles.map((role) => tForm(`userRoles.${role}`))}
            emptyLabel={tDetail("noUserRoles")}
          />
        </div>
      </ProjectDetailInfoCard>

      <ProjectDetailInfoCard
        title={tDetail("sectionDeliveryTitle")}
        lead={tDetail("sectionDeliveryLead")}
        icon={<Icons.calendar className="size-4 shrink-0" aria-hidden />}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <ProjectDetailField label={tForm("rtlRequired")} value={yesNo(client.rtlRequired)} />
          <ProjectDetailField
            label={tForm("expectedLaunchDate")}
            value={displayDetailValue(client.expectedLaunchDate)}
          />
          <ProjectDetailField label={tForm("hasFixedDeadline")} value={yesNo(client.hasFixedDeadline)} />
          <ProjectDetailField
            label={tForm("contentReady")}
            value={tForm(`contentReadyOptions.${client.contentReady}`)}
          />
        </div>
        <div className="mt-5 space-y-4">
          <p className="type-caption text-text-secondary">{tForm("languagesLabel")}</p>
          <ProjectDetailTagList
            items={client.languages.map((language) => tForm(`languages.${language}`))}
            emptyLabel={tDetail("noLanguages")}
          />
        </div>
      </ProjectDetailInfoCard>
    </div>
  );
}
