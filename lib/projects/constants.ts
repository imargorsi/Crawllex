export const PROJECT_STATUSES = ["pending", "active", "inactive", "rejected"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_MEMBER_STATUSES = ["active", "invited", "removed"] as const;
export type ProjectMemberStatus = (typeof PROJECT_MEMBER_STATUSES)[number];

/** Locked v1 SEO goals — Module 2 onboarding (multi-select). Single source of truth for API + UI. */
export const SEO_GOALS = [
  "grow_brand_awareness",
  "outrank_competitors",
  "get_more_calls",
  "increase_online_orders",
  "improve_local_visibility",
] as const;

export type TSeoGoal = (typeof SEO_GOALS)[number];

/** Only `active` projects grant module permissions to members. */
export function isActiveProjectStatus(status: string): status is ProjectStatus {
  return status === "active";
}

/**
 * Sidebar project selector: `active` and `pending` only.
 * Inactive and rejected stay on the Projects list but cannot be chosen for module work.
 */
export function isSelectableProjectStatus(status: string): boolean {
  return status === "active" || status === "pending";
}

/** API + UI copy when a regular user already owns a pending project. */
export const PENDING_PROJECT_LIMIT_MESSAGE = "You already have a project awaiting approval.";

export function isSeoGoal(value: string): value is TSeoGoal {
  return (SEO_GOALS as readonly string[]).includes(value);
}
