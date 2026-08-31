import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { buildDeleteClientResponse, deleteClient } from "@/lib/clients/delete-client";
import { buildGetClientResponse, getClientById } from "@/lib/clients/get-client";
import { parseUpdateClientRequest } from "@/lib/clients/parse-update-client-request";
import { buildUpdateClientResponse, updateClient } from "@/lib/clients/update-client";
import { connectDb } from "@/lib/db/mongoose";

export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request, { superAdmin: true });
  if (auth instanceof Response) return auth;

  const { id } = await context!.params;
  if (!id) {
    return ApiResponse.error("Client not found.", {}, 404);
  }

  const client = await getClientById(id);
  return buildGetClientResponse(client);
});

export const PATCH = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request, { superAdmin: true });
  if (auth instanceof Response) return auth;

  const { id } = await context!.params;
  if (!id) {
    return ApiResponse.error("Client not found.", {}, 404);
  }

  const { input, logoFile, assetFiles } = await parseUpdateClientRequest(request);
  const { client } = await updateClient(auth, id, input, {
    logoFile,
    assetFiles,
  });

  return buildUpdateClientResponse(client);
});

export const DELETE = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request, { superAdmin: true });
  if (auth instanceof Response) return auth;

  const { id } = await context!.params;
  if (!id) {
    return ApiResponse.error("Client not found.", {}, 404);
  }

  await deleteClient(id);
  return buildDeleteClientResponse();
});
