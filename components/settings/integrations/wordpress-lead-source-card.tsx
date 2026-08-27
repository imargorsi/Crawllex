"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { WordpressIntegrationLogo } from "@/components/integrations/wordpress-integration-logo";
import { LeadSourceKeyDialog } from "@/components/settings/integrations/lead-source-key-dialog";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiError } from "@/lib/frontend/api/errors";
import { downloadHrefAsFile } from "@/lib/frontend/download-file";
import { notify } from "@/lib/frontend/feedback/notify";
import {
  analyticsHeadingStackClass,
  analyticsPanelClass,
  elevatedCardSurfaceClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { getStatusChipClassName } from "@/lib/frontend/theme/status-colors";
import { WP_PLUGIN_ZIP_FILENAME, WP_PLUGIN_ZIP_HREF } from "@/lib/leads/constants";
import { cn } from "@/lib/utils";
import type { TLeadSourceDto } from "@/types/lead-source.types";

type TWordpressPending = "connect" | "disconnect" | null;

type TWordpressLeadSourceCardProps = {
  source: TLeadSourceDto | null;
  projectStatus: string | null;
  isBusy: boolean;
  isListPending: boolean;
  hasListError: boolean;
  canUpdate: boolean;
  canDisconnect: boolean;
  onConnect: () => Promise<{ plaintextKey: string }>;
  onViewKey: (sourceId: string) => Promise<{ plaintextKey: string }>;
  onDisconnect: (sourceId: string) => Promise<void>;
  onSecretDialogClose?: () => void;
};

function StatusPill({
  status,
  label,
}: {
  status: "disconnected" | "connected";
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 type-caption-xs font-medium",
        status === "connected" && getStatusChipClassName("active"),
        status === "disconnected" && getStatusChipClassName("inactive"),
      )}
    >
      {label}
    </span>
  );
}

