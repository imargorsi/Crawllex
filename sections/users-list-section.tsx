"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { TableListSearch } from "@/components/table/table-list-search";
import { TableListSort } from "@/components/table/table-list-sort";
import { UserDetailSheet } from "@/components/users/user-detail-sheet";
import { UserAccountSourceFilter } from "@/components/users/user-account-source-filter";
import { UserStatusFilter } from "@/components/users/user-status-filter";
import { UsersTable } from "@/components/users/users-table";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateActionButton } from "@/components/ui/create-action-button";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import {
  useDeleteUserMutation,
  useUserStatusActionMutation,
  useUsersQuery,
} from "@/features/users/users.api";
import { useDetailSheetState } from "@/hooks/use-detail-sheet-state.hook";
import { useQueryParams } from "@/hooks/use-query-params.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import { notify } from "@/lib/frontend/feedback/notify";
import { analyticsHeadingStackClass } from "@/lib/frontend/layout/dashboard-chrome";
import { parseUsersListQuery } from "@/lib/frontend/users/users-list-query.utils";
import { userCanCreate, userCanDelete, userCanUpdate, userCanView } from "@/lib/frontend/users/acl";
import { USER_ROUTES } from "@/lib/frontend/users/user-routes.utils";
import type { TUserAccountSourceKnown } from "@/lib/users/account-source";
import { EMPTY_USER_ACCOUNT_SOURCE_COUNTS } from "@/lib/users/account-source-filter.utils";
import { isActiveUserStatus, type TUserAccountStatus } from "@/lib/users/constants";
import { EMPTY_USER_STATUS_COUNTS } from "@/lib/users/user-status-filter.utils";
import type { TAdminUserListItem } from "@/types/admin-user.types";
import { cn } from "@/lib/utils";

export function UsersListSection() {
  const router = useRouter();
  const { t } = useTranslation("translation", { keyPrefix: "modules.users" });
  const { data: authUser, isLoading: isAuthLoading } = useAuthUserQuery();
  const { queryParams, setQueryParams, updateQueryParams, deleteQueryParams } = useQueryParams();
  const listQuery = parseUsersListQuery(queryParams);
  const canView = useMemo(() => userCanView(authUser?.permissions), [authUser]);
  const canCreate = useMemo(() => userCanCreate(authUser?.permissions), [authUser]);
  const canUpdate = useMemo(() => userCanUpdate(authUser?.permissions), [authUser]);
  const canDelete = useMemo(() => userCanDelete(authUser?.permissions), [authUser]);
  const {
    selected: selectedUser,
    setSelected: setSelectedUser,
    isOpen: isDetailOpen,
    open: openDetail,
    onOpenChange: onDetailOpenChange,
    clear: clearDetail,
  } = useDetailSheetState<TAdminUserListItem>();
  const [deleteTarget, setDeleteTarget] = useState<TAdminUserListItem | null>(null);
  const statusMutation = useUserStatusActionMutation();
  const deleteMutation = useDeleteUserMutation();

  const { data, error, isLoading, isFetching } = useUsersQuery({
    page: listQuery.page,
    per_page: listQuery.per_page,
    search: listQuery.search,
    newest: listQuery.newest,
    status: listQuery.status,
    account_source: listQuery.account_source,
    enabled: canView,
  });

  const statusCounts = data?.filters.status_counts ?? EMPTY_USER_STATUS_COUNTS;
  const accountSourceCounts = data?.filters.account_source_counts ?? EMPTY_USER_ACCOUNT_SOURCE_COUNTS;

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
    (nextStatus: TUserAccountStatus | null) => {
      if (!nextStatus) {
        updateQueryParams({}, ["status", "page"]);
        return;
      }

      updateQueryParams({ status: nextStatus }, ["page"]);
    },
    [updateQueryParams],
  );

  const onAccountSourceFilterChange = useCallback(
    (nextSource: TUserAccountSourceKnown | null) => {
      if (!nextSource) {
        updateQueryParams({}, ["account_source", "page"]);
        return;
      }

      updateQueryParams({ account_source: nextSource }, ["page"]);
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

  const onViewUser = useCallback(
    (user: TAdminUserListItem) => {
      openDetail(user);
    },
    [openDetail],
  );

  const onEditUser = useCallback(
    (user: TAdminUserListItem) => {
      router.push(USER_ROUTES.edit(user.id));
    },
    [router],
  );

  const onToggleUserStatus = useCallback(
    async (user: TAdminUserListItem) => {
      const action = isActiveUserStatus(user.status) ? "deactivate" : "activate";
      try {
        const result = await statusMutation.mutateAsync({ userId: user.id, action });
        notify.success(
          result.message?.trim() ||
            t(action === "activate" ? "table.activateSuccess" : "table.deactivateSuccess"),
        );
        setSelectedUser((current) =>
          current?.id === user.id ? { ...current, status: result.data.status } : current,
        );
      } catch (error) {
        notify.error(ApiError.messageFrom(error, t("table.statusActionError")));
      }
    },
    [setSelectedUser, statusMutation, t],
  );

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      if (selectedUser?.id === deleteTarget.id) clearDetail();
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
            <Heading id="users-list-title" pageTitle>
              {t("title")}
            </Heading>
            <Paragraph className="text-text-muted">{t("subtitle")}</Paragraph>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {canView ? (
              <UserStatusFilter
                activeStatus={listQuery.status}
                counts={statusCounts}
                onStatusChange={onStatusFilterChange}
              />
            ) : null}
            {canCreate ? (
              <CreateActionButton href={USER_ROUTES.create}>{t("table.createUser")}</CreateActionButton>
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
              <UserAccountSourceFilter
                activeSource={listQuery.account_source}
                counts={accountSourceCounts}
                onSourceChange={onAccountSourceFilterChange}
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

            <UsersTable
              query={listQuery}
              data={data}
              isLoading={isLoading}
              isFetching={isFetching}
              onPageChange={onPageChange}
              onViewUser={onViewUser}
              onEditUser={onEditUser}
              onToggleUserStatus={canUpdate ? onToggleUserStatus : undefined}
              onDeleteUser={canDelete ? setDeleteTarget : undefined}
              canUpdate={canUpdate}
              canDelete={canDelete}
              currentUserId={authUser?.id ?? null}
              statusActionPendingUserId={
                statusMutation.isPending ? (statusMutation.variables?.userId ?? null) : null
              }
              isStatusMutationPending={statusMutation.isPending}
            />
          </div>
        ) : null}
      </div>

      <UserDetailSheet
        user={selectedUser}
        open={isDetailOpen}
        onOpenChange={onDetailOpenChange}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        icon={Icons.delete}
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
