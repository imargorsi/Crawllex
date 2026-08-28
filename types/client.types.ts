import type { TClientStatus } from "@/lib/clients/constants";
import type {
  TClientContentReady,
  TClientExistingSystem,
  TClientLanguage,
  TClientPlatform,
  TClientProjectType,
  TClientUserRole,
} from "@/lib/clients/intake-constants";

export type TClientListItem = {
  id: string;
  businessName: string;
  projectName: string;
  status: TClientStatus;
  websiteUrl: string | null;
  imageUrl: string | null;
  shareUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type TClientIntakeFields = {
  contactPerson: string;
  pocEmail: string;
  pocContactNumber: string;
  businessSummary: string;
  idealCustomerProfile: string;
  projectTypes: TClientProjectType[];
  platforms: TClientPlatform[];
  projectName: string;
  projectDescription: string;
  successLooksLike: string;
  existingSystem: TClientExistingSystem;
  websiteUrl: string | null;
  changeNotes: string | null;
  launchMustHaves: string;
  laterFeatures: string | null;
  userRoles: TClientUserRole[];
  languages: TClientLanguage[];
  rtlRequired: boolean;
  expectedLaunchDate: string | null;
  hasFixedDeadline: boolean;
  contentReady: TClientContentReady;
  requirementsConfirmed: boolean;
};

export type TClientDetail = TClientIntakeFields & {
  id: string;
  businessName: string;
  status: TClientStatus;
  logoImage: string | null;
  shareToken: string;
  shareUrl: string;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Public read-only snapshot — no admin ids or share token. */
export type TPublicClientView = TClientIntakeFields & {
  businessName: string;
  logoImage: string | null;
};
