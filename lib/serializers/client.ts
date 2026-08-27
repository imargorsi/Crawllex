import { resolveClientStatus } from "@/lib/clients/constants";
import { buildClientShareUrl } from "@/lib/clients/public-share-url";
import { serializeStoredImageUrl } from "@/lib/serializers/stored-image";
import type { TClientDetail, TClientListItem, TPublicClientView } from "@/types/client.types";
import type { ClientDocument } from "@/models/Client";

export function serializeClientListItem(client: ClientDocument): TClientListItem {
  return {
    id: client._id.toString(),
    businessName: client.businessName,
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
    websiteUrl: client.websiteUrl,
    businessAddress: client.businessAddress,
    logoImage: serializeStoredImageUrl(client.logoImage),
    pocContactNumber: client.pocContactNumber,
    pocEmail: client.pocEmail,
    servicesOffered: client.servicesOffered,
    primaryServiceToPromote: client.primaryServiceToPromote,
    idealCustomerProfile: client.idealCustomerProfile,
    targetLocations: client.targetLocations,
    seoGoals: client.seoGoals,
    competitorUrls: client.competitorUrls,
    shareToken: client.shareToken,
    shareUrl: buildClientShareUrl(client.shareToken),
    createdByUserId: client.createdByUserId.toString(),
    updatedByUserId: client.updatedByUserId?.toString() ?? null,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

export function serializePublicClient(client: ClientDocument): TPublicClientView {
  return {
    businessName: client.businessName,
    websiteUrl: client.websiteUrl,
    businessAddress: client.businessAddress,
    logoImage: serializeStoredImageUrl(client.logoImage),
    pocContactNumber: client.pocContactNumber,
    pocEmail: client.pocEmail,
    servicesOffered: client.servicesOffered,
    primaryServiceToPromote: client.primaryServiceToPromote,
    idealCustomerProfile: client.idealCustomerProfile,
    targetLocations: client.targetLocations,
    seoGoals: client.seoGoals,
    competitorUrls: client.competitorUrls,
  };
}
