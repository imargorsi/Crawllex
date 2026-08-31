import type { TClientStatus } from "@/lib/clients/constants";
import type {
  TClientFileKind,
  TClientIntegration,
  TClientMobilePlatform,
  TClientProjectType,
  TClientWebAppType,
  TClientWebsiteFocus,
} from "@/lib/clients/intake-constants";

export type TClientListItem = {
  id: string;
  businessName: string;
  contactPerson: string;
  status: TClientStatus;
  imageUrl: string | null;
  shareUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type TClientFeature = {
  name: string;
  whatItDoes: string;
};

export type TClientLink = {
  linkName: string;
  url: string;
};

/** Admin-visible file metadata — no blob path or download URL. */
export type TClientFilePublic = {
  id: string;
  originalName: string;
  sizeBytes: number;
  kind: TClientFileKind;
};

export type TClientIntakeFields = {
  contactPerson: string;
  pocEmail: string;
  pocContactNumber: string;
  businessSummary: string;
  idealCustomerProfile: string;
  projectDescription: string;
  projectTypes: TClientProjectType[];
  projectTypeOther: string | null;
  websiteFocus: TClientWebsiteFocus[];
  mobilePlatforms: TClientMobilePlatform[];
  webAppTypes: TClientWebAppType[];
  webAppTypeOther: string | null;
  features: TClientFeature[];
  integrations: TClientIntegration[];
  integrationOther: string | null;
  links: TClientLink[];
  notes: string | null;
  expectedLaunchDate: string | null;
  launchMustHaves: string;
  requirementsConfirmed: boolean;
};

export type TClientDetail = TClientIntakeFields & {
  id: string;
  businessName: string;
  status: TClientStatus;
  logoImage: string | null;
  files: TClientFilePublic[];
  shareToken: string;
  shareUrl: string;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Public read-only snapshot — no admin ids, share token, or file URLs. */
export type TPublicClientView = TClientIntakeFields & {
  businessName: string;
  logoImage: string | null;
};
