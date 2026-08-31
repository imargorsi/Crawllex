import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { NotFoundError } from "@/lib/api/http-errors";
import { ApiResponse } from "@/lib/api/response";
import { serializeClient } from "@/lib/serializers/client";
import { upgradeLegacyClientShareSlug } from "@/lib/clients/share-token";
import { Client, type ClientDocument } from "@/models";

export async function getClientById(clientId: string): Promise<ClientDocument> {
  if (!mongoose.isValidObjectId(clientId)) {
    throw new NotFoundError("Client");
  }

  const client = await Client.findById(clientId);
  if (!client) {
    throw new NotFoundError("Client");
  }

  await upgradeLegacyClientShareSlug(client);
  return client;
}

export function buildGetClientResponse(client: ClientDocument): NextResponse {
  return ApiResponse.success(serializeClient(client));
}
