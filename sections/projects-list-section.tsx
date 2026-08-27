"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { NoProjectComponent } from "@/components/projects/no-project-component";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectInviteUsersQuickAdd } from "@/components/projects/project-invite-users-quick-add";
import { ProjectInvitationsBanner } from "@/components/projects/project-invitations-banner";
import { ProjectListViewToggle } from "@/components/projects/project-list-view-toggle";
import { ProjectStatusFilter } from "@/components/projects/project-status-filter";
import { ProjectsTable } from "@/components/projects/projects-table";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateActionButton } from "@/components/ui/create-action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { useProjectAccess } from "@/context/project-access-context";
import { useSelectedProject } from "@/context/selected-project-context";
import { useAuthUserQuery, useResendEmailVerificationMutation } from "@/features/auth/auth.api";
import {
  type TProjectListItem,
  useDeleteProjectMutation,
  useProjectsQuery,
} from "@/features/projects/projects.api";
import { useQueryParams } from "@/hooks/use-query-params.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import { notify } from "@/lib/frontend/feedback/notify";
import {
  countProjectsByStatus,
  parseProjectStatusFilter,
} from "@/lib/projects/project-status-filter.utils";
import type { ProjectStatus } from "@/lib/projects/constants";
import { resolveProjectOwnerId } from "@/lib/projects/project-owner-id.utils";
import { canCreateProject, listHasOwnedPendingProject } from "@/lib/projects/can-create-project.utils";
import {
  canDeleteProjectCard,
  canEditProjectCard,
  canInviteProjectMembers,
} from "@/lib/projects/project-card-access.utils";
import {
  DEFAULT_PROJECT_LIST_VIEW_MODE,
  parseProjectListViewMode,
  type TProjectListViewMode,
} from "@/lib/frontend/projects/projects-list-view.utils";
import { hasPermission, isSuperAdmin, mergePermissions } from "@/lib/rbac/access";
import { PROJECT_ROUTES } from "@/lib/frontend/projects/project-routes.utils";
import { cn } from "@/lib/utils";