export function WordpressLeadSourceCard({
  source,
  projectStatus,
  isBusy,
  isListPending,
  hasListError,
  canUpdate,
  canDisconnect,
  onConnect,
  onViewKey,
  onDisconnect,
  onSecretDialogClose,
}: TWordpressLeadSourceCardProps) {
  const { t } = useTranslation("translation", { keyPrefix: "settings.integrations" });
  const [pending, setPending] = useState<TWordpressPending>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const isLinked = Boolean(source);
  const isActiveProject = projectStatus === "active";
  const actionsLocked = isBusy || isListPending;

  async function downloadPlugin() {
    try {
      await downloadHrefAsFile(WP_PLUGIN_ZIP_HREF, WP_PLUGIN_ZIP_FILENAME);
    } catch {
      notify.error(t("wordpress.downloadError"));
    }
  }

  function requestConnect() {
    if (!canUpdate || hasListError || isListPending) return;
    if (!isActiveProject) {
      notify.error(t("wordpress.inactiveProject"));
      return;
    }
    setPending("connect");
  }

  async function viewKey() {
    if (!canUpdate || !source || actionsLocked) return;
    try {
      const result = await onViewKey(source.id);
      setRevealedKey(result.plaintextKey);
    } catch (error) {
      notify.error(error instanceof ApiError ? error.message : t("wordpress.viewKeyError"));
    }
  }

  async function runPending() {
    if (!pending || actionsLocked) return;

    try {
      if (pending === "connect") {
        const result = await onConnect();
        setPending(null);
        setRevealedKey(result.plaintextKey);
        notify.success(t("wordpress.connectSuccess"));
        return;
      }
      if (pending === "disconnect" && source) {
        await onDisconnect(source.id);
        setPending(null);
        notify.success(t("wordpress.disconnectSuccess"));
      }
    } catch (error) {
      const fallback =
        pending === "disconnect" ? t("wordpress.disconnectError") : t("wordpress.connectError");
      notify.error(error instanceof ApiError ? error.message : fallback);
    }
  }

  const confirmTitle =
    pending === "disconnect"
      ? t("wordpress.confirmDisconnectTitle")
      : t("wordpress.confirmConnectTitle");

  const confirmBody =
    pending === "disconnect"
      ? t("wordpress.confirmDisconnectBody")
      : t("wordpress.confirmConnectBody");

  const confirmLabel =
    pending === "disconnect"
      ? t("wordpress.confirmDisconnect")
      : t("wordpress.confirmConnect");

  return (
    <section className={cn(elevatedCardSurfaceClass, analyticsPanelClass, "h-full")}>
      <div className="flex flex-col gap-5">
        <div className={analyticsHeadingStackClass}>
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-bg-card/40 dark:border-text-primary/40 dark:bg-transparent"
              aria-hidden
            >
              <WordpressIntegrationLogo size={20} />
            </span>
            <h3 className="type-title text-text-primary">{t("wordpress.title")}</h3>
            <StatusPill
              status={isLinked ? "connected" : "disconnected"}
              label={t(isLinked ? "status.connected" : "status.disconnected")}
            />
          </div>
          <p className="type-caption text-text-muted">{t("wordpress.lead")}</p>
          {source?.siteUrl ? (
            <a
              href={source.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 type-caption text-text-muted transition-colors hover:text-text-primary"
            >
              <Icons.globe className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{source.siteUrl}</span>
            </a>
          ) : source ? (
            <p className="type-caption text-text-muted">{t("wordpress.siteUrlPending")}</p>
          ) : null}
          {source?.connectedAt ? (
            <p className="type-caption text-text-muted">
              {t("wordpress.connectedAt", { value: new Date(source.connectedAt).toLocaleString() })}
            </p>
          ) : null}
          {source?.lastVerifiedAt ? (
            <p className="type-caption text-text-muted">
              {t("wordpress.lastVerified", { value: new Date(source.lastVerifiedAt).toLocaleString() })}
            </p>
          ) : null}
          {source ? (
            <p className="type-caption text-text-muted">
              {t("wordpress.ingestStats", {
                ingested: source.ingestCount,
                failed: source.failedCount,
              })}
            </p>
          ) : null}
          {source?.lastError ? (
            <p className="type-caption text-destructive">{source.lastError}</p>
          ) : null}
          {hasListError ? (
            <p className="type-caption text-destructive">{t("wordpress.loadError")}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" variant="outlined" size="md" onClick={() => void downloadPlugin()}>
            <Icons.cloudDownload className="size-4" aria-hidden />
            {t("wordpress.downloadPlugin")}
          </Button>
          {canUpdate && !isLinked && !hasListError && !isListPending ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={actionsLocked}
              onClick={requestConnect}
            >
              <Icons.link className="size-4" aria-hidden />
              {t("wordpress.connect")}
            </Button>
          ) : null}
          {canUpdate && isLinked ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={actionsLocked}
              onClick={() => void viewKey()}
            >
              <Icons.view className="size-4" aria-hidden />
              {t("wordpress.viewKey")}
            </Button>
          ) : null}
          {isLinked && canDisconnect ? (
            <Button
              type="button"
              variant="outlined"
              size="md"
              disabled={actionsLocked}
              onClick={() => setPending("disconnect")}
            >
              <Icons.unlink className="size-4" aria-hidden />
              {t("wordpress.disconnect")}
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
        icon={pending === "disconnect" ? Icons.unlink : Icons.link}
        tone={pending === "disconnect" ? "destructive" : "default"}
        title={confirmTitle}
        description={confirmBody}
        action={
          <>
            <AlertDialogCancel disabled={actionsLocked}>{t("confirmCancel")}</AlertDialogCancel>
            <button
              type="button"
              className={cn(
                buttonVariants({
                  variant: pending === "disconnect" ? "destructive" : "outlined",
                  size: "md",
                }),
              )}
              disabled={actionsLocked}
              onClick={() => void runPending()}
            >
              {confirmLabel}
            </button>
          </>
        }
      />

      <LeadSourceKeyDialog
        open={Boolean(revealedKey)}
        plaintextKey={revealedKey ?? ""}
        onOpenChange={(open) => {
          if (!open) {
            setRevealedKey(null);
            onSecretDialogClose?.();
          }
        }}
      />
    </section>
  );
}
