import type { TCreateClientPayload, TUpdateClientPayload } from "@/features/clients/clients.api";
import type { TClientCreateFormValues } from "@/components/forms/client-create-form.types";
import {
  optionalPhone,
  optionalText,
  splitCommaSeparated,
} from "@/lib/frontend/projects/project-form-payload.utils";
import { normalizeWebsiteUrl } from "@/lib/projects/website-url.utils";
import type { TClientDetail } from "@/types/client.types";

function joinCommaSeparated(values: string[]): string {
  return values.filter(Boolean).join(", ");
}

export const EMPTY_CLIENT_FORM_VALUES: TClientCreateFormValues = {
  businessName: "",
  websiteUrl: "",
  businessAddress: "",
  pocContactNumber: "",
  pocEmail: "",
  servicesOffered: "",
  primaryServiceToPromote: "",
  idealCustomerProfile: "",
  targetLocations: "",
  seoGoals: [],
  competitorUrls: "",
};

export function mapClientDetailToFormValues(client: TClientDetail): TClientCreateFormValues {
  return {
    businessName: client.businessName,
    websiteUrl: client.websiteUrl,
    businessAddress: client.businessAddress ?? "",
    pocContactNumber: client.pocContactNumber ?? "",
    pocEmail: client.pocEmail ?? "",
    servicesOffered: joinCommaSeparated(client.servicesOffered),
    primaryServiceToPromote: client.primaryServiceToPromote ?? "",
    idealCustomerProfile: client.idealCustomerProfile ?? "",
    targetLocations: joinCommaSeparated(client.targetLocations),
    seoGoals: [...client.seoGoals],
    competitorUrls: joinCommaSeparated(client.competitorUrls),
  };
}

export function toCreateClientPayload(values: TClientCreateFormValues): TCreateClientPayload {
  return {
    businessName: values.businessName.trim(),
    websiteUrl: normalizeWebsiteUrl(values.websiteUrl),
    businessAddress: optionalText(values.businessAddress),
    pocContactNumber: optionalPhone(values.pocContactNumber),
    pocEmail: optionalText(values.pocEmail),
    servicesOffered: splitCommaSeparated(values.servicesOffered),
    primaryServiceToPromote: optionalText(values.primaryServiceToPromote),
    idealCustomerProfile: optionalText(values.idealCustomerProfile),
    targetLocations: splitCommaSeparated(values.targetLocations),
    seoGoals: values.seoGoals,
    competitorUrls: splitCommaSeparated(values.competitorUrls),
  };
}

export function toUpdateClientPayload(values: TClientCreateFormValues): TUpdateClientPayload {
  return toCreateClientPayload(values);
}
