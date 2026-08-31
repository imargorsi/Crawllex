import { NextResponse } from "next/server";

import { ApiResponse } from "@/lib/api/response";
import type { AuthContext } from "@/lib/auth/guards";
import { mapUpdateClientFields } from "@/lib/clients/client-field-map.utils";
import { assertClientIntakeFilesReady, persistClientIntakeFiles } from "@/lib/clients/client-file-storage";
import { deleteStoredClientLogo } from "@/lib/clients/client-logo-storage";
import { getClientById } from "@/lib/clients/get-client";
import { resolveClientLogoUpdate } from "@/lib/clients/parse-update-client-request";
import { createUniqueClientShareSlug, shouldRefreshClientShareSlug } from "@/lib/clients/share-token";
import { serializeClient } from "@/lib/serializers/client";
import type { ClientDocument } from "@/models";
import type { UpdateClientInput } from "@/schemas/client";

export async function updateClient(
  auth: AuthContext,
  clientId: string,
  input: UpdateClientInput,
  options?: { logoImage?: string | null; logoFile?: File | null; assetFiles?: File[] },
): Promise<{ client: ClientDocument }> {
  const client = await getClientById(clientId);
  const incoming = options?.assetFiles ?? [];
  assertClientIntakeFilesReady(client.files ?? [], incoming, input.retainedFileIds);

  const previousLogo = client.logoImage;
  let uploadedLogo: string | null = null;

  try {
    if (options?.logoFile) {
      uploadedLogo = await resolveClientLogoUpdate(auth, options.logoFile);
    } else if (options?.logoImage) {
      uploadedLogo = options.logoImage;
    }

    const fields = mapUpdateClientFields(input);
    Object.assign(client, fields);
    if (uploadedLogo) {
      client.logoImage = uploadedLogo;
    }
    if (shouldRefreshClientShareSlug(client.shareToken, client.businessName)) {
      client.shareToken = await createUniqueClientShareSlug(client.businessName, client._id.toString());
    }
    client.updatedByUserId = auth.user._id;

    await persistClientIntakeFiles(client, incoming, input.retainedFileIds);
  } catch (error) {
    if (uploadedLogo && uploadedLogo !== previousLogo) {
      await deleteStoredClientLogo(uploadedLogo).catch(() => undefined);
    }
    throw error;
  }

  if (uploadedLogo && previousLogo && previousLogo !== uploadedLogo) {
    await deleteStoredClientLogo(previousLogo).catch(() => undefined);
  }

  return { client };
}

export function buildUpdateClientResponse(client: ClientDocument): NextResponse {
  return ApiResponse.success(serializeClient(client), "Client updated.");
}
