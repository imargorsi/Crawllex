import { resolveClientStatus } from "@/lib/clients/constants";
import { buildClientShareUrl } from "@/lib/clients/public-share-url";
import { serializeStoredImageUrl } from "@/lib/serializers/stored-image";
import type { TClientDetail, TClientIntakeFields, TClientListItem, TPublicClientView } from "@/types/client.types";
import type { ClientDocument } from "@/models/Client";

function serializeIntake(client: ClientDocument): TClientIntakeFields {
  return {
    contactPerson: client.contactPerson ?? "",
    pocEmail: client.pocEmail ?? "",
    pocContactNumber: client.pocContactNumber ?? "",
    businessSummary: client.businessSummary ?? "",
    idealCustomerProfile: client.idealCustomerProfile ?? "",
    projectTypes: [...(client.projectTypes ?? [])],
    platforms: [...(client.platforms ?? [])],
    projectName: client.projectName ?? "",
    projectDescription: client.projectDescription ?? "",
    successLooksLike: client.successLooksLike ?? "",
    existingSystem: client.existingSystem ?? "none",
    websiteUrl: client.websiteUrl ?? null,
    changeNotes: client.changeNotes ?? null,
    launchMustHaves: client.launchMustHaves ?? "",
    laterFeatures: client.laterFeatures ?? null,
    userRoles: [...(client.userRoles ?? [])],
    languages: [...(client.languages ?? [])],
    rtlRequired: Boolean(client.rtlRequired),
    expectedLaunchDate: client.expectedLaunchDate ?? null,
    hasFixedDeadline: Boolean(client.hasFixedDeadline),
    contentReady: client.contentReady ?? "not_ready",
    requirementsConfirmed: Boolean(client.requirementsConfirmed),
  };
}

export function serializeClientListItem(client: ClientDocument): TClientListItem {
  return {
    id: client._id.toString(),
    businessName: client.businessName,
    projectName: client.projectName ?? "",
    status: resolveClientStatus(client.status),
    websiteUrl: client.websiteUrl,
    imageUrl: serializeStoredImageUrl(client.logoImage),
    shareUrl: buildClientShareUrl(client.shareToken),
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

export function serializeClient(client: ClientDocument): TClientDetail {
  return {
    id: client._id.toString(),
    businessName: client.businessName,
    status: resolveClientStatus(client.status),
    logoImage: serializeStoredImageUrl(client.logoImage),
    shareToken: client.shareToken,
    shareUrl: buildClientShareUrl(client.shareToken),
    createdByUserId: client.createdByUserId.toString(),
    updatedByUserId: client.updatedByUserId?.toString() ?? null,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    ...serializeIntake(client),
  };
}

export function serializePublicClient(client: ClientDocument): TPublicClientView {
  return {
    businessName: client.businessName,
    logoImage: serializeStoredImageUrl(client.logoImage),
    ...serializeIntake(client),
  };
}
