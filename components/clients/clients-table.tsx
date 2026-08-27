"use client";

import { useTranslation } from "react-i18next";

import { AppTable } from "@/components/table/app-table";
import { useClientsTableColumns, type TClientTableRow } from "@/hooks/use-clients-table-columns.hook";
import { CLIENT_ROUTES } from "@/lib/frontend/clients/client-routes.utils";
import type { TClientListItem } from "@/types/client.types";
import { useRouter } from "next/navigation";

type TClientsTableProps = {
  clients: TClientListItem[];
  isLoading: boolean;
  isFetching?: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onCopyLink: (client: TClientListItem) => void;
  onDeleteClient: (client: TClientListItem) => void;
  onStatusAction: (client: TClientListItem, nextActive: boolean) => void;
  statusActionPendingClientId?: string | null;
};

export function ClientsTable({
  clients,
  isLoading,
  isFetching = false,
  canUpdate,
  canDelete,
  onCopyLink,
  onDeleteClient,
  onStatusAction,
  statusActionPendingClientId = null,
}: TClientsTableProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients" });
  const router = useRouter();
  const columns = useClientsTableColumns({
    canUpdate,
    canDelete,
    onCopyLink,
    onDeleteClient,
    onStatusAction,
    statusActionPendingClientId,
  });

  return (
    <AppTable
      columns={columns}
      data={clients as TClientTableRow[]}
      getRowId={(item) => item.id}
      isLoading={isLoading}
      isFetching={isFetching}
      emptyTitle={t("statusFilter.emptyTitle")}
      emptyBody={t("statusFilter.emptyBody")}
      onRowClick={(item) => router.push(CLIENT_ROUTES.view(item.id))}
      getRowClickLabel={(item) => t("table.viewClient", { name: item.businessName })}
    />
  );
}
