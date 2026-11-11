import { NextResponse } from "next/server";

import { ValidationError } from "@/lib/api/http-errors";
import { ApiResponse } from "@/lib/api/response";
import { isHiddenFromAdminRoleUi } from "@/lib/rbac/roles";
import { assertKnownPermissions, sanitizeProjectPermissions } from "@/lib/roles/assert-known-permissions";
import { assertCanAssignRestricted } from "@/lib/roles/restricted-permissions";
import { getAdminRoleById } from "@/lib/roles/get-role";
import { escapeRegex, isDuplicateKeyError } from "@/lib/roles/role-mutation.utils";
import { resolveRoleMemberCounts } from "@/lib/roles/resolve-role-member-counts";
import { serializeAdminRoleDetail } from "@/lib/serializers/admin-role";
import { Role, type RoleDocument } from "@/models";
import type { UpdateRoleInput } from "@/schemas/role";

/** `actor` is the signed-in user's roles. Routes always pass it; omit only in trusted server code. */
export async function updateRole(
  roleId: string,
  input: UpdateRoleInput,
  actor?: { roles: readonly string[] },
): Promise<{ role: RoleDocument }> {
  const role = await getAdminRoleById(roleId);
  const name = input.name.trim();

  if (role.isSystem) {
    // Seeded system roles (project_owner, project_user) keep their exact display name —
    // a literal (not reserved-name-normalized) comparison, since this protects the specific
    // name the role was seeded with, not just its slug identity. Permissions/description
    // stay editable below and apply live to every project member on this role.
    if (name.toLowerCase() !== role.name.toLowerCase()) {
      throw ValidationError.fromFieldErrors({
        name: ["System Role Name Cannot Be Changed."],
      });
    }
  } else {
    if (isHiddenFromAdminRoleUi(name)) {
      throw ValidationError.fromFieldErrors({
        name: ["This Role Name Is Reserved."],
      });
    }

    const existing = await Role.findOne({
      _id: { $ne: role._id },
      name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    });
    if (existing) {
      throw ValidationError.fromFieldErrors({
        name: ["The Role Name Has Already Been Taken."],
      });
    }

    role.name = name;
  }

  const permissions = sanitizeProjectPermissions(input.permissions);
  assertKnownPermissions(permissions);
  if (actor) assertCanAssignRestricted(actor.roles, [...role.permissions], permissions);

  role.description = input.description.trim();
  role.permissions = permissions;

  try {
    await role.save();
  } catch (error) {
    // A concurrent request took the same name between our check above and this write.
    if (isDuplicateKeyError(error)) {
      throw ValidationError.fromFieldErrors({
        name: ["The Role Name Has Already Been Taken."],
      });
    }
    throw error;
  }

  return { role };
}

export async function buildUpdateRoleResponse(role: RoleDocument): Promise<NextResponse> {
  const counts = await resolveRoleMemberCounts([role._id]);
  const membersCount = counts.get(role._id.toString()) ?? 0;

  return ApiResponse.success(serializeAdminRoleDetail(role, membersCount), "Role updated.");
}
