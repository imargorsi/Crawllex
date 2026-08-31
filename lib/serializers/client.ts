import { resolveClientStatus } from "@/lib/clients/constants";
import { buildClientShareUrl } from "@/lib/clients/public-share-url";
import { serializeStoredImageUrl } from "@/lib/serializers/stored-image";
import type {
  TClientDetail,
  TClientFilePublic,
  TClientIntakeFields,
  TClientListItem,
  TPublicClientView,
} from "@/types/client.types";
import type { ClientDocument } from "@/models/Client";

function serializeFiles(client: ClientDocument): TClientFilePublic[] {
  return (client.files ?? []).map((file) => ({
    id: file.id,
    originalName: file.originalName,
    sizeBytes: file.sizeBytes,
    kind: file.kind,
  }));
}

function serializeIntake(client: ClientDocument): TClientIntakeFields {
  return {
    contactPerson: client.contactPerson ?? "",
    pocEmail: client.pocEmail ?? "",
    pocContactNumber: client.pocContactNumber ?? "",
    businessSummary: client.businessSummary ?? "",
    idealCustomerProfile: client.idealCustomerProfile ?? "",
    projectDescription: client.projectDescription ?? "",
    projectTypes: [...(client.projectTypes ?? [])],
    projectTypeOther: client.projectTypeOther ?? null,
    websiteFocus: [...(client.websiteFocus ?? [])],
    mobilePlatforms: [...(client.mobilePlatforms ?? [])],
    webAppTypes: [...(client.webAppTypes ?? [])],
    webAppTypeOther: client.webAppTypeOther ?? null,
    features: (client.features ?? []).map((feature) => ({
      name: feature.name,
      whatItDoes: feature.whatItDoes,
    })),
    integrations: [...(client.integrations ?? [])],
    integrationOther: client.integrationOther ?? null,
    links: (client.links ?? []).map((link) => ({
      linkName: link.linkName,
      url: link.url,
    })),
    notes: client.notes ?? null,
    expectedLaunchDate: client.expectedLaunchDate ?? null,
    launchMustHaves: client.launchMustHaves ?? "",
    requirementsConfirmed: Boolean(client.requirementsConfirmed),
  };
}

export function serializeClientListItem(client: ClientDocument): TClientListItem {
  return {
    id: client._id.toString(),
    businessName: client.businessName,
    contactPerson: client.contactPerson ?? "",
    status: resolveClientStatus(client.status),
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
    files: serializeFiles(client),
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
