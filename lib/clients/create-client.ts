import { NextResponse } from "next/server";

import { ApiResponse } from "@/lib/api/response";
import type { AuthContext } from "@/lib/auth/guards";
import { mapCreateClientFields } from "@/lib/clients/client-field-map.utils";
import { DEFAULT_CLIENT_STATUS } from "@/lib/clients/constants";
import { persistClientIntakeFiles } from "@/lib/clients/client-file-storage";
import { deleteClient } from "@/lib/clients/delete-client";
import { createUniqueClientShareSlug } from "@/lib/clients/share-token";
import { serializeClient } from "@/lib/serializers/client";
import { Client, type ClientDocument } from "@/models";
import type { CreateClientInput } from "@/schemas/client";

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof Error && (error as Error & { code?: number }).code === 11000;
}

const MAX_SHARE_TOKEN_ATTEMPTS = 3;

export async function createClient(
  auth: AuthContext,
  input: CreateClientInput,
  options?: { logoImage?: string | null; assetFiles?: File[] },
): Promise<{ client: ClientDocument }> {
  const fields = mapCreateClientFields(input);
  const logoImage = options?.logoImage ?? null;
  const assetFiles = options?.assetFiles ?? [];

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_SHARE_TOKEN_ATTEMPTS; attempt += 1) {
    try {
      const client = await Client.create({
        ...fields,
        status: DEFAULT_CLIENT_STATUS,
        logoImage,
        files: [],
        shareToken: await createUniqueClientShareSlug(fields.businessName),
        createdByUserId: auth.user._id,
        updatedByUserId: auth.user._id,
      });

      try {
        if (assetFiles.length > 0) {
          await persistClientIntakeFiles(client, assetFiles);
        }
        return { client };
      } catch (error) {
        await deleteClient(client._id.toString()).catch(() => undefined);
        throw error;
      }
    } catch (error) {
      lastError = error;
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

export function buildCreateClientResponse(client: ClientDocument): NextResponse {
  return ApiResponse.success(serializeClient(client), "Client created.", 201);
}
