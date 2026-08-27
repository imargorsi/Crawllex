import type { TClientStatus } from "@/lib/clients/constants";
import type { TSeoGoal } from "@/lib/projects/constants";

export type TClientListItem = {
  id: string;
  businessName: string;
  status: TClientStatus;
  websiteUrl: string;
  imageUrl: string | null;
  shareUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type TClientDetail = {
  id: string;
  businessName: string;
  status: TClientStatus;
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
  shareToken: string;
  shareUrl: string;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Public read-only snapshot — no admin ids or share token. */
export type TPublicClientView = {
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
};
