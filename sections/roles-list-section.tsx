"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { RoleDetailSheet } from "@/components/roles/role-detail-sheet";
import { RoleStatusFilter } from "@/components/roles/role-status-filter";
import { RolesTable } from "@/components/roles/roles-table";
import { TableListSearch } from "@/components/table/table-list-search";
import { TableListSort } from "@/components/table/table-list-sort";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateActionButton } from "@/components/ui/create-action-button";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import {
  useDeleteRoleMutation,
  useRoleStatusActionMutation,
  useRolesQuery,
} from "@/features/roles/roles.api";
import { useDetailSheetState } from "@/hooks/use-detail-sheet-state.hook";
import { useQueryParams } from "@/hooks/use-query-params.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import { roleCanCreate, roleCanDelete, roleCanUpdate, roleCanView } from "@/lib/frontend/roles/acl";
import { roleActionIcon } from "@/lib/frontend/roles/permission-action-icon.utils";
import { ROLE_ROUTES } from "@/lib/frontend/roles/role-routes.utils";
import { parseRolesListQuery } from "@/lib/frontend/roles/roles-list-query.utils";
import { notify } from "@/lib/frontend/feedback/notify";
import { analyticsHeadingStackClass } from "@/lib/frontend/layout/dashboard-chrome";
import { isActiveRoleStatus, type TRoleStatus } from "@/lib/roles/constants";
import { EMPTY_ROLE_STATUS_COUNTS } from "@/lib/roles/role-status-filter.utils";
import type { TAdminRoleListItem } from "@/types/admin-role.types";
import { cn } from "@/lib/utils";

const DeleteRoleIcon = roleActionIcon("delete")!;

