"use client";

import { useTranslation } from "react-i18next";

import { ClientIntakeReadChips, useClientIntakeReadChips } from "@/components/clients/client-intake-read-chips";
import {
  IntakeFeatureRows,
  IntakeFileRows,
  IntakeLabeledBlock,
  IntakeLinkRows,
  IntakeOutlineField,
  IntakeProse,
} from "@/components/clients/client-intake-snapshot-parts";
import {
  ProjectDetailField,
  ProjectDetailInfoCard,
} from "@/components/projects/detail/project-detail-info-card";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { displayDetailValue } from "@/lib/frontend/projects/project-detail-display.utils";
import { formatIntakeDate } from "@/lib/frontend/clients/intake-ui.utils";
import {
  clientNeedsMobilePlatforms,
  clientNeedsWebAppTypes,
  clientNeedsWebsiteFocus,
} from "@/lib/clients/intake-constants";
import { elevatedCardTitleClass } from "@/lib/frontend/layout/dashboard-chrome";
import type { TClientFilePublic, TPublicClientView } from "@/types/client.types";
import { cn } from "@/lib/utils";

type TClientIntakeSnapshotProps = {
  client: TPublicClientView;
  files?: TClientFilePublic[];
  clientId?: string;
};

export function ClientIntakeSnapshot({
  client,
  files,
  clientId,
}: TClientIntakeSnapshotProps) {
  const { t: tForm } = useTranslation("translation", { keyPrefix: "modules.clients.createForm" });
  const { t: tDetail } = useTranslation("translation", { keyPrefix: "modules.clients.detail" });
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith("ar") ? "ar" : "en";
  const empty = tDetail("noValue");
  const { projectTypeItems, websiteFocusItems, mobileItems, webAppItems, integrationItems } =
    useClientIntakeReadChips(client);

  const hasFiles = files !== undefined;
  const storedFiles = files ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <div className="space-y-5">
        <ProjectDetailInfoCard
          title={tDetail("sectionClientTitle")}
          lead={tDetail("sectionClientLead")}
          icon={<Icons.briefcase className="size-4 shrink-0" aria-hidden />}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <ProjectDetailField label={tForm("contactPerson")} value={displayDetailValue(client.contactPerson)} />
            <ProjectDetailField label={tForm("pocContactNumber")} value={displayDetailValue(client.pocContactNumber)} />
            <ProjectDetailField
              className="sm:col-span-2"
              label={tForm("pocEmail")}
              value={displayDetailValue(client.pocEmail)}
            />
          </div>
          <div className="mt-6 space-y-5">
            <IntakeLabeledBlock label={tForm("businessSummary")}>
              <IntakeProse value={client.businessSummary} empty={empty} />
            </IntakeLabeledBlock>
            <IntakeLabeledBlock label={tForm("idealCustomerProfile")}>
              <IntakeProse value={client.idealCustomerProfile} empty={empty} />
            </IntakeLabeledBlock>
          </div>
        </ProjectDetailInfoCard>

        <ProjectDetailInfoCard
          title={tDetail("sectionAssetsTitle")}
          lead={hasFiles ? tDetail("sectionAssetsLead") : tDetail("sectionAssetsPublicLead")}
          icon={<Icons.file className="size-4 shrink-0" aria-hidden />}
        >
          <div className="space-y-6">
            {hasFiles ? <IntakeFileRows files={storedFiles} clientId={clientId} /> : null}
            <IntakeLinkRows links={client.links} />
          </div>
        </ProjectDetailInfoCard>

        <ProjectDetailInfoCard
          title={tDetail("sectionFeaturesTitle")}
          lead={tDetail("sectionFeaturesLead")}
          icon={<Icons.sparkles className="size-4 shrink-0" aria-hidden />}
        >
          <div className="space-y-6">
            <IntakeFeatureRows features={client.features} empty={empty} />
            <IntakeLabeledBlock label={tForm("integrationsLabel")}>
              <ClientIntakeReadChips items={integrationItems} emptyLabel={tDetail("noIntegrations")} />
            </IntakeLabeledBlock>
          </div>
        </ProjectDetailInfoCard>
      </div>

      <div className="space-y-5">
        <ProjectDetailInfoCard
          title={tDetail("sectionProjectTitle")}
          lead={tDetail("sectionProjectLead")}
          icon={<Icons.grid className="size-4 shrink-0" aria-hidden />}
        >
          <div className="space-y-6">
            <IntakeLabeledBlock label={tForm("buildingLabel")}>
              <ClientIntakeReadChips items={projectTypeItems} emptyLabel={tDetail("noProjectTypes")} layout="grid" />
            </IntakeLabeledBlock>
            {clientNeedsWebsiteFocus(client.projectTypes) ? (
              <IntakeLabeledBlock label={tForm("websiteFocusLabel")}>
                <ClientIntakeReadChips items={websiteFocusItems} emptyLabel={tDetail("noWebsiteFocus")} />
              </IntakeLabeledBlock>
            ) : null}
            {clientNeedsMobilePlatforms(client.projectTypes) ? (
              <IntakeLabeledBlock label={tForm("platformsMobileLabel")}>
                <ClientIntakeReadChips items={mobileItems} emptyLabel={tDetail("noMobilePlatforms")} />
              </IntakeLabeledBlock>
            ) : null}
            {clientNeedsWebAppTypes(client.projectTypes) ? (
              <IntakeLabeledBlock label={tForm("webAppTypeLabel")}>
                <ClientIntakeReadChips items={webAppItems} emptyLabel={tDetail("noWebAppTypes")} />
              </IntakeLabeledBlock>
            ) : null}
            <IntakeLabeledBlock label={tForm("projectDescription")}>
              <IntakeProse value={client.projectDescription} empty={empty} />
            </IntakeLabeledBlock>
          </div>
        </ProjectDetailInfoCard>

        <ProjectDetailInfoCard
          title={tDetail("sectionLaunchTitle")}
          lead={tDetail("sectionLaunchLead")}
          icon={<Icons.calendar className="size-4 shrink-0" aria-hidden />}
        >
          <div className="space-y-5">
            <IntakeOutlineField icon={<Icons.calendar className="size-4" />} label={tForm("expectedLaunchDate")}>
              <span className={cn("type-body-strong", elevatedCardTitleClass)}>
                {formatIntakeDate(client.expectedLaunchDate, locale, tDetail("noLaunchDate"))}
              </span>
            </IntakeOutlineField>
            <IntakeOutlineField icon={<Icons.tick className="size-4" />} label={tForm("launchMustHaves")}>
              <IntakeProse value={client.launchMustHaves} empty={empty} />
            </IntakeOutlineField>
            <IntakeOutlineField icon={<Icons.note className="size-4" />} label={tForm("notes")}>
              <IntakeProse value={client.notes} empty={empty} />
            </IntakeOutlineField>
          </div>
        </ProjectDetailInfoCard>
      </div>
    </div>
  );
}
