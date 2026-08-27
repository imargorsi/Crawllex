import type { ProjectStatus, TSeoGoal } from "@/lib/projects/constants";
import type { TIntegrationStatus } from "@/lib/integrations/constants";

export type TProjectOwnerSummary = {
  id: string;
  name: string;
  profileImage: string | null;
};

/** Compact GSC / GA4 / WordPress link state for project list — not the full Settings DTO. */
export type TProjectListIntegrations = {
  gsc: TIntegrationStatus;
  ga4: TIntegrationStatus;
  wordpress: TIntegrationStatus;
};

export type TProjectInvitee = {
  id: string;
  userId: string;
  name: string;
  email: string;
  profileImage: string | null;
  status: "invited" | "active";
  invitedByUserId: string | null;
};

export type TProjectListItem = {
  id: string;
  businessName: string;
  websiteUrl: string;
  status: ProjectStatus;
  imageUrl: string | null;
  owner: TProjectOwnerSummary | null;
  createdByUserId: string;
  integrations: TProjectListIntegrations;
};

export type TProjectDetail = {
  id: string;
  businessName: string;
  websiteUrl: string;
  businessAddress: string | null;
  logoImage: string | null;
  pocContactNumber: string | null;
  pocEmail: string | null;
  servicesOffered: string[];
  primaryServiceToPromote: string | null;
  idealCustomerProfile: string | null;
  targetLocations: string[];
  seoGoals: TSeoGoal[];
  competitorUrls: string[];
  status: ProjectStatus;
  owner: TProjectOwnerSummary | null;
  /** Pending invites + active project_user members for invite UI. */
  invitedUsers: TProjectInvitee[];
  createdByUserId: string;
  approvedAt: string | null;
  approvedByUserId: string | null;
  rejectedAt: string | null;
  rejectedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TProjectOwnerRef = Pick<TProjectDetail, "owner" | "createdByUserId">;

export type TProjectListOwnerRef = Pick<TProjectListItem, "owner" | "createdByUserId">;
