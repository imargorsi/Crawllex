import { NextResponse } from "next/server";

import { ApiResponse } from "@/lib/api/response";
import { deleteStoredClientFiles } from "@/lib/clients/client-file-storage";
import { deleteStoredClientLogo } from "@/lib/clients/client-logo-storage";
import { getClientById } from "@/lib/clients/get-client";
import { Client } from "@/models";

export async function deleteClient(clientId: string): Promise<void> {
  const client = await getClientById(clientId);
  const logoPath = client.logoImage;
  const files = [...(client.files ?? [])];
  const id = client._id;

  await Client.deleteOne({ _id: id });
  await deleteStoredClientLogo(logoPath).catch(() => undefined);
  await deleteStoredClientFiles(files).catch(() => undefined);
}

export function buildDeleteClientResponse(): NextResponse {
  return ApiResponse.success(null, "Client deleted.");
}
