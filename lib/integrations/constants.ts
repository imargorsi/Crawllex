export const GOOGLE_PROVIDER = "google" as const;

export const GOOGLE_INTEGRATION_SERVICES = ["gsc", "ga4"] as const;
export type TGoogleIntegrationService = (typeof GOOGLE_INTEGRATION_SERVICES)[number];

export const INTEGRATION_STATUSES = ["disconnected", "connected", "error"] as const;
export type TIntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export const ANALYTICS_SOURCES = ["gsc", "ga4"] as const;
export type TAnalyticsSource = (typeof ANALYTICS_SOURCES)[number];

export const ANALYTICS_DIMENSION_TYPES = [
  "query",
  "page",
  "country",
  "device",
  "landing_page",
  "channel_group",
  "event_name",
] as const;
export type TAnalyticsDimensionType = (typeof ANALYTICS_DIMENSION_TYPES)[number];

/** Top-N rows stored per dimension type per day. */
export const ANALYTICS_DIMENSION_TOP_N = 100;

/** Days to re-fetch on each incremental sync (covers GSC lag/revisions). */
export const ANALYTICS_INCREMENTAL_LOOKBACK_DAYS = 3;

/** Initial backfill window when an integration is first connected or property changes. */
export const ANALYTICS_BACKFILL_DAYS = 90;

/** Max inclusive day span for overview/dimensions read APIs. */
export const ANALYTICS_MAX_RANGE_DAYS = 366;

/** Manual refresh cooldown per project (ms). */
export const ANALYTICS_MANUAL_SYNC_COOLDOWN_MS = 60 * 60 * 1000;

/** Delay between project syncs to stay under Google quotas. */
export const ANALYTICS_SYNC_PROJECT_THROTTLE_MS = 500;
