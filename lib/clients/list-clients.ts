import { NextResponse } from "next/server";

import { ApiResponse } from "@/lib/api/response";
import type { TClientStatus } from "@/lib/clients/constants";
import { serializeClientListItem } from "@/lib/serializers/client";
import { upgradeLegacyClientShareSlug } from "@/lib/clients/share-token";
import type { TClientListItem } from "@/types/client.types";
import { Client } from "@/models";

export type ListClientsOptions = {
  status?: TClientStatus;
};

function buildStatusFilter(status?: TClientStatus) {
  if (status === "inactive") {
    return { status: "inactive" as const };
  }
  if (status === "active") {
    return { status: { $ne: "inactive" as const } };
  }
  return {};
}

export async function listClients(options: ListClientsOptions = {}): Promise<TClientListItem[]> {
  const clients = await Client.find(buildStatusFilter(options.status)).sort({ createdAt: -1 });
  await Promise.all(clients.map((client) => upgradeLegacyClientShareSlug(client)));
  return clients.map((client) => serializeClientListItem(client));
}

export function buildListClientsResponse(clients: TClientListItem[]): NextResponse {
  return ApiResponse.success({
    items: clients,
  });
}
