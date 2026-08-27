import { hasAnyPermission } from "@/lib/rbac/access";
import { permissionsForScope } from "@/lib/rbac/scope-permissions";

/** Routes any authenticated user may open (outside RBAC). */
export const AUTH_ONLY_ROUTE_PREFIXES = [
  "/edit-profile",
  "/settings",
  "/projects",
  "/email-verification",
  "/debug",
] as const;

export type RouteAccessRule = {
  pattern: RegExp;
  viewPermissions: readonly string[];
  scope: "platform" | "project";
};

export const ROUTE_ACCESS_RULES: readonly RouteAccessRule[] = [
  { pattern: /^\/users(?:\/|$)/, viewPermissions: ["admin.users.view"], scope: "platform" },
  { pattern: /^\/roles(?:\/|$)/, viewPermissions: ["admin.roles.view"], scope: "platform" },
  { pattern: /^\/clients(?:\/|$)/, viewPermissions: ["clients.view"], scope: "platform" },
  { pattern: /^\/dashboard$/, viewPermissions: ["dashboard.view"], scope: "project" },
  { pattern: /^\/projects(?:\/|$)/, viewPermissions: ["projects.view"], scope: "project" },
  { pattern: /^\/analytics(?:\/|$)/, viewPermissions: ["analytics.view"], scope: "project" },
  { pattern: /^\/seo-activities(?:\/|$)/, viewPermissions: ["seo_activities.view"], scope: "project" },
  { pattern: /^\/leads(?:\/|$)/, viewPermissions: ["leads.view"], scope: "project" },
];

export function isAuthOnlyRoute(pathname: string): boolean {
  return AUTH_ONLY_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function canAccessRoute(
  pathname: string,
  platformPermissions: readonly string[],
  projectPermissions: readonly string[],
  roles: readonly string[],
): boolean {
  if (isAuthOnlyRoute(pathname)) return true;

  const rule = ROUTE_ACCESS_RULES.find((entry) => entry.pattern.test(pathname));
  if (!rule) return true;

  const permissions = permissionsForScope(
    rule.scope,
    platformPermissions,
    projectPermissions,
    roles,
  );
  return hasAnyPermission(permissions, rule.viewPermissions);
}

export function resolveDefaultAccessiblePath(
  platformPermissions: readonly string[],
  projectPermissions: readonly string[],
  roles: readonly string[],
): string {
  const projectRoutes: { path: string; permission: string }[] = [
    { path: "/dashboard", permission: "dashboard.view" },
    { path: "/projects", permission: "projects.view" },
    { path: "/analytics", permission: "analytics.view" },
    { path: "/seo-activities", permission: "seo_activities.view" },
    { path: "/leads", permission: "leads.view" },
  ];

  for (const route of projectRoutes) {
    const permissions = permissionsForScope(
      "project",
      platformPermissions,
      projectPermissions,
      roles,
    );
    if (hasAnyPermission(permissions, [route.permission])) {
      return route.path;
    }
  }

  return "/projects";
}
