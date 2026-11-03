import type { Types } from "mongoose";

import { serializeStoredImageUrl } from "@/lib/serializers/stored-image";
import type { TProjectOwnerSummary } from "@/types/project.types";
import { PROJECT_OWNER_ROLE } from "@/lib/rbac/roles";
import { ProjectMember, Role, User, type ProjectDocument } from "@/models";

export async function resolveOwnerMap(
  projects: ProjectDocument[],
): Promise<Map<string, TProjectOwnerSummary>> {
  if (projects.length === 0) return new Map();

  const ownerRole = await Role.findOne({ slug: PROJECT_OWNER_ROLE }).select("_id");
  if (!ownerRole) return new Map();

  const projectIds = projects.map((project) => project._id);
  const ownerMembers = await ProjectMember.find({
    projectId: { $in: projectIds },
    roleId: ownerRole._id,
    status: "active",
  })
    .sort({ createdAt: 1 })
    .select("projectId userId");

  const firstOwnerByProject = new Map<string, Types.ObjectId>();
  for (const member of ownerMembers) {
    const key = member.projectId.toString();
    if (!firstOwnerByProject.has(key)) {
      firstOwnerByProject.set(key, member.userId);
    }
  }

  const ownerUserIds = [...new Set([...firstOwnerByProject.values()].map((id) => id.toString()))];
  if (ownerUserIds.length === 0) return new Map();

  const owners = await User.find({ _id: { $in: ownerUserIds } }).select("_id name email profileImage");
  const ownerById = new Map(
    owners.map((owner) => [
      owner._id.toString(),
      {
        id: owner._id.toString(),
        name: owner.name,
        email: owner.email,
        profileImage: serializeStoredImageUrl(owner.profileImage),
      },
    ]),
  );

  const ownerMap = new Map<string, TProjectOwnerSummary>();
  for (const [projectId, ownerUserId] of firstOwnerByProject.entries()) {
    const owner = ownerById.get(ownerUserId.toString());
    if (owner) {
      ownerMap.set(projectId, owner);
    }
  }

  return ownerMap;
}
