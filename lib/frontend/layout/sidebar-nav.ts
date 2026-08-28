import type { TAppIconComponent } from "@/components/ui/app-icon";
import { Icons } from "@/lib/frontend/icons/app-icons";

export type SidebarNavLabelKey =
  | "dashboard"
  | "projects"
  | "clients"
  | "analytics"
  | "seoActivities"
  | "leads"
  | "users"
  | "rolesPermissions"
  | "settings";

export type SidebarNavGroupId = "general" | "reporting" | "settings";

export type SidebarNavItem = {
  path: string;
  labelKey: SidebarNavLabelKey;
  icon: TAppIconComponent;
  badge?: number;
  /** Extra path prefixes that mark this item active (e.g. `/permissions` for roles module). */
  matchPaths?: string[];
};

export type SidebarNavDefinition = SidebarNavItem & {
  /** `.view` permission required; `null` = always visible (e.g. settings). */
  viewPermission: string | null;
  permissionScope: "platform" | "project";
  group: SidebarNavGroupId;
};

export type SidebarNavGroup = {
  id: SidebarNavGroupId;
  items: SidebarNavItem[];
};

export const SIDEBAR_NAV_GROUP_ORDER: readonly SidebarNavGroupId[] = [
  "general",
  "reporting",
  "settings",
] as const;

/** Same nav for all roles — visibility is permission-driven. */
export const SIDEBAR_NAV_DEFINITIONS: readonly SidebarNavDefinition[] = [
  {
    path: "/dashboard",
    labelKey: "dashboard",
    icon: Icons.dashboard,
    viewPermission: "dashboard.view",
    permissionScope: "project",
    group: "general",
  },
  {
    path: "/projects",
    labelKey: "projects",
    icon: Icons.briefcase,
    viewPermission: null,
    permissionScope: "project",
    group: "general",
  },
  {
    path: "/clients",
    labelKey: "clients",
    icon: Icons.building,
    viewPermission: "clients.view",
    permissionScope: "platform",
    group: "general",
  },
  {
    path: "/users",
    labelKey: "users",
    icon: Icons.userSharing,
    viewPermission: "admin.users.view",
    permissionScope: "platform",
    group: "general",
  },
  {
    path: "/roles",
    labelKey: "rolesPermissions",
    icon: Icons.access,
    viewPermission: "admin.roles.view",
    permissionScope: "platform",
    group: "general",
  },
  {
    path: "/analytics",
    labelKey: "analytics",
    icon: Icons.analytics,
    viewPermission: "analytics.view",
    permissionScope: "project",
    group: "reporting",
  },
  {
    path: "/leads",
    labelKey: "leads",
    icon: Icons.userGroup,
    viewPermission: "leads.view",
    permissionScope: "project",
    group: "reporting",
  },
  {
    path: "/seo-activities",
    labelKey: "seoActivities",
    icon: Icons.rocket,
    viewPermission: "seo_activities.view",
    permissionScope: "project",
    group: "reporting",
  },
  {
    path: "/settings",
    labelKey: "settings",
    icon: Icons.settings,
    viewPermission: null,
    permissionScope: "platform",
    group: "settings",
  },
];

export function isSidebarNavItemActive(
  pathname: string,
  item: Pick<SidebarNavItem, "path" | "matchPaths">,
): boolean {
  const paths = [item.path, ...(item.matchPaths ?? [])];

  return paths.some((path) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}
