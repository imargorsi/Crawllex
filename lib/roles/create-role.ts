import { NextResponse } from "next/server";

import { ValidationError } from "@/lib/api/http-errors";
import { ApiResponse } from "@/lib/api/response";
import { assertKnownPermissions } from "@/lib/roles/assert-known-permissions";
import { assertCanAssignRestricted } from "@/lib/roles/restricted-permissions";
import { escapeRegex, isDuplicateKeyError } from "@/lib/roles/role-mutation.utils";
import { generateUniqueRoleSlug } from "@/lib/roles/role-slug.utils";
import { serializeAdminRoleDetail } from "@/lib/serializers/admin-role";
import { isHiddenFromAdminRoleUi } from "@/lib/rbac/roles";
import { Role, type RoleDocument } from "@/models";
import type { CreateRoleInput } from "@/schemas/role";

/** `actor` is the signed-in user's roles. Routes always pass it; omit only in trusted server code. */
export async function createRole(input: CreateRoleInput, actor?: { roles: readonly string[] }): Promise<{ role: RoleDocument }> {
  const name = input.name.trim();

  if (isHiddenFromAdminRoleUi(name)) {
    throw ValidationError.fromFieldErrors({
      name: ["This Role Name Is Reserved."],
    });
  }

  const existing = await Role.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } });
  if (existing) {
    throw ValidationError.fromFieldErrors({
      name: ["The Role Name Has Already Been Taken."],
    });
  }

  const permissions = [...new Set(input.permissions)];
  assertKnownPermissions(permissions);
  if (actor) assertCanAssignRestricted(actor.roles, [], permissions);

  const slug = await generateUniqueRoleSlug(name);

  try {
    const role = await Role.create({
      slug,
      name,
      description: input.description.trim(),
      scope: "project",
      isSystem: false,
      permissions,
    });

    return { role };
  } catch (error) {
    // A concurrent request took the same name/slug between our checks above and this write.
    if (isDuplicateKeyError(error)) {
      throw ValidationError.fromFieldErrors({
        name: ["The Role Name Has Already Been Taken."],
      });
    }
    throw error;
  }
}

export function buildCreateRoleResponse(role: RoleDocument): NextResponse {
  return ApiResponse.success(serializeAdminRoleDetail(role, 0), "Role created.", 201);
}
