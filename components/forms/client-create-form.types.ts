import type { TSeoGoal } from "@/lib/projects/constants";

export type TClientCreateFormValues = {
  businessName: string;
  websiteUrl: string;
  businessAddress: string;
  pocContactNumber: string;
  pocEmail: string;
  servicesOffered: string;
  primaryServiceToPromote: string;
  idealCustomerProfile: string;
  targetLocations: string;
  seoGoals: TSeoGoal[];
  competitorUrls: string;
};
