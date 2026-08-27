"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { ProjectCreateForm } from "@/components/forms/project-create-form";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useProjectAccess } from "@/context/project-access-context";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { useProjectsQuery } from "@/features/projects/projects.api";
import { canCreateProject, listHasOwnedPendingProject } from "@/lib/projects/can-create-project.utils";
import { hasPermission, isSuperAdmin, mergePermissions } from "@/lib/rbac/access";

export function ProjectsCreateSection() {
  const router = useRouter();
  const { t } = useTranslation("translation", { keyPrefix: "modules.projects" });
  const { data: authUser, isLoading } = useAuthUserQuery();
  const { projectPermissions } = useProjectAccess();
  const { data: projects, isPending: isProjectsPending } = useProjectsQuery({ enabled: Boolean(authUser) });
  const hasProjects = (projects?.length ?? 0) > 0;
  const isVerified = Boolean(authUser?.email_verified_at);
  const userIsSuperAdmin = isSuperAdmin(authUser?.roles);
  const ownsPendingProject = listHasOwnedPendingProject(projects ?? [], authUser?.id);
  const canCreate = canCreateProject({
    isVerified,
    isSuperAdmin: userIsSuperAdmin,
    hasProjects,
    hasCreatePermission: hasPermission(
      mergePermissions(authUser?.permissions ?? [], projectPermissions),
      "projects.create",
    ),
    ownsPendingProject,
  });

  useEffect(() => {
    if (!isLoading && authUser && !isVerified) {
      router.replace("/email-verification");
      return;
    }
    if (!isLoading && !isProjectsPending && !canCreate && !ownsPendingProject) {
      router.replace("/projects");
    }
  }, [authUser, canCreate, isLoading, isProjectsPending, isVerified, ownsPendingProject, router]);

  if (isLoading || isProjectsPending || !authUser) {
    return <LoadingState skeletonVariant="form" />;
  }

  if (!isVerified) return null;

  if (ownsPendingProject && !userIsSuperAdmin) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <EmptyState
          title={t("pendingLimitTitle")}
          description={t("pendingLimitBody")}
          icon={Icons.clock}
        />
      </div>
    );
  }

  if (!canCreate) return null;

  return (
    <div className="w-full min-w-0">
      <div className="space-y-5 px-4 py-6 sm:px-6">
        <div className="type-stack-md">
          <Heading id="projects-create-title" pageTitle>
            {t("createProjectTitle")}
          </Heading>
          <Paragraph className="text-text-muted">{t("createLead")}</Paragraph>
        </div>
        <ProjectCreateForm authUser={authUser} />
      </div>
    </div>
  );
}
