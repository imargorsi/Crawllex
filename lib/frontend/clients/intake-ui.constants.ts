export {
  CLIENT_PROJECT_TYPES as INTAKE_BUILD_TYPES,
  CLIENT_WEBSITE_FOCUS as INTAKE_WEBSITE_FOCUS,
  CLIENT_MOBILE_PLATFORMS as INTAKE_MOBILE_PLATFORMS,
  CLIENT_WEB_APP_TYPES as INTAKE_WEB_APP_TYPES,
  CLIENT_INTEGRATIONS as INTAKE_INTEGRATIONS,
  CLIENT_TEXTAREA_MAX as INTAKE_TEXTAREA_MAX,
  CLIENT_FEATURE_NAME_MAX as INTAKE_FEATURE_NAME_MAX,
  CLIENT_FEATURE_WHAT_MIN as INTAKE_FEATURE_WHAT_MIN,
  CLIENT_FEATURE_WHAT_MAX as INTAKE_FEATURE_WHAT_MAX,
  CLIENT_OTHER_MAX as INTAKE_OTHER_MAX,
  CLIENT_MAX_FEATURES as INTAKE_MAX_FEATURES,
  CLIENT_MAX_LINKS as INTAKE_MAX_LINKS,
  CLIENT_MAX_FILES as INTAKE_MAX_FILES,
  CLIENT_IMAGE_MAX_BYTES as INTAKE_IMAGE_MAX_BYTES,
  CLIENT_DOC_MAX_BYTES as INTAKE_DOC_MAX_BYTES,
  CLIENT_FILES_MAX_BYTES as INTAKE_CLIENT_MAX_BYTES,
  clientNeedsWebsiteFocus as intakeNeedsWebsiteFocus,
  clientNeedsMobilePlatforms as intakeNeedsMobilePlatforms,
  clientNeedsWebAppTypes as intakeNeedsWebAppTypes,
  clientNeedsProjectTypeOther as intakeNeedsProjectTypeOther,
  type TClientProjectType as TIntakeBuildType,
  type TClientWebsiteFocus as TIntakeWebsiteFocus,
  type TClientMobilePlatform as TIntakeMobilePlatform,
  type TClientWebAppType as TIntakeWebAppType,
  type TClientIntegration as TIntakeIntegration,
} from "@/lib/clients/intake-constants";

export const INTAKE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const INTAKE_DOC_ACCEPT =
  "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const INTAKE_FILE_ACCEPT = `${INTAKE_IMAGE_ACCEPT},${INTAKE_DOC_ACCEPT},.jpg,.jpeg,.png,.webp,.gif,.pdf,.docx`;

export const EMPTY_INTAKE_FEATURE = { name: "", whatItDoes: "" } as const;
export const EMPTY_INTAKE_LINK = { linkName: "", url: "" } as const;