export function RolesListSection() {
  const router = useRouter();
  const { t } = useTranslation("translation", { keyPrefix: "modules.roles" });
  const { data: authUser, isLoading: isAuthLoading } = useAuthUserQuery();
  const { queryParams, setQueryParams, updateQueryParams, deleteQueryParams } = useQueryParams();
  const listQuery = parseRolesListQuery(queryParams);
  const canCreate = roleCanCreate(authUser?.permissions);
  const canView = useMemo(() => roleCanView(authUser?.permissions), [authUser]);
  const canUpdate = useMemo(() => roleCanUpdate(authUser?.permissions), [authUser]);
  const canDelete = useMemo(() => roleCanDelete(authUser?.permissions), [authUser]);
  const {
    selected: selectedRoleId,
    isOpen: isDetailOpen,
    open: openDetail,
    onOpenChange: onDetailOpenChange,
    clear: clearDetail,
  } = useDetailSheetState<string>();
  const [deleteTarget, setDeleteTarget] = useState<TAdminRoleListItem | null>(null);
  const statusMutation = useRoleStatusActionMutation();
  const deleteMutation = useDeleteRoleMutation();

  const { data, error, isLoading, isFetching } = useRolesQuery({
    page: listQuery.page,
    per_page: listQuery.per_page,
    search: listQuery.search,
    newest: listQuery.newest,
    status: listQuery.status,
    enabled: canView,
  });

  const statusCounts = data?.filters.status_counts ?? EMPTY_ROLE_STATUS_COUNTS;

  const accessDeniedNotified = useRef(false);
  const loadErrorNotified = useRef(false);

  useEffect(() => {
    if (isAuthLoading || canView || accessDeniedNotified.current) return;
    accessDeniedNotified.current = true;
    notify.error(t("table.accessDeniedBody"));
  }, [canView, isAuthLoading, t]);

  useEffect(() => {
    if (!error || loadErrorNotified.current) return;
    loadErrorNotified.current = true;
    notify.error(error instanceof Error ? error.message : t("table.loadErrorBody"));
  }, [error, t]);

  const sortOptions = useMemo(
    () => [
      {
        value: "newest",
        label: t("table.sortByNewest"),
        shortLabel: t("table.sortNewest"),
      },
      {
        value: "oldest",
        label: t("table.sortByOldest"),
        shortLabel: t("table.sortOldest"),
      },
    ],
    [t],
  );

  const onSearchChange = useCallback(
    (value: string) => {
      if (value) {
        updateQueryParams({ search: value }, ["page"]);
        return;
      }

      updateQueryParams({}, ["search", "page"]);
    },
    [updateQueryParams],
  );

  const onNewestChange = useCallback(
    (value: string) => {
      if (value === "newest") {
        deleteQueryParams(["newest"]);
        return;
      }

      setQueryParams({ newest: "false" });
    },
    [deleteQueryParams, setQueryParams],
  );

  const onStatusFilterChange = useCallback(
    (nextStatus: TRoleStatus | null) => {
      if (!nextStatus) {
        updateQueryParams({}, ["status", "page"]);
        return;
      }

      updateQueryParams({ status: nextStatus }, ["page"]);
    },
    [updateQueryParams],
  );

  const onPageChange = useCallback(
    (page: number) => {
      if (page <= 1) {
        deleteQueryParams(["page"]);
        return;
      }

      setQueryParams({ page: String(page) });
    },
    [deleteQueryParams, setQueryParams],
  );

  const onViewRole = useCallback(
    (roleId: string) => {
      openDetail(roleId);
    },
    [openDetail],
  );

  const onEditRole = useCallback(
    (roleId: string) => {
      router.push(ROLE_ROUTES.edit(roleId));
    },
    [router],
  );

  const onToggleRoleStatus = useCallback(
    async (role: TAdminRoleListItem) => {
      const action = isActiveRoleStatus(role.status) ? "deactivate" : "activate";
      try {
        const result = await statusMutation.mutateAsync({ roleId: role.id, action });
        notify.success(
          result.message?.trim() ||
            t(action === "activate" ? "table.activateSuccess" : "table.deactivateSuccess"),
        );
      } catch (error) {
        notify.error(ApiError.messageFrom(error, t("table.statusActionError")));
      }
    },
    [statusMutation, t],
  );

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      if (selectedRoleId === deleteTarget.id) clearDetail();
      notify.success(result.message?.trim() || t("table.deleteSuccess"));
    } catch (error) {
      notify.error(ApiError.messageFrom(error, t("table.deleteErrorFallback")));
    }
  }

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col gap-6 px-4 py-6 sm:gap-7 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
          <div className={cn(analyticsHeadingStackClass, "max-w-2xl")}>
            <Heading id="roles-list-title" pageTitle>
              {t("title")}
            </Heading>
            <Paragraph className="text-text-muted">{t("subtitle")}</Paragraph>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {canView ? (
              <RoleStatusFilter
                activeStatus={listQuery.status}
                counts={statusCounts}
                onStatusChange={onStatusFilterChange}
              />
            ) : null}
            {canCreate ? (
              <CreateActionButton href={ROLE_ROUTES.create}>{t("table.createRole")}</CreateActionButton>
            ) : null}
          </div>
        </div>

        {canView ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <TableListSearch
                value={listQuery.search}
                onChange={onSearchChange}
                placeholder={t("table.searchPlaceholder")}
                isLoading={isFetching}
              />
              <TableListSort
                value={listQuery.newest ? "newest" : "oldest"}
                onChange={onNewestChange}
                options={sortOptions}
                label={t("table.sortBy")}
                ariaLabel={t("table.sortToggle", {
                  direction: listQuery.newest ? t("table.sortNewest") : t("table.sortOldest"),
                })}
              />
            </div>

            <RolesTable
              query={listQuery}
              data={data}
              isLoading={isLoading}
              isFetching={isFetching}
              onPageChange={onPageChange}
              onViewRole={onViewRole}
              onEditRole={onEditRole}
              onToggleRoleStatus={canUpdate ? onToggleRoleStatus : undefined}
              onDeleteRole={canDelete ? setDeleteTarget : undefined}
              canUpdate={canUpdate}
              canDelete={canDelete}
              statusActionPendingRoleId={
                statusMutation.isPending ? (statusMutation.variables?.roleId ?? null) : null
              }
              isStatusMutationPending={statusMutation.isPending}
            />
          </div>
        ) : null}
      </div>

      <RoleDetailSheet roleId={selectedRoleId} open={isDetailOpen} onOpenChange={onDetailOpenChange} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        icon={DeleteRoleIcon}
        title={t("table.deleteTitle")}
        description={t("table.deleteBody")}
        action={
          <>
            <AlertDialogCancel>{t("table.deleteCancel")}</AlertDialogCancel>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "destructive", size: "md" }))}
              onClick={() => void confirmDelete()}
              disabled={deleteMutation.isPending}
            >
              {t("table.deleteConfirm")}
            </button>
          </>
        }
      />
    </div>
  );
}
