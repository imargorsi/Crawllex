import { NextResponse } from "next/server";

import { ApiResponse } from "@/lib/api/response";
import type { AuthContext } from "@/lib/auth/guards";
import { mapUpdateClientFields } from "@/lib/clients/client-field-map.utils";
import { deleteStoredClientLogo } from "@/lib/clients/client-logo-storage";
import { getClientById } from "@/lib/clients/get-client";
import { serializeClient } from "@/lib/serializers/client";
import type { ClientDocument } from "@/models";
import type { UpdateClientInput } from "@/schemas/client";

export async function updateClient(
  auth: AuthContext,
  clientId: string,
  input: UpdateClientInput,
  presentFields: ReadonlySet<string>,
  options?: { logoImage?: string | null },
): Promise<{ client: ClientDocument }> {
  const client = await getClientById(clientId);
  const previousLogo = client.logoImage;
  const fields = mapUpdateClientFields(input, presentFields);

  Object.assign(client, fields);
  if (options?.logoImage) {
    client.logoImage = options.logoImage;
  }
  client.updatedByUserId = auth.user._id;
  await client.save();

  if (options?.logoImage && previousLogo && previousLogo !== options.logoImage) {
    await deleteStoredClientLogo(previousLogo).catch(() => undefined);
  }

  return { client };
}

export function buildUpdateClientResponse(client: ClientDocument): NextResponse {
  return ApiResponse.success(serializeClient(client), "Client updated.");
}
