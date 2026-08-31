import { NextResponse } from "next/server";

import { NotFoundError } from "@/lib/api/http-errors";
import { ApiResponse } from "@/lib/api/response";
import { CLIENT_SHARE_TOKEN_UNAVAILABLE_MESSAGE, resolveClientStatus } from "@/lib/clients/constants";
import { isClientSharePathFormat } from "@/lib/clients/share-token";
import { serializePublicClient } from "@/lib/serializers/client";
import { Client } from "@/models";

export async function getPublicClientByShareToken(shareToken: string) {
  if (!isClientSharePathFormat(shareToken)) {
    throw new NotFoundError("Client");
  }

  const client = await Client.findOne({ shareToken });
  if (!client || resolveClientStatus(client.status) !== "active") {
    throw new NotFoundError("Client");
  }

  return client;
}

export function buildPublicClientResponse(client: Awaited<ReturnType<typeof getPublicClientByShareToken>>): NextResponse {
  return ApiResponse.success(serializePublicClient(client));
}

export function buildPublicClientUnavailableResponse(): NextResponse {
  return ApiResponse.error(CLIENT_SHARE_TOKEN_UNAVAILABLE_MESSAGE, {}, 404);
}
