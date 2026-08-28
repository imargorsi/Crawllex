"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ClientCard } from "@/components/clients/client-card";
import { ClientListViewToggle } from "@/components/clients/client-list-view-toggle";
import { ClientStatusFilter } from "@/components/clients/client-status-filter";
import { ClientsTable } from "@/components/clients/clients-table";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateActionButton } from "@/components/ui/create-action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import {
  useClientStatusActionMutation,
  useClientsQuery,
  useDeleteClientMutation,
} from "@/features/clients/clients.api";
import { useQueryParams } from "@/hooks/use-query-params.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import { clientCanCreate, clientCanDelete, clientCanUpdate, clientCanView } from "@/lib/frontend/clients/acl";
import { CLIENT_ROUTES } from "@/lib/frontend/clients/client-routes.utils";
import {
  DEFAULT_CLIENT_LIST_VIEW_MODE,
  parseClientListViewMode,
  type TClientListViewMode,
} from "@/lib/frontend/clients/clients-list-view.utils";
import { notify } from "@/lib/frontend/feedback/notify";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { countClientsByStatus, parseClientStatusFilter } from "@/lib/clients/client-status-filter.utils";
import type { TClientStatus } from "@/lib/clients/constants";
import type { TClientListItem } from "@/types/client.types";
import { cn } from "@/lib/utils";

export function ClientsListSection() {
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients" });
  const { t: tActions } = useTranslation("translation", { keyPrefix: "modules.clients.cardActions" });
  const { data: authUser, isLoading: isAuthLoading } = useAuthUserQuery();
  const { queryParams, setQueryParams, deleteQueryParams } = useQueryParams();
  const statusFilter = parseClientStatusFilter(queryParams.status);
  const viewMode = parseClientListViewMode(queryParams.view);
  const canView = useMemo(() => clientCanView(authUser?.permissions), [authUser]);
  const canCreate = clientCanCreate(authUser?.permissions);
  const canUpdate = useMemo(() => clientCanUpdate(authUser?.permissions), [authUser]);
  const canDelete = useMemo(() => clientCanDelete(authUser?.permissions), [authUser]);
  const [deleteTarget, setDeleteTarget] = useState<TClientListItem | null>(null);
  const deleteMutation = useDeleteClientMutation();
  const statusMutation = useClientStatusActionMutation();

  const { data: allClients = [], isPending: isAllPending, error: allError } = useClientsQuery({
    status: null,
    enabled: canView,
  });
  const { data: filteredClients = [], isPending: isFilteredPending, error: filteredError } = useClientsQuery({
    status: statusFilter ?? null,
    enabled: canView && Boolean(statusFilter),
  });

  const clientItems = statusFilter ? filteredClients : allClients;
  const hasClients = allClients.length > 0;
  const hasFilteredResults = clientItems.length > 0;
  const isPending = statusFilter ? isFilteredPending : isAllPending;
  const error = statusFilter ? filteredError : allError;
  const statusCounts = countClientsByStatus(allClients);

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

  function onStatusFilterChange(nextStatus: TClientStatus | null) {
    if (!nextStatus) {
      deleteQueryParams(["status"]);
      return;
    }
    setQueryParams({ status: nextStatus });
  }

  function onViewModeChange(nextMode: TClientListViewMode) {
    if (nextMode === DEFAULT_CLIENT_LIST_VIEW_MODE) {
      deleteQueryParams(["view"]);
      return;
    }
    setQueryParams({ view: nextMode });
  }

  const copyShareUrl = useCallback(
    async (client: TClientListItem) => {
      try {
        await navigator.clipboard.writeText(client.shareUrl);
        notify.success(t("table.copySuccess"));
      } catch {
        notify.error(t("table.copyError"));
      }
    },
    [t],
  );

  async function onStatusAction(client: TClientListItem, nextActive: boolean) {
    try {
      const result = await statusMutation.mutateAsync({
        clientId: client.id,
        action: nextActive ? "activate" : "deactivate",
      });
      notify.success(result.message?.trim() || tActions(nextActive ? "success.active" : "success.inactive"));
    } catch (err) {
      notify.error(ApiError.messageFrom(err, tActions("errorFallback")));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      notify.success(result.message?.trim() || t("table.deleteSuccess"));
    } catch (err) {
      notify.error(ApiError.messageFrom(err, t("table.deleteErrorFallback")));
    }
  }

  return (
    <div className="w-full min-w-0">
      <div className="space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="type-stack-md">
            <Heading id="clients-title" pageTitle>
              {t("title")}
            </Heading>
            <Paragraph className="text-text-muted">{t("subtitle")}</Paragraph>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {hasClients ? (
              <ClientStatusFilter
                activeStatus={statusFilter ?? null}
                counts={statusCounts}
                onStatusChange={onStatusFilterChange}
              />
            ) : null}

            {hasClients ? (
              <ClientListViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
            ) : null}

            {canCreate && hasClients ? (
              <CreateActionButton href={CLIENT_ROUTES.create}>{t("addClient")}</CreateActionButton>
            ) : null}
          </div>
        </div>

        {isPending ? (
          viewMode === "table" ? (
            <ClientsTable
              clients={[]}
              isLoading
              canUpdate={canUpdate}
              canDelete={canDelete}
              onCopyLink={copyShareUrl}
              onDeleteClient={setDeleteTarget}
              onStatusAction={(client, nextActive) => void onStatusAction(client, nextActive)}
            />
          ) : (
            <CardGridSkeleton />
          )
        ) : !hasClients ? (
          <EmptyState title={t("table.emptyTitle")} description={t("table.emptyBody")} icon={Icons.building}>
            {canCreate ? <CreateActionButton href={CLIENT_ROUTES.create}>{t("addClient")}</CreateActionButton> : null}
          </EmptyState>
        ) : !hasFilteredResults ? (
          <EmptyState
            title={t("statusFilter.emptyTitle")}
            description={t("statusFilter.emptyBody")}
            icon={Icons.filter}
          />
        ) : viewMode === "table" ? (
          <ClientsTable
            clients={clientItems}
            isLoading={false}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onCopyLink={copyShareUrl}
            onDeleteClient={setDeleteTarget}
            onStatusAction={(client, nextActive) => void onStatusAction(client, nextActive)}
            statusActionPendingClientId={statusMutation.isPending ? (statusMutation.variables?.clientId ?? null) : null}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {clientItems.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onCopyLink={copyShareUrl}
                onDeleteClient={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("table.deleteTitle")}
        description={t("table.deleteBody", { name: deleteTarget?.businessName ?? "" })}
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
