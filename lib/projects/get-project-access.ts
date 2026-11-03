import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { ApiResponse } from "@/lib/api/response";
import type { AuthContext } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/rbac/access";
import { allProjectCatalogPermissions, projectPermission } from "@/lib/rbac/permission-catalog";
import { SUPER_ADMIN_ROLE } from "@/lib/rbac/roles";
import { ensureSystemRoles } from "@/lib/rbac/seed-roles";
import { isActiveRoleStatus } from "@/lib/roles/constants";
import { Project, ProjectMember, Role } from "@/models";

const PENDING_PROJECT_ACCESS_PERMISSIONS = [
  projectPermission("projects", "view"),
  projectPermission("projects", "update"),
] as const;

const INACTIVE_PROJECT_ACCESS_PERMISSIONS = [
  projectPermission("projects", "view"),
  projectPermission("projects", "update"),
] as const;

/** Rejected projects stay readable (detail page) but grant no module / mutate permissions. */
const REJECTED_PROJECT_ACCESS_PERMISSIONS = [projectPermission("projects", "view")] as const;

export type ProjectAccessDto = {
  projectId: string;
  roles: string[];
  permissions: string[];
};

export async function getProjectAccessForUser(auth: AuthContext, projectId: string): Promise<ProjectAccessDto | null> {
  await ensureSystemRoles();

  if (!mongoose.isValidObjectId(projectId)) {
    return null;
  }

  const isAdmin = auth.user.roles.includes(SUPER_ADMIN_ROLE);
  if (isAdmin) {
    const project = await Project.findById(projectId).select("_id status");
    if (!project) {
      return null;
    }

    // Read-only shell — detail yes; analytics / activities / integrations / mutate no.
    if (project.status === "rejected") {
      return {
        projectId,
        roles: [SUPER_ADMIN_ROLE],
        permissions: [...REJECTED_PROJECT_ACCESS_PERMISSIONS],
      };
    }

    return {
      projectId,
      roles: [SUPER_ADMIN_ROLE],
      permissions: [...allProjectCatalogPermissions()],
    };
  }

  const membership = await ProjectMember.findOne({
    projectId,
    userId: auth.user._id,
    status: "active",
  }).select("roleId");

  if (!membership) {
    return null;
  }

  const project = await Project.findById(projectId).select("status");
  if (!project) {
    return null;
  }

  const role = await Role.findById(membership.roleId).select("slug permissions status");
  const roleSlug = role?.slug ?? null;
  // An inactive role grants no permissions, even if it's still referenced by a membership.
  const rolePermissions = role && isActiveRoleStatus(role.status) ? [...role.permissions] : [];
  const memberManagementPermissions = rolePermissions.filter((permission) => permission.startsWith("members."));

  if (project.status === "rejected") {
    return {
      projectId,
      roles: roleSlug ? [roleSlug] : [],
      permissions: [...REJECTED_PROJECT_ACCESS_PERMISSIONS],
    };
  }

  if (project.status === "pending") {
    return {
      projectId,
      roles: roleSlug ? [roleSlug] : [],
      permissions: [...new Set([...PENDING_PROJECT_ACCESS_PERMISSIONS, ...memberManagementPermissions])],
    };
  }

  if (project.status === "inactive") {
    return {
      projectId,
      roles: roleSlug ? [roleSlug] : [],
      permissions: [...new Set([...INACTIVE_PROJECT_ACCESS_PERMISSIONS, ...memberManagementPermissions])],
    };
  }

  if (project.status !== "active") {
    return null;
  }

  return {
    projectId,
    roles: roleSlug ? [roleSlug] : [],
    permissions: rolePermissions,
  };
}

/** True when the caller has `permission` on the project. Never throws; unknown project or no membership gives false. */
export async function hasProjectPermission(auth: AuthContext, projectId: string, permission: string): Promise<boolean> {
  const access = await getProjectAccessForUser(auth, projectId);
  return access ? hasPermission(access.permissions, permission) : false;
}

export async function requireProjectPermission(
  auth: AuthContext,
  projectId: string,
  permission: string
): Promise<NextResponse | null> {
  const access = await getProjectAccessForUser(auth, projectId);
  // No membership / missing project → 404. Rejected projects still grant projects.view only.
  if (!access) {
    return ApiResponse.error("Project Not Found.", {}, 404);
  }

  if (!hasPermission(access.permissions, permission)) {
    return ApiResponse.error("Forbidden.", {}, 403);
  }

  return null;
}

export function buildProjectAccessResponse(access: ProjectAccessDto): NextResponse {
  return ApiResponse.success(access);
}
