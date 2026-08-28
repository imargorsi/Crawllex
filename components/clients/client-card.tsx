"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { ClientStatusChip } from "@/components/clients/client-status-chip";
import { ActiveInactiveToggle } from "@/components/ui/active-inactive-toggle";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useClientStatusActionMutation } from "@/features/clients/clients.api";
import type { TClientListItem } from "@/types/client.types";
import { ApiError } from "@/lib/frontend/api/errors";
import { CLIENT_ROUTES } from "@/lib/frontend/clients/client-routes.utils";
import { notify } from "@/lib/frontend/feedback/notify";
import { Icons } from "@/lib/frontend/icons/app-icons";
import {
  elevatedCardBodyClass,
  elevatedCardMutedClass,
  elevatedCardSurfaceClass,
  elevatedCardTitleClass,
  typeIconTextClass,
  typeStackMdClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { ACTION_ICON_WELL } from "@/lib/frontend/projects/project-action-styles.utils";
import { cn } from "@/lib/utils";

type TClientCardProps = {
  client: TClientListItem;
  canUpdate: boolean;
  canDelete: boolean;
  onCopyLink: (client: TClientListItem) => void;
  onDeleteClient: (client: TClientListItem) => void;
};

export function ClientCard({
  client,
  canUpdate,
  canDelete,
  onCopyLink,
  onDeleteClient,
}: TClientCardProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients" });
  const { t: tActions } = useTranslation("translation", { keyPrefix: "modules.clients.cardActions" });
  const statusMutation = useClientStatusActionMutation();
  const isPending = statusMutation.isPending && statusMutation.variables?.clientId === client.id;
  const isActive = client.status === "active";

  async function onToggleStatus(nextChecked: boolean) {
    try {
      const result = await statusMutation.mutateAsync({
        clientId: client.id,
        action: nextChecked ? "activate" : "deactivate",
      });
      notify.success(result.message?.trim() || tActions(nextChecked ? "success.active" : "success.inactive"));
    } catch (error) {
      notify.error(ApiError.messageFrom(error, tActions("errorFallback")));
    }
  }

  const actions = [
    {
      key: "view",
      href: CLIENT_ROUTES.view(client.id),
      icon: Icons.view,
      label: tActions("viewDetails"),
      tone: "default" as const,
    },
    canUpdate
      ? {
          key: "edit",
          href: CLIENT_ROUTES.edit(client.id),
          icon: Icons.pencil,
          label: tActions("editClient"),
          tone: "muted" as const,
        }
      : null,
    {
      key: "copy",
      onClick: () => onCopyLink(client),
      icon: Icons.link,
      label: tActions("copyLink"),
      tone: "brand" as const,
    },
    canDelete
      ? {
          key: "delete",
          onClick: () => onDeleteClient(client),
          icon: Icons.delete,
          label: tActions("deleteClient"),
          tone: "destructive" as const,
        }
      : null,
  ].filter((action): action is NonNullable<typeof action> => action !== null);

  return (
    <article className={cn(elevatedCardSurfaceClass, "rounded-3xl p-5 sm:p-6")}>
      <div className="flex items-start justify-between gap-3">
        <UserAvatar name={client.businessName} imageUrl={client.imageUrl} size="lg" variant="logo" />
        <div className="flex shrink-0 items-center gap-2">
          <ClientStatusChip status={client.status} />
          {canUpdate ? (
            <ActiveInactiveToggle
              checked={isActive}
              isLoading={isPending}
              ariaLabel={isActive ? tActions("inactive") : tActions("active")}
              onCheckedChange={(nextChecked) => void onToggleStatus(nextChecked)}
            />
          ) : null}
        </div>
      </div>

      <div className={cn("mt-4", typeStackMdClass)}>
        <h3 className={cn("type-title", elevatedCardTitleClass)}>{client.businessName}</h3>
        <p className={cn(typeIconTextClass, "type-body", elevatedCardBodyClass)}>
          <Icons.file className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{client.projectName}</span>
        </p>
      </div>

      <div className="mt-6 min-w-0">
        <p className={cn("type-caption", elevatedCardMutedClass)}>{t("listCard.shareLabel")}</p>
        <p className={cn("mt-2 truncate type-body", elevatedCardTitleClass)}>{client.shareUrl}</p>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div
          className={cn(
            "grid gap-2.5",
            actions.length === 1 && "grid-cols-1",
            actions.length === 2 && "grid-cols-2",
            actions.length === 3 && "grid-cols-3",
            actions.length >= 4 && "grid-cols-2 sm:grid-cols-4",
          )}
        >
          {actions.map((action) => {
            const Icon = action.icon;
            const surfaceClass = "group relative flex min-w-0 flex-1 flex-col items-center gap-2";
            const content = (
              <>
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full border transition-transform duration-200 group-hover:scale-105",
                    ACTION_ICON_WELL[action.tone],
                  )}
                  aria-hidden
                >
                  <Icon className="size-5" />
                </span>
                <span
                  className={cn(
                    "type-caption-xs text-center font-semibold leading-tight transition-colors group-hover:text-text-primary",
                    elevatedCardTitleClass,
                  )}
                >
                  {action.label}
                </span>
              </>
            );

            if ("href" in action && action.href) {
              return (
                <Link key={action.key} href={action.href} className={surfaceClass}>
                  {content}
                </Link>
              );
            }

            return (
              <button key={action.key} type="button" className={surfaceClass} onClick={action.onClick}>
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