export function ProjectsListSection() {
  const { t } = useTranslation("translation", { keyPrefix: "modules.projects" });
  const { t: tVerification } = useTranslation("translation", { keyPrefix: "auth.verification" });
  const router = useRouter();
  const { data: user } = useAuthUserQuery();
  const { selectedProject } = useSelectedProject();
  const { projectPermissions } = useProjectAccess();
  const { queryParams, setQueryParams, deleteQueryParams } = useQueryParams();
  const statusFilter = parseProjectStatusFilter(queryParams.status);
  const viewMode = parseProjectListViewMode(queryParams.view);
  const { data: allProjects = [], isPending: isAllProjectsPending } = useProjectsQuery({ status: null });
  const { data: filteredProjects = [], isPending: isFilteredProjectsPending } = useProjectsQuery({
    status: statusFilter ?? null,
    enabled: Boolean(statusFilter),
  });
  const resendMutation = useResendEmailVerificationMutation();
  const deleteMutation = useDeleteProjectMutation();
  const projectItems = statusFilter ? filteredProjects : allProjects;
  const hasProjects = allProjects.length > 0;
  const hasFilteredResults = projectItems.length > 0;
  const isPending = statusFilter ? isFilteredProjectsPending : isAllProjectsPending;
  const statusCounts = countProjectsByStatus(allProjects);
  const isVerified = Boolean(user?.email_verified_at);
  const [inviteProjectId, setInviteProjectId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TProjectListItem | null>(null);

  const permissions = mergePermissions(user?.permissions ?? [], projectPermissions);
  const userIsSuperAdmin = isSuperAdmin(user?.roles);
  const ownsPendingProject = listHasOwnedPendingProject(allProjects, user?.id);
  const canCreateProjectAction = canCreateProject({
    isVerified,
    isSuperAdmin: userIsSuperAdmin,
    hasProjects,
    hasCreatePermission: hasPermission(permissions, "projects.create"),
    ownsPendingProject,
  });
  const platformPermissions = user?.permissions ?? [];

  const getProjectCardAccess = useCallback(
    (project: TProjectListItem) => {
      const ownerId = resolveProjectOwnerId(project);
      const accessInput = {
        permissions,
        userId: user?.id,
        ownerId,
        isSuperAdmin: userIsSuperAdmin,
        status: project.status,
      };

      /**
       * Invite must not reuse selected-project `members.invite` on other rows (false positives).
       * Owners / super admins always qualify; role-based invite applies only when this row is selected.
       */
      const invitePermissions =
        selectedProject?.id === project.id ? permissions : (user?.permissions ?? []);

      return {
        /**
         * List is already membership / super_admin scoped. Any listed row may open detail
         * (rejected is read-only via access + action builders). Do not require selected-project
         * `projects.view` — rejected projects cannot be selected.
         */
        canViewDetails: true,
        canEditProject: canEditProjectCard(accessInput),
        canInviteMembers: canInviteProjectMembers({
          permissions: invitePermissions,
          userId: user?.id,
          ownerId,
          isSuperAdmin: userIsSuperAdmin,
          status: project.status,
        }),
        canDeleteProject: canDeleteProjectCard({
          platformPermissions,
          isSuperAdmin: userIsSuperAdmin,
          status: project.status,
        }),
      };
    },
    [permissions, platformPermissions, selectedProject?.id, user?.id, user?.permissions, userIsSuperAdmin],
  );

  function onStatusFilterChange(nextStatus: ProjectStatus | null) {
    if (!nextStatus) {
      deleteQueryParams(["status"]);
      return;
    }

    setQueryParams({ status: nextStatus });
  }

  function onViewModeChange(nextMode: TProjectListViewMode) {
    if (nextMode === DEFAULT_PROJECT_LIST_VIEW_MODE) {
      deleteQueryParams(["view"]);
      return;
    }
    setQueryParams({ view: nextMode });
  }

  async function onResendVerification() {
    try {
      const result = await resendMutation.mutateAsync();
      notify.success(result.message?.trim() || tVerification("resendSuccess"));
      router.push("/email-verification");
    } catch (error) {
      notify.error(ApiError.messageFrom(error, tVerification("resendErrorFallback")));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      notify.success(result.message?.trim() || t("table.deleteSuccessFallback"));
    } catch (error) {
      notify.error(ApiError.messageFrom(error, t("table.deleteErrorTitle")));
    }
  }

  const inviteTarget = inviteProjectId
    ? (projectItems.find((project) => project.id === inviteProjectId) ??
      allProjects.find((project) => project.id === inviteProjectId) ??
      null)
    : null;

  return (
    <div className="w-full min-w-0">
      <div className="space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="type-stack-md">
            <Heading id="projects-list-title" pageTitle>
              {t("title")}
            </Heading>
            <Paragraph className="text-text-muted">{t("subtitle")}</Paragraph>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {hasProjects ? (
              <ProjectStatusFilter
                activeStatus={statusFilter ?? null}
                counts={statusCounts}
                onStatusChange={onStatusFilterChange}
              />
            ) : null}

            {hasProjects ? (
              <ProjectListViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            ) : null}

            {canCreateProjectAction && hasProjects ? (
              <CreateActionButton href={PROJECT_ROUTES.create}>
                {t("table.createProject")}
              </CreateActionButton>
            ) : null}
          </div>
        </div>

        <ProjectInvitationsBanner />

        {isPending ? (
          viewMode === "table" ? (
            <ProjectsTable
              projects={[]}
              isLoading
              isSuperAdmin={userIsSuperAdmin}
              getAccess={getProjectCardAccess}
              onInviteUsers={setInviteProjectId}
              onDeleteProject={setDeleteTarget}
            />
          ) : (
            <CardGridSkeleton />
          )
        ) : !hasProjects ? (
          <NoProjectComponent
            variant={isVerified ? "no-projects" : "email-not-verified"}
            canCreateProject={canCreateProjectAction}
            onVerifyEmail={() => void onResendVerification()}
            isVerifyEmailPending={resendMutation.isPending}
          />
        ) : !hasFilteredResults ? (
          <EmptyState
            title={t("statusFilter.emptyTitle")}
            description={t("statusFilter.emptyBody")}
            icon={Icons.filter}
          />
        ) : viewMode === "table" ? (
          <ProjectsTable
            projects={projectItems}
            isLoading={false}
            isSuperAdmin={userIsSuperAdmin}
            getAccess={getProjectCardAccess}
            onInviteUsers={setInviteProjectId}
            onDeleteProject={setDeleteTarget}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {projectItems.map((project: TProjectListItem) => {
              const access = getProjectCardAccess(project);

              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  canViewDetails={access.canViewDetails}
                  canEditProject={access.canEditProject}
                  canInviteMembers={access.canInviteMembers}
                  canDeleteProject={access.canDeleteProject}
                  isSuperAdmin={userIsSuperAdmin}
                  onInviteUsers={() => setInviteProjectId(project.id)}
                  onDeleteProject={() => setDeleteTarget(project)}
                />
              );
            })}
          </div>
        )}
      </div>

      <ProjectInviteUsersQuickAdd
        open={Boolean(inviteProjectId)}
        projectId={inviteProjectId}
        canInvite={inviteTarget ? getProjectCardAccess(inviteTarget).canInviteMembers : false}
        onOpenChange={(open) => {
          if (!open) setInviteProjectId(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        icon={Icons.delete}
        title={t("table.deleteConfirmTitle")}
        description={t("table.deleteConfirmDescription", { name: deleteTarget?.businessName ?? "" })}
        action={
          <>
            <AlertDialogCancel>{t("table.deleteConfirmCancel")}</AlertDialogCancel>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "destructive", size: "md" }))}
              onClick={() => void confirmDelete()}
              disabled={deleteMutation.isPending}
            >
              {t("table.deleteConfirmAction")}
            </button>
          </>
        }
      />
    </div>
  );
}
