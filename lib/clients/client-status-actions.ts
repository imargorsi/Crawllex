import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { ApiResponse } from "@/lib/api/response";
import { NotFoundError, ValidationError } from "@/lib/api/http-errors";
import { resolveClientStatus, type TClientStatus } from "@/lib/clients/constants";
import { serializeClient } from "@/lib/serializers/client";
import { Client, type ClientDocument } from "@/models";

async function findClientOrThrow(clientId: string): Promise<ClientDocument> {
  if (!mongoose.isValidObjectId(clientId)) {
    throw new NotFoundError("Client");
  }

  const client = await Client.findById(clientId);
  if (!client) {
    throw new NotFoundError("Client");
  }

  return client;
}

function assertClientStatus(client: ClientDocument, expectedStatus: TClientStatus, actionLabel: string): void {
  const current = resolveClientStatus(client.status);
  if (current !== expectedStatus) {
    throw new ValidationError(
      { status: [`Client must be ${expectedStatus} to ${actionLabel}.`] },
      `Client cannot be ${actionLabel} in its current state.`,
    );
  }
}

export async function activateClient(clientId: string): Promise<ClientDocument> {
  const client = await findClientOrThrow(clientId);
  assertClientStatus(client, "inactive", "activated");
  client.status = "active";
  await client.save();
  return client;
}

export async function deactivateClient(clientId: string): Promise<ClientDocument> {
  const client = await findClientOrThrow(clientId);
  assertClientStatus(client, "active", "deactivated");
  client.status = "inactive";
  await client.save();
  return client;
}

export function buildClientStatusResponse(client: ClientDocument, message: string): NextResponse {
  return ApiResponse.success(serializeClient(client), message);
}
