import type { Types } from "mongoose";

import { resolveProjectRoleBySlug } from "@/lib/projects/resolve-role";
import { PROJECT_OWNER_ROLE } from "@/lib/rbac/roles";
import { Project, ProjectMember } from "@/models";

/** True when the user is an active `project_owner` of at least one pending project. */
export async function userOwnsPendingProject(userId: Types.ObjectId): Promise<boolean> {
  const ownerRole = await resolveProjectRoleBySlug(PROJECT_OWNER_ROLE);
  const memberships = await ProjectMember.find({
    userId,
    roleId: ownerRole._id,
    status: "active",
  }).select("projectId");

  if (memberships.length === 0) {
    return false;
  }

  const pending = await Project.exists({
    _id: { $in: memberships.map((membership) => membership.projectId) },
    status: "pending",
  });

  return Boolean(pending);
}
