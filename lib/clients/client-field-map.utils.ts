import type { CreateClientInput, UpdateClientInput } from "@/schemas/client";
import { normalizeWebsiteUrl } from "@/lib/projects/website-url.utils";

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function mapCreateClientFields(input: CreateClientInput) {
  return {
    businessName: input.businessName.trim(),
    websiteUrl: normalizeWebsiteUrl(input.websiteUrl),
    businessAddress: emptyToNull(input.businessAddress),
    pocContactNumber: emptyToNull(input.pocContactNumber),
    pocEmail: emptyToNull(input.pocEmail)?.toLowerCase() ?? null,
    servicesOffered: input.servicesOffered ?? [],
    primaryServiceToPromote: emptyToNull(input.primaryServiceToPromote),
    idealCustomerProfile: emptyToNull(input.idealCustomerProfile),
    targetLocations: input.targetLocations ?? [],
    seoGoals: input.seoGoals ?? [],
    competitorUrls: input.competitorUrls ?? [],
  };
}

export function mapUpdateClientFields(
  input: UpdateClientInput,
  presentFields: ReadonlySet<string>,
): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  if (presentFields.has("businessName") && input.businessName !== undefined) {
    update.businessName = input.businessName.trim();
  }

  if (presentFields.has("websiteUrl") && input.websiteUrl !== undefined) {
    update.websiteUrl = normalizeWebsiteUrl(input.websiteUrl);
  }

  if (presentFields.has("businessAddress")) {
    update.businessAddress = emptyToNull(input.businessAddress);
  }

  if (presentFields.has("pocContactNumber")) {
    update.pocContactNumber = emptyToNull(input.pocContactNumber);
  }

  if (presentFields.has("pocEmail")) {
    update.pocEmail = emptyToNull(input.pocEmail)?.toLowerCase() ?? null;
  }

  if (presentFields.has("servicesOffered")) {
    update.servicesOffered = input.servicesOffered ?? [];
  }

  if (presentFields.has("primaryServiceToPromote")) {
    update.primaryServiceToPromote = emptyToNull(input.primaryServiceToPromote);
  }

  if (presentFields.has("idealCustomerProfile")) {
    update.idealCustomerProfile = emptyToNull(input.idealCustomerProfile);
  }

  if (presentFields.has("targetLocations")) {
    update.targetLocations = input.targetLocations ?? [];
  }

  if (presentFields.has("seoGoals")) {
    update.seoGoals = input.seoGoals ?? [];
  }

  if (presentFields.has("competitorUrls")) {
    update.competitorUrls = input.competitorUrls ?? [];
  }

  return update;
}
