export const CLIENT_PROJECT_TYPES = [
  "website",
  "mobile_application",
  "web_application",
  "other",
] as const;
export type TClientProjectType = (typeof CLIENT_PROJECT_TYPES)[number];

export const CLIENT_WEBSITE_FOCUS = ["business_website", "landing_page", "ecommerce"] as const;
export type TClientWebsiteFocus = (typeof CLIENT_WEBSITE_FOCUS)[number];

export const CLIENT_MOBILE_PLATFORMS = ["android", "ios"] as const;
export type TClientMobilePlatform = (typeof CLIENT_MOBILE_PLATFORMS)[number];

export const CLIENT_WEB_APP_TYPES = ["saas", "cms", "dashboard", "other"] as const;
export type TClientWebAppType = (typeof CLIENT_WEB_APP_TYPES)[number];

export const CLIENT_INTEGRATIONS = ["payment_gateway", "email", "sms", "ai", "other_api"] as const;
export type TClientIntegration = (typeof CLIENT_INTEGRATIONS)[number];

export const CLIENT_FILE_KINDS = ["image", "document"] as const;
export type TClientFileKind = (typeof CLIENT_FILE_KINDS)[number];

export const CLIENT_TEXTAREA_MAX = 4000;
export const CLIENT_FEATURE_NAME_MAX = 80;
export const CLIENT_FEATURE_WHAT_MIN = 10;
export const CLIENT_FEATURE_WHAT_MAX = 2000;
export const CLIENT_OTHER_MAX = 80;
export const CLIENT_MAX_FEATURES = 5;
export const CLIENT_MAX_LINKS = 10;
export const CLIENT_MAX_FILES = 10;
export const CLIENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const CLIENT_DOC_MAX_BYTES = 15 * 1024 * 1024;
export const CLIENT_FILES_MAX_BYTES = 100 * 1024 * 1024;

export function clientNeedsWebsiteFocus(types: readonly string[]): boolean {
  return types.includes("website");
}

export function clientNeedsMobilePlatforms(types: readonly string[]): boolean {
  return types.includes("mobile_application");
}

export function clientNeedsWebAppTypes(types: readonly string[]): boolean {
  return types.includes("web_application");
}

export function clientNeedsProjectTypeOther(types: readonly string[]): boolean {
  return types.includes("other");
}

export function clientNeedsWebAppTypeOther(types: readonly string[]): boolean {
  return types.includes("other");
}

export function clientNeedsIntegrationOther(values: readonly string[]): boolean {
  return values.includes("other_api");
}
