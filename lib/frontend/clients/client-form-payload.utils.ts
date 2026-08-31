import type { TCreateClientPayload, TUpdateClientPayload } from "@/features/clients/clients.api";
import type { TClientCreateFormValues } from "@/components/forms/client-create-form.types";
import { optionalText } from "@/lib/frontend/projects/project-form-payload.utils";
import { EMPTY_INTAKE_FEATURE } from "@/lib/frontend/clients/intake-ui.constants";
import {
  clientNeedsIntegrationOther,
  clientNeedsMobilePlatforms,
  clientNeedsProjectTypeOther,
  clientNeedsWebAppTypeOther,
  clientNeedsWebAppTypes,
  clientNeedsWebsiteFocus,
} from "@/lib/clients/intake-constants";
import type { TClientDetail } from "@/types/client.types";

export const EMPTY_CLIENT_FORM_VALUES: TClientCreateFormValues = {
  businessName: "",
  contactPerson: "",
  pocEmail: "",
  pocContactNumber: "",
  businessSummary: "",
  idealCustomerProfile: "",
  projectDescription: "",
  projectTypes: [],
  projectTypeOther: "",
  websiteFocus: [],
  mobilePlatforms: [],
  webAppTypes: [],
  webAppTypeOther: "",
  features: [{ ...EMPTY_INTAKE_FEATURE }],
  integrations: [],
  integrationOther: "",
  links: [],
  expectedLaunchDate: "",
  launchMustHaves: "",
  notes: "",
  requirementsConfirmed: false,
};

export function mapClientDetailToFormValues(client: TClientDetail): TClientCreateFormValues {
  const features =
    client.features.length > 0
      ? client.features.map((feature) => ({ name: feature.name, whatItDoes: feature.whatItDoes }))
      : [{ ...EMPTY_INTAKE_FEATURE }];

  return {
    businessName: client.businessName,
    contactPerson: client.contactPerson,
    pocEmail: client.pocEmail,
    pocContactNumber: client.pocContactNumber,
    businessSummary: client.businessSummary,
    idealCustomerProfile: client.idealCustomerProfile,
    projectDescription: client.projectDescription,
    projectTypes: client.projectTypes,
    projectTypeOther: client.projectTypeOther ?? "",
    websiteFocus: client.websiteFocus,
    mobilePlatforms: client.mobilePlatforms,
    webAppTypes: client.webAppTypes,
    webAppTypeOther: client.webAppTypeOther ?? "",
    features,
    integrations: client.integrations,
    integrationOther: client.integrationOther ?? "",
    links: client.links.map((link) => ({ linkName: link.linkName, url: link.url })),
    expectedLaunchDate: client.expectedLaunchDate ?? "",
    launchMustHaves: client.launchMustHaves,
    notes: client.notes ?? "",
    requirementsConfirmed: client.requirementsConfirmed,
  };
}

export function toCreateClientPayload(values: TClientCreateFormValues): TCreateClientPayload {
  const projectTypes = values.projectTypes;
  const websiteFocus = clientNeedsWebsiteFocus(projectTypes) ? values.websiteFocus : [];
  const mobilePlatforms = clientNeedsMobilePlatforms(projectTypes) ? values.mobilePlatforms : [];
  const webAppTypes = clientNeedsWebAppTypes(projectTypes) ? values.webAppTypes : [];
  const integrations = values.integrations;

  return {
    businessName: values.businessName.trim(),
    contactPerson: values.contactPerson.trim(),
    pocEmail: values.pocEmail.trim(),
    pocContactNumber: values.pocContactNumber.trim(),
    businessSummary: values.businessSummary.trim(),
    idealCustomerProfile: values.idealCustomerProfile.trim(),
    projectDescription: values.projectDescription.trim(),
    projectTypes,
    projectTypeOther: clientNeedsProjectTypeOther(projectTypes) ? values.projectTypeOther.trim() : null,
    websiteFocus,
    mobilePlatforms,
    webAppTypes,
    webAppTypeOther: clientNeedsWebAppTypeOther(webAppTypes) ? values.webAppTypeOther.trim() : null,
    features: values.features.map((feature) => ({
      name: feature.name.trim(),
      whatItDoes: feature.whatItDoes.trim(),
    })),
    integrations,
    integrationOther: clientNeedsIntegrationOther(integrations) ? values.integrationOther.trim() : null,
    links: values.links
      .filter((link) => link.linkName.trim() || link.url.trim())
      .map((link) => ({
        linkName: link.linkName.trim(),
        url: link.url.trim(),
      })),
    notes: optionalText(values.notes),
    expectedLaunchDate: optionalText(values.expectedLaunchDate),
    launchMustHaves: values.launchMustHaves.trim(),
    requirementsConfirmed: values.requirementsConfirmed,
  };
}

export function toUpdateClientPayload(
  values: TClientCreateFormValues,
  retainedFileIds: string[],
): TUpdateClientPayload {
  return {
    ...toCreateClientPayload(values),
    retainedFileIds,
  };
}
