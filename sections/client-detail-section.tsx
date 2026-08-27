"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ClientIntakeSnapshot } from "@/components/clients/client-intake-snapshot";
import { ClientStatusChip } from "@/components/clients/client-status-chip";
import { DashboardModuleBreadcrumbSection } from "@/components/layout/dashboard-module-breadcrumb-section";
import { ProjectDetailInfoCard } from "@/components/projects/detail/project-detail-info-card";
import { ActiveInactiveToggle } from "@/components/ui/active-inactive-toggle";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Heading } from "@/components/heading";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { useClientQuery, useClientStatusActionMutation, useDeleteClientMutation } from "@/features/clients/clients.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { clientCanDelete, clientCanUpdate } from "@/lib/frontend/clients/acl";
import { CLIENT_ROUTES } from "@/lib/frontend/clients/client-routes.utils";
import { notify } from "@/lib/frontend/feedback/notify";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { displayDetailValue } from "@/lib/frontend/projects/project-detail-display.utils";
import {
  elevatedCardBodyClass,
  elevatedCardSurfaceClass,
  elevatedCardTitleClass,
  typeIconTextClass,
  typeMetaRowClass,
  typeStackIdentityClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function ClientDetailSection() {
  const params = useParams<{ id: string }>();
  const clientId = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients" });
  const { t: tDetail } = useTranslation("translation", { keyPrefix: "modules.clients.detail" });
  const { data: user } = useAuthUserQuery();
  const canUpdate = clientCanUpdate(user?.permissions);
  const canDelete = clientCanDelete(user?.permissions);
  const { data: client, isPending, isError, error } = useClientQuery(clientId, {
    enabled: Boolean(user && clientId),
  });
  const deleteMutation = useDeleteClientMutation();
  const statusMutation = useClientStatusActionMutation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const breadcrumbItems = useMemo(
    () => [
      { id: "clients", label: t("title"), href: CLIENT_ROUTES.list },
      { id: "client-detail", label: client?.businessName ?? tDetail("loading") },
    ],
    [client?.businessName, t, tDetail],
  );

  async function onCopyLink() {
    if (!client) return;
    const copied = await copyText(client.shareUrl);
    notify[copied ? "success" : "error"](copied ? t("table.copySuccess") : t("table.copyError"));
  }

  async function onToggleStatus(nextChecked: boolean) {
    if (!client) return;
    try {
      const result = await statusMutation.mutateAsync({
        clientId: client.id,
        action: nextChecked ? "activate" : "deactivate",
      });
      notify.success(
        result.message?.trim() || t(nextChecked ? "cardActions.success.active" : "cardActions.success.inactive"),
      );
    } catch (err) {
      notify.error(ApiError.messageFrom(err, t("cardActions.errorFallback")));
    }
  }

  async function confirmDelete() {
    if (!client) return;
    try {
      const result = await deleteMutation.mutateAsync(client.id);
      setIsDeleteOpen(false);
      notify.success(result.message?.trim() || t("table.deleteSuccess"));
      router.push(CLIENT_ROUTES.list);
    } catch (err) {
      notify.error(ApiError.messageFrom(err, t("table.deleteErrorFallback")));
    }
  }

  if (!clientId) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <EmptyState title={t("notFoundTitle")} description={t("notFoundBody")} icon={Icons.folderOpen} />
      </div>
    );
  }

  if (isPending || !user) {
    return <LoadingState skeletonVariant="detail" />;
  }

  if (isError || !client) {
    const status = error instanceof ApiError ? error.status : null;
    return (
      <div className="px-4 py-6 sm:px-6">
        <EmptyState
          title={status === 404 ? t("notFoundTitle") : t("loadErrorTitle")}
          description={status === 404 ? t("notFoundBody") : t("loadErrorBody")}
          icon={Icons.folderOpen}
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <DashboardModuleBreadcrumbSection items={breadcrumbItems} />

      <div className="mt-5 space-y-4">
        <section className={cn(elevatedCardSurfaceClass, "rounded-3xl p-3 sm:p-4")}>
          <div className="flex items-start gap-4">
            <UserAvatar name={client.businessName} imageUrl={client.logoImage} size="lg" variant="logo" />
            <div className={cn("min-w-0 flex-1", typeStackIdentityClass)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Heading sectionTitle className={cn("min-w-0 truncate", elevatedCardTitleClass)}>
                    {client.businessName}
                  </Heading>
                  <ClientStatusChip status={client.status} />
                  {canUpdate ? (
                    <ActiveInactiveToggle
                      checked={client.status === "active"}
                      isLoading={statusMutation.isPending}
                      ariaLabel={client.status === "active" ? t("cardActions.inactive") : t("cardActions.active")}
                      onCheckedChange={(nextChecked) => void onToggleStatus(nextChecked)}
                    />
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outlined" size="sm" onClick={() => void onCopyLink()}>
                    {t("copyLink")}
                  </Button>
                  {canUpdate ? (
                    <Button type="button" variant="outlined" size="sm" onClick={() => router.push(CLIENT_ROUTES.edit(client.id))}>
                      {t("editClient")}
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="outlined"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setIsDeleteOpen(true)}
                    >
                      {t("deleteClient")}
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className={cn(typeMetaRowClass, "sm:flex-nowrap")}>
                <span className={cn(typeIconTextClass, "type-caption", elevatedCardBodyClass)}>
                  <Icons.globe className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                  <span className="truncate">{displayDetailValue(client.websiteUrl)}</span>
                </span>
                <span className={cn(typeIconTextClass, "type-caption", elevatedCardBodyClass)}>
                  <Icons.call className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                  <span className="truncate">{displayDetailValue(client.pocContactNumber)}</span>
                </span>
                <span className={cn(typeIconTextClass, "type-caption", elevatedCardBodyClass)}>
                  <Icons.mail className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                  <span className="truncate">{displayDetailValue(client.pocEmail)}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <ProjectDetailInfoCard
          title={tDetail("sectionShareTitle")}
          lead={tDetail("sectionShareLead")}
          icon={<Icons.link className="size-4 shrink-0" aria-hidden />}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="type-body-strong min-w-0 truncate text-text-primary">{client.shareUrl}</p>
            <Button type="button" variant="outlined" size="sm" className="shrink-0" onClick={() => void onCopyLink()}>
              {t("copyLink")}
            </Button>
          </div>
        </ProjectDetailInfoCard>

        <ClientIntakeSnapshot client={client} />
      </div>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t("table.deleteTitle")}
        description={t("table.deleteBody", { name: client.businessName })}
        action={
          <>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t("table.deleteCancel")}</AlertDialogCancel>
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
