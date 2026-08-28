export const CLIENT_PROJECT_TYPES = [
  "website",
  "ecommerce",
  "web_application",
  "mobile_application",
  "saas",
  "custom_software",
  "other",
] as const;
export type TClientProjectType = (typeof CLIENT_PROJECT_TYPES)[number];

export const CLIENT_WEBSITE_PLATFORMS = ["desktop", "mobile_responsive"] as const;
export const CLIENT_MOBILE_PLATFORMS = ["android", "ios", "both_mobile"] as const;
export const CLIENT_WEB_APP_PLATFORMS = ["web", "admin_dashboard", "user_portal", "vendor_portal"] as const;

export const CLIENT_PLATFORMS = [
  ...CLIENT_WEBSITE_PLATFORMS,
  ...CLIENT_MOBILE_PLATFORMS,
  ...CLIENT_WEB_APP_PLATFORMS,
] as const;
export type TClientPlatform = (typeof CLIENT_PLATFORMS)[number];

export const CLIENT_EXISTING_SYSTEMS = ["none", "website", "mobile_app", "software", "multiple"] as const;
export type TClientExistingSystem = (typeof CLIENT_EXISTING_SYSTEMS)[number];

export const CLIENT_USER_ROLES = ["admin", "customer", "employee", "vendor", "other"] as const;
export type TClientUserRole = (typeof CLIENT_USER_ROLES)[number];

export const CLIENT_LANGUAGES = ["english", "arabic", "other"] as const;
export type TClientLanguage = (typeof CLIENT_LANGUAGES)[number];

export const CLIENT_CONTENT_READY = ["complete", "partial", "not_ready"] as const;
export type TClientContentReady = (typeof CLIENT_CONTENT_READY)[number];

export const CLIENT_WEBSITE_PROJECT_TYPES: readonly TClientProjectType[] = ["website", "ecommerce"];
export const CLIENT_MOBILE_PROJECT_TYPES: readonly TClientProjectType[] = ["mobile_application"];
export const CLIENT_WEB_APP_PROJECT_TYPES: readonly TClientProjectType[] = [
  "web_application",
  "saas",
  "custom_software",
  "other",
];

export function clientNeedsWebsitePlatforms(types: readonly string[]): boolean {
  return CLIENT_WEBSITE_PROJECT_TYPES.some((type) => types.includes(type));
}

export function clientNeedsMobilePlatforms(types: readonly string[]): boolean {
  return CLIENT_MOBILE_PROJECT_TYPES.some((type) => types.includes(type));
}

export function clientNeedsWebAppPlatforms(types: readonly string[]): boolean {
  return CLIENT_WEB_APP_PROJECT_TYPES.some((type) => types.includes(type));
}

export function clientHasExistingSystem(value: TClientExistingSystem | null | undefined): boolean {
  return Boolean(value && value !== "none");
}
