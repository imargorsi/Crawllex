import type {
  TClientContentReady,
  TClientExistingSystem,
  TClientLanguage,
  TClientPlatform,
  TClientProjectType,
  TClientUserRole,
} from "@/lib/clients/intake-constants";

export type TClientCreateFormValues = {
  businessName: string;
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
  existingSystem: TClientExistingSystem | "";
  websiteUrl: string;
  changeNotes: string;
  launchMustHaves: string;
  laterFeatures: string;
  userRoles: TClientUserRole[];
  languages: TClientLanguage[];
  rtlRequired: boolean;
  expectedLaunchDate: string;
  hasFixedDeadline: boolean;
  contentReady: TClientContentReady | "";
  requirementsConfirmed: boolean;
};
