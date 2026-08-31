import type {
  TIntakeBuildType,
  TIntakeIntegration,
  TIntakeMobilePlatform,
  TIntakeWebAppType,
  TIntakeWebsiteFocus,
} from "@/lib/frontend/clients/intake-ui.constants";

export type TClientIntakeFeatureRow = {
  name: string;
  whatItDoes: string;
};

export type TClientIntakeLinkRow = {
  linkName: string;
  url: string;
};

export type TClientCreateFormValues = {
  businessName: string;
  contactPerson: string;
  pocEmail: string;
  pocContactNumber: string;
  businessSummary: string;
  idealCustomerProfile: string;
  projectDescription: string;
  projectTypes: TIntakeBuildType[];
  projectTypeOther: string;
  websiteFocus: TIntakeWebsiteFocus[];
  mobilePlatforms: TIntakeMobilePlatform[];
  webAppTypes: TIntakeWebAppType[];
  webAppTypeOther: string;
  features: TClientIntakeFeatureRow[];
  integrations: TIntakeIntegration[];
  integrationOther: string;
  links: TClientIntakeLinkRow[];
  expectedLaunchDate: string;
  launchMustHaves: string;
  notes: string;
  requirementsConfirmed: boolean;
};
