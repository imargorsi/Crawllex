import type { SidebarNavGroup, SidebarNavItem, SidebarProjectFlags } from "@/lib/frontend/layout/sidebar-nav";
import {
  SIDEBAR_NAV_DEFINITIONS,
  SIDEBAR_NAV_GROUP_ORDER,
} from "@/lib/frontend/layout/sidebar-nav";
import { hasAnyPermission } from "@/lib/rbac/access";
import { permissionsForScope } from "@/lib/rbac/scope-permissions";

function isNavDefinitionVisible(
  item: (typeof SIDEBAR_NAV_DEFINITIONS)[number],
  platformPermissions: readonly string[],
  projectPermissions: readonly string[],
  roles: readonly string[],
  flags: SidebarProjectFlags,
): boolean {
  if (item.requiresLensEnrollment && !flags.lensEnrolled) return false;
  if (item.viewPermission === null) return true;

  const permissions = permissionsForScope(
    item.permissionScope,
    platformPermissions,
    projectPermissions,
    roles,
  );

  return hasAnyPermission(permissions, [item.viewPermission]);
}

function toSidebarNavItem(
  item: (typeof SIDEBAR_NAV_DEFINITIONS)[number],
): SidebarNavItem {
  const { viewPermission: _viewPermission, permissionScope: _scope, group: _group, ...navItem } =
    item;
  return navItem;
}

export function buildSidebarNavItems(
  platformPermissions: readonly string[],
  projectPermissions: readonly string[],
  roles: readonly string[],
  flags: SidebarProjectFlags = { lensEnrolled: false },
): SidebarNavItem[] {
  return SIDEBAR_NAV_DEFINITIONS.filter((item) =>
    isNavDefinitionVisible(item, platformPermissions, projectPermissions, roles, flags),
  ).map(toSidebarNavItem);
}

export function buildSidebarNavGroups(
  platformPermissions: readonly string[],
  projectPermissions: readonly string[],
  roles: readonly string[],
  flags: SidebarProjectFlags = { lensEnrolled: false },
): SidebarNavGroup[] {
  const visible = SIDEBAR_NAV_DEFINITIONS.filter((item) =>
    isNavDefinitionVisible(item, platformPermissions, projectPermissions, roles, flags),
  );

  return SIDEBAR_NAV_GROUP_ORDER.map((groupId) => ({
    id: groupId,
    items: visible.filter((item) => item.group === groupId).map(toSidebarNavItem),
  })).filter((group) => group.items.length > 0);
}

export function hasProjectWorkspace(
  platformPermissions: readonly string[],
  projectPermissions: readonly string[],
  roles: readonly string[],
): boolean {
  const permissions = permissionsForScope(
    "project",
    platformPermissions,
    projectPermissions,
    roles,
  );
  return permissions.some((permission) => permission.endsWith(".view"));
}
