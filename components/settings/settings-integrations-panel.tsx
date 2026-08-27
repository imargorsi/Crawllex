"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { IntegrationServiceCard } from "@/components/settings/integrations/integration-service-card";
import { WordpressLeadSourceCard } from "@/components/settings/integrations/wordpress-lead-source-card";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useProjectAccess } from "@/context/project-access-context";
import { useSelectedProject } from "@/context/selected-project-context";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import {
  useAnalyticsOverviewQuery,
  useConnectGoogleIntegrationMutation,
  useDisconnectGoogleIntegrationMutation,
  useGooglePropertiesQuery,
  useSyncGoogleIntegrationsMutation,
} from "@/features/analytics/analytics.api";
import {
  useCreateLeadSourceMutation,
  useDisconnectLeadSourceMutation,
  useLeadSourcesQuery,
  useRevealLeadSourceKeyMutation,
} from "@/features/leads/lead-sources.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { notify } from "@/lib/frontend/feedback/notify";
import {
  analyticsHeadingStackClass,
  settingsInsetDividerClass,
  typeStackMdClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import type { TGoogleIntegrationService } from "@/lib/integrations/constants";
import { defaultAnalyticsDateRange } from "@/lib/integrations/date.utils";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";
import { cn } from "@/lib/utils";

type TPendingAction =
  | { type: "connect" | "update"; service: TGoogleIntegrationService; propertyId: string }
  | { type: "disconnect"; service: TGoogleIntegrationService }
  | { type: "refresh" }
  | null;

export function SettingsIntegrationsPanel() {
  const { t } = useTranslation("translation", { keyPrefix: "settings.integrations" });
  const { selectedProject } = useSelectedProject();
  const { data: authUser } = useAuthUserQuery();
  const { projectPermissions } = useProjectAccess();
  const projectId = selectedProject?.id ?? null;
  const projectStatus = selectedProject?.status ?? null;
  const dateRange = useMemo(() => defaultAnalyticsDateRange(), []);

  const permissions = useMemo(
    () => mergePermissions(authUser?.permissions ?? [], projectPermissions),
    [authUser?.permissions, projectPermissions],
  );
  const canUpdate = hasPermission(permissions, "integrations.update");
  const canDisconnect = hasPermission(permissions, "integrations.disconnect");
  const canRefresh = hasPermission(permissions, "integrations.refresh");

  const overviewQuery = useAnalyticsOverviewQuery(projectId, dateRange, {
    enabled: Boolean(projectId),
  });
  const propertiesQuery = useGooglePropertiesQuery(projectId, {
    enabled: Boolean(projectId) && canUpdate,
  });
  const connectMutation = useConnectGoogleIntegrationMutation(projectId);
  const disconnectMutation = useDisconnectGoogleIntegrationMutation(projectId);
  const syncMutation = useSyncGoogleIntegrationsMutation(projectId);
  const leadSourcesQuery = useLeadSourcesQuery(projectId, { enabled: Boolean(projectId) });
  const createLeadSourceMutation = useCreateLeadSourceMutation(projectId);
  const revealLeadSourceKeyMutation = useRevealLeadSourceKeyMutation(projectId);
  const disconnectLeadSourceMutation = useDisconnectLeadSourceMutation(projectId);

  const gsc = overviewQuery.data?.integrations.gsc ?? null;
  const ga4 = overviewQuery.data?.integrations.ga4 ?? null;
  const [pending, setPending] = useState<TPendingAction>(null);

  const gscOptions = useMemo(
    () => (propertiesQuery.data ?? []).filter((item) => item.service === "gsc"),
    [propertiesQuery.data],
  );
  const ga4Options = useMemo(
    () => (propertiesQuery.data ?? []).filter((item) => item.service === "ga4"),
    [propertiesQuery.data],
  );

  const wordpressSource = leadSourcesQuery.data?.items[0] ?? null;
  const loadErrorNotified = useRef(false);

  const isGoogleBusy =
    connectMutation.isPending || disconnectMutation.isPending || syncMutation.isPending;
  const isWordpressBusy =
    createLeadSourceMutation.isPending ||
    revealLeadSourceKeyMutation.isPending ||
    disconnectLeadSourceMutation.isPending;

  useEffect(() => {
    loadErrorNotified.current = false;
  }, [projectId]);

  useEffect(() => {
    if (!leadSourcesQuery.error || loadErrorNotified.current) return;
    loadErrorNotified.current = true;
    notify.error(
      leadSourcesQuery.error instanceof Error
        ? leadSourcesQuery.error.message
        : t("wordpress.loadError"),
    );
  }, [leadSourcesQuery.error, t]);

  function requestConnectOrUpdate(
    service: TGoogleIntegrationService,
    nextPropertyId: string,
    mode: "connect" | "update",
  ) {
    if (!canUpdate) return;
    const trimmed = nextPropertyId.trim();
    if (!trimmed) {
      notify.error(t("propertyRequired"));
      return;
    }
    setPending({ type: mode, service, propertyId: trimmed });
  }

  async function runPending() {
    if (!pending || !projectId) return;

    try {
      if (pending.type === "refresh") {
        if (!canRefresh) return;
        await syncMutation.mutateAsync();
        notify.success(t("refreshSuccess"));
      } else if (pending.type === "disconnect") {
        if (!canDisconnect) return;
        await disconnectMutation.mutateAsync(pending.service);
        notify.success(t("disconnectSuccess"));
      } else {
        if (!canUpdate) return;
        await connectMutation.mutateAsync({
          service: pending.service,
          externalPropertyId: pending.propertyId,
        });
        notify.success(pending.type === "update" ? t("updateSuccess") : t("connectSuccess"));
      }
      setPending(null);
    } catch (error) {
      const fallback =
        pending.type === "refresh"
          ? t("refreshError")
          : pending.type === "disconnect"
            ? t("disconnectError")
            : pending.type === "update"
              ? t("updateError")
              : t("connectError");
      notify.error(error instanceof ApiError ? error.message : fallback);
    }
  }

  if (!projectId) {
    return (
      <EmptyState title={t("selectProjectTitle")} description={t("selectProjectBody")} />
    );
  }

  const confirmTitle =
    pending?.type === "refresh"
      ? t("confirmRefreshTitle")
      : pending?.type === "disconnect"
        ? t("confirmDisconnectTitle")
        : pending?.type === "update"
          ? t("confirmUpdateTitle")
          : t("confirmConnectTitle");

  const confirmBody =
    pending?.type === "refresh"
      ? t("confirmRefreshBody")
      : pending?.type === "disconnect"
        ? t("confirmDisconnectBody", {
            service: t(`services.${pending.service}`),
          })
        : pending?.type === "update"
          ? t("confirmUpdateBody", {
              service: t(`services.${pending.service}`),
            })
          : pending
            ? t("confirmConnectBody", {
                service: t(`services.${pending.service}`),
              })
            : "";

  const confirmLabel =
    pending?.type === "refresh"
      ? t("confirmRefresh")
      : pending?.type === "disconnect"
        ? t("confirmDisconnect")
        : pending?.type === "update"
          ? t("confirmUpdate")
          : t("confirmConnect");

  const confirmIcon =
    pending?.type === "disconnect"
      ? Icons.unlink
      : pending?.type === "refresh"
        ? Icons.refresh
        : Icons.alert;

  return (
    <div className="flex flex-col gap-6">
      <div className={cn(analyticsHeadingStackClass, "max-w-2xl")}>
        <p className="type-label text-text-primary">
          {t("projectContext", { name: selectedProject?.businessName ?? "—" })}
        </p>
        <p className="type-caption text-text-muted">{t("lead")}</p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className={cn(typeStackMdClass, "max-w-2xl")}>
            <h3 className="type-title text-text-primary">{t("analyticsTitle")}</h3>
            <p className="type-caption text-text-muted">{t("analyticsLead")}</p>
          </div>
          {canRefresh ? (
            <Button
              type="button"
              variant="outlined"
              size="md"
              disabled={isGoogleBusy}
              onClick={() => setPending({ type: "refresh" })}
              className="shrink-0"
            >
              <Icons.refresh className="size-4" aria-hidden />
              {t("refresh")}
            </Button>
          ) : null}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <IntegrationServiceCard
            key={`gsc-${projectId}-${gsc?.externalPropertyId ?? "none"}-${gsc?.status ?? "out"}`}
            service="gsc"
            integration={gsc}
            propertyOptions={gscOptions}
            onRequestConnectOrUpdate={(nextPropertyId, mode) =>
              requestConnectOrUpdate("gsc", nextPropertyId, mode)
            }
            onRequestDisconnect={() => setPending({ type: "disconnect", service: "gsc" })}
            isBusy={isGoogleBusy}
            canUpdate={canUpdate}
            canDisconnect={canDisconnect}
          />
          <IntegrationServiceCard
            key={`ga4-${projectId}-${ga4?.externalPropertyId ?? "none"}-${ga4?.status ?? "out"}`}
            service="ga4"
            integration={ga4}
            propertyOptions={ga4Options}
            onRequestConnectOrUpdate={(nextPropertyId, mode) =>
              requestConnectOrUpdate("ga4", nextPropertyId, mode)
            }
            onRequestDisconnect={() => setPending({ type: "disconnect", service: "ga4" })}
            isBusy={isGoogleBusy}
            canUpdate={canUpdate}
            canDisconnect={canDisconnect}
          />
        </div>
      </section>

      <div className={settingsInsetDividerClass} aria-hidden />

      <section className="flex flex-col gap-4">
        <div className={cn(typeStackMdClass, "max-w-2xl")}>
          <h3 className="type-title text-text-primary">{t("leadsTitle")}</h3>
          <p className="type-caption text-text-muted">{t("leadsLead")}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <WordpressLeadSourceCard
            source={wordpressSource}
            projectStatus={projectStatus}
            isBusy={isWordpressBusy}
            isListPending={leadSourcesQuery.isPending}
            hasListError={Boolean(leadSourcesQuery.error)}
            canUpdate={canUpdate}
            canDisconnect={canDisconnect}
            onConnect={() => createLeadSourceMutation.mutateAsync()}
            onViewKey={(sourceId) => revealLeadSourceKeyMutation.mutateAsync(sourceId)}
            onDisconnect={(sourceId) => disconnectLeadSourceMutation.mutateAsync(sourceId)}
            onSecretDialogClose={() => {
              createLeadSourceMutation.reset();
              revealLeadSourceKeyMutation.reset();
            }}
          />
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
        icon={confirmIcon}
        tone={pending?.type === "disconnect" ? "destructive" : "default"}
        title={confirmTitle}
        description={confirmBody}
        action={
          <>
            <AlertDialogCancel disabled={isGoogleBusy}>{t("confirmCancel")}</AlertDialogCancel>
            <button
              type="button"
              className={cn(
                buttonVariants({
                  variant: pending?.type === "disconnect" ? "destructive" : "outlined",
                  size: "md",
                }),
              )}
              disabled={isGoogleBusy}
              onClick={() => void runPending()}
            >
              {confirmLabel}
            </button>
          </>
        }
      />
    </div>
  );
}
