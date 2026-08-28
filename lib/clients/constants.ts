export const CLIENT_STATUSES = ["active", "inactive"] as const;
export type TClientStatus = (typeof CLIENT_STATUSES)[number];

export const DEFAULT_CLIENT_STATUS: TClientStatus = "active";

export function isClientStatus(value: string): value is TClientStatus {
  return (CLIENT_STATUSES as readonly string[]).includes(value);
}

export function resolveClientStatus(value: string | null | undefined): TClientStatus {
  return value === "inactive" ? "inactive" : "active";
}

/** Plaintext public share tokens start with this prefix so operators can recognize them. */
export const CLIENT_SHARE_TOKEN_PREFIX = "clx_ob_" as const;

/** Random bytes after the prefix (hex-encoded). */
export const CLIENT_SHARE_TOKEN_BYTES = 24;

/** Public GET rate limit per IP per minute. */
export const CLIENT_PUBLIC_VIEW_RATE_MAX = 30;

export const CLIENT_SHARE_TOKEN_UNAVAILABLE_MESSAGE = "This onboarding page is not available.";
