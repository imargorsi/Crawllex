import { ForbiddenError } from "@/lib/api/http-errors";
import { SUPER_ADMIN_ROLE } from "@/lib/rbac/roles";
import { isRestrictedPermission } from "@/lib/rbac/permission-catalog";

/** Restricted permissions (Oriel, Lens) that differ between the stored and the submitted role. */
export function restrictedPermissionChanges(before: readonly string[], after: readonly string[]): string[] {
  const changed = new Set<string>();
  for (const permission of [...before, ...after]) {
    if (before.includes(permission) !== after.includes(permission)) changed.add(permission);
  }
  return [...changed].filter((permission) => isRestrictedPermission(permission)).sort();
}

/** Only a super admin may add or remove a restricted permission on a role. Other changes are not affected. */
export function assertCanAssignRestricted(actorRoles: readonly string[], before: readonly string[], after: readonly string[]): void {
  const changed = restrictedPermissionChanges(before, after);
  if (changed.length > 0 && !actorRoles.includes(SUPER_ADMIN_ROLE)) {
    throw new ForbiddenError(`Only a super admin can assign these permissions: ${changed.join(", ")}.`);
  }
}
