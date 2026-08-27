import type { ProjectStatus } from "@/lib/projects/constants";

type TPendingOwnerListItem = {
  status: ProjectStatus | string;
  createdByUserId: string;
  owner?: { id: string } | null;
};

export function listHasOwnedPendingProject(
  projects: readonly TPendingOwnerListItem[],
  userId: string | null | undefined,
): boolean {
  if (!userId) return false;
  return projects.some((project) => {
    const ownerId = project.owner?.id ?? project.createdByUserId;
    return project.status === "pending" && ownerId === userId;
  });
}

export function canCreateProject({
  isVerified,
  isSuperAdmin,
  hasProjects,
  hasCreatePermission,
  ownsPendingProject,
}: {
  isVerified: boolean;
  isSuperAdmin: boolean;
  hasProjects: boolean;
  hasCreatePermission: boolean;
  ownsPendingProject: boolean;
}): boolean {
  if (!isVerified) return false;
  if (isSuperAdmin) return true;
  if (ownsPendingProject) return false;
  return hasCreatePermission || !hasProjects;
}
