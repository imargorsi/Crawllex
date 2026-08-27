export const DASHBOARD_WORKSPACE_STORAGE_KEY = "dashboard-workspace";

export const DASHBOARD_WORKSPACES = ["seo", "onboarding"] as const;
export type TDashboardWorkspace = (typeof DASHBOARD_WORKSPACES)[number];

export const DEFAULT_DASHBOARD_WORKSPACE: TDashboardWorkspace = "seo";

export function isDashboardWorkspace(value: string | null | undefined): value is TDashboardWorkspace {
  return value === "seo" || value === "onboarding";
}

export function workspaceFromPathname(pathname: string): TDashboardWorkspace | null {
  if (pathname === "/clients" || pathname.startsWith("/clients/")) {
    return "onboarding";
  }

  if (
    pathname === "/dashboard" ||
    pathname === "/projects" ||
    pathname.startsWith("/projects/") ||
    pathname === "/analytics" ||
    pathname.startsWith("/analytics/") ||
    pathname === "/leads" ||
    pathname.startsWith("/leads/") ||
    pathname === "/seo-activities" ||
    pathname.startsWith("/seo-activities/") ||
    pathname === "/users" ||
    pathname.startsWith("/users/") ||
    pathname === "/roles" ||
    pathname.startsWith("/roles/")
  ) {
    return "seo";
  }

  return null;
}

export function readStoredWorkspace(): TDashboardWorkspace {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_WORKSPACE;
  try {
    const stored = window.localStorage.getItem(DASHBOARD_WORKSPACE_STORAGE_KEY);
    return isDashboardWorkspace(stored) ? stored : DEFAULT_DASHBOARD_WORKSPACE;
  } catch {
    return DEFAULT_DASHBOARD_WORKSPACE;
  }
}

export function writeStoredWorkspace(workspace: TDashboardWorkspace): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DASHBOARD_WORKSPACE_STORAGE_KEY, workspace);
  } catch {
    /* no-op */
  }
}

export function defaultPathForWorkspace(workspace: TDashboardWorkspace): string {
  return workspace === "onboarding" ? "/clients" : "/dashboard";
}

/**
 * Pathname wins as soon as it maps (including `/clients` before auth loads) so the
 * sidebar does not flash SEO chrome. Optimistic covers the Super Admin toggle until
 * the destination route mounts. `/settings` is unmapped and uses stored mode.
 */
export function resolveDashboardWorkspace(input: {
  pathname: string;
  stored: TDashboardWorkspace;
  canSwitchWorkspace: boolean;
  optimistic?: TDashboardWorkspace | null;
}): TDashboardWorkspace {
  const fromPath = workspaceFromPathname(input.pathname);

  if (input.optimistic && input.optimistic !== fromPath) {
    return input.optimistic;
  }

  if (fromPath) return fromPath;
  if (!input.canSwitchWorkspace) return DEFAULT_DASHBOARD_WORKSPACE;
  return input.stored;
}
