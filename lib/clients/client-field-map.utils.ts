import type { CreateClientInput, UpdateClientInput } from "@/schemas/client";
import {
  clientNeedsIntegrationOther,
  clientNeedsMobilePlatforms,
  clientNeedsProjectTypeOther,
  clientNeedsWebAppTypeOther,
  clientNeedsWebAppTypes,
  clientNeedsWebsiteFocus,
} from "@/lib/clients/intake-constants";

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function mapCreateClientFields(input: CreateClientInput) {
  const projectTypes = input.projectTypes;
  const websiteFocus = clientNeedsWebsiteFocus(projectTypes) ? (input.websiteFocus ?? []) : [];
  const mobilePlatforms = clientNeedsMobilePlatforms(projectTypes) ? (input.mobilePlatforms ?? []) : [];
  const webAppTypes = clientNeedsWebAppTypes(projectTypes) ? (input.webAppTypes ?? []) : [];
  const integrations = input.integrations ?? [];
  const links = input.links ?? [];

  return {
    businessName: input.businessName.trim(),
    contactPerson: input.contactPerson.trim(),
    pocEmail: input.pocEmail.toLowerCase(),
    pocContactNumber: input.pocContactNumber.trim(),
    businessSummary: input.businessSummary.trim(),
    idealCustomerProfile: input.idealCustomerProfile.trim(),
    projectDescription: input.projectDescription.trim(),
    projectTypes,
    projectTypeOther: clientNeedsProjectTypeOther(projectTypes) ? emptyToNull(input.projectTypeOther) : null,
    websiteFocus,
    mobilePlatforms,
    webAppTypes,
    webAppTypeOther: clientNeedsWebAppTypeOther(webAppTypes) ? emptyToNull(input.webAppTypeOther) : null,
    features: input.features.map((feature) => ({
      name: feature.name.trim(),
      whatItDoes: feature.whatItDoes.trim(),
    })),
    integrations,
    integrationOther: clientNeedsIntegrationOther(integrations) ? emptyToNull(input.integrationOther) : null,
    links: links.map((link) => ({
      linkName: link.linkName.trim(),
      url: link.url.trim(),
    })),
    notes: emptyToNull(input.notes),
    expectedLaunchDate: emptyToNull(input.expectedLaunchDate),
    launchMustHaves: input.launchMustHaves.trim(),
    requirementsConfirmed: input.requirementsConfirmed,
  };
}

export function mapUpdateClientFields(input: UpdateClientInput) {
  return mapCreateClientFields(input);
}
