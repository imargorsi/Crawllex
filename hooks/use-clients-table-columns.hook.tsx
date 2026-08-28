"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ClientStatusChip } from "@/components/clients/client-status-chip";
import type { TAppTableColumn } from "@/components/table/app-table";
import { TableRowIconActions } from "@/components/table/table-row-icon-actions";
import { ActiveInactiveToggle } from "@/components/ui/active-inactive-toggle";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CLIENT_ROUTES } from "@/lib/frontend/clients/client-routes.utils";
import type { TClientListItem } from "@/types/client.types";

export type TClientTableRow = TClientListItem & Record<string, unknown>;

type TUseClientsTableColumnsInput = {
  canUpdate: boolean;
  canDelete: boolean;
  onCopyLink: (client: TClientListItem) => void;
  onDeleteClient: (client: TClientListItem) => void;
  onStatusAction: (client: TClientListItem, nextActive: boolean) => void;
  statusActionPendingClientId?: string | null;
};

export function useClientsTableColumns({
  canUpdate,
  canDelete,
  onCopyLink,
  onDeleteClient,
  onStatusAction,
  statusActionPendingClientId = null,
}: TUseClientsTableColumnsInput): TAppTableColumn<TClientTableRow>[] {
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients.table" });
  const { t: tActions } = useTranslation("translation", { keyPrefix: "modules.clients.cardActions" });
  const router = useRouter();

  return useMemo(
    () => [
      {
        key: "client",
        label: t("colClient"),
        headerIcon: Icons.building,
        render: (item) => (
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={item.businessName} imageUrl={item.imageUrl} size="md" variant="logo" />
            <div className="min-w-0">
              <p className="truncate type-body-strong text-text-primary">{item.businessName}</p>
              <p className="truncate type-caption text-text-muted">{item.projectName}</p>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        label: t("colStatus"),
        headerIcon: Icons.checkCircle,
        render: (item) => (
          <div className="flex items-center gap-2">
            <ClientStatusChip status={item.status} />
            {canUpdate ? (
              <ActiveInactiveToggle
                checked={item.status === "active"}
                isLoading={statusActionPendingClientId === item.id}
                ariaLabel={item.status === "active" ? tActions("inactive") : tActions("active")}
                onCheckedChange={(nextChecked) => onStatusAction(item, nextChecked)}
              />
            ) : null}
          </div>
        ),
      },
      {
        key: "actions",
        label: t("colActions"),
        align: "end",
        render: (item) => (
          <TableRowIconActions
            actions={[
              {
                key: "view",
                icon: <Icons.view className="size-4" aria-hidden />,
                label: t("viewClient", { name: item.businessName }),
                onClick: () => router.push(CLIENT_ROUTES.view(item.id)),
              },
              {
                key: "copy",
                icon: <Icons.link className="size-4" aria-hidden />,
                label: t("copyLink", { name: item.businessName }),
                onClick: () => onCopyLink(item),
              },
              ...(canUpdate
                ? [
                    {
                      key: "edit",
                      icon: <Icons.pencil className="size-4" aria-hidden />,
                      label: t("editClient", { name: item.businessName }),
                      onClick: () => router.push(CLIENT_ROUTES.edit(item.id)),
                    },
                  ]
                : []),
              ...(canDelete
                ? [
                    {
                      key: "delete",
                      icon: <Icons.delete className="size-4" aria-hidden />,
                      label: t("deleteClient", { name: item.businessName }),
                      onClick: () => onDeleteClient(item),
                      className: "text-destructive hover:bg-destructive/10 hover:text-destructive",
                    },
                  ]
                : []),
            ]}
          />
        ),
      },
    ],
    [
      canDelete,
      canUpdate,
      onCopyLink,
      onDeleteClient,
      onStatusAction,
      router,
      statusActionPendingClientId,
      t,
      tActions,
    ],
  );
}
