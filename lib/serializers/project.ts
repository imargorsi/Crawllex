import type { ProjectDocument } from "@/models/Project";
import { serializeStoredImageUrl } from "@/lib/serializers/stored-image";
import type {
  TProjectDetail,
  TProjectInvitee,
  TProjectListIntegrations,
  TProjectListItem,
  TProjectOwnerSummary,
} from "@/types/project.types";

export type ProjectListItemDto = TProjectListItem;
export type ProjectDetailDto = TProjectDetail;

const DEFAULT_LIST_INTEGRATIONS: TProjectListIntegrations = {
  gsc: "disconnected",
  ga4: "disconnected",
  wordpress: "disconnected",
};

function serializeTimestamp(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

/** Compact shape for project selector / list views. */
export function serializeProjectListItem(
  project: ProjectDocument,
  owner?: TProjectOwnerSummary | null,
  integrations?: TProjectListIntegrations | null,
): TProjectListItem {
  return {
    id: project._id.toString(),
    businessName: project.businessName,
    websiteUrl: project.websiteUrl,
    status: project.status,
    imageUrl: serializeStoredImageUrl(project.logoImage),
    owner: owner ?? null,
    createdByUserId: project.createdByUserId.toString(),
    integrations: integrations ?? DEFAULT_LIST_INTEGRATIONS,
  };
}

export function serializeProject(
  project: ProjectDocument,
  owner?: TProjectOwnerSummary | null,
  invitedUsers: TProjectInvitee[] = [],
): TProjectDetail {
  return {
    id: project._id.toString(),
    businessName: project.businessName,
    websiteUrl: project.websiteUrl,
    businessAddress: project.businessAddress,
    logoImage: serializeStoredImageUrl(project.logoImage),
    pocContactNumber: project.pocContactNumber,
    pocEmail: project.pocEmail,
    servicesOffered: project.servicesOffered,
    primaryServiceToPromote: project.primaryServiceToPromote,
    idealCustomerProfile: project.idealCustomerProfile,
    targetLocations: project.targetLocations,
    seoGoals: project.seoGoals,
    competitorUrls: project.competitorUrls,
    status: project.status,
    owner: owner ?? null,
    invitedUsers,
    createdByUserId: project.createdByUserId.toString(),
    approvedAt: serializeTimestamp(project.approvedAt),
    approvedByUserId: project.approvedByUserId?.toString() ?? null,
    rejectedAt: serializeTimestamp(project.rejectedAt),
    rejectedByUserId: project.rejectedByUserId?.toString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
