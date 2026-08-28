import { withApiHandler } from "@/lib/api/handler";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { buildCreateClientResponse, createClient } from "@/lib/clients/create-client";
import { buildListClientsResponse, listClients } from "@/lib/clients/list-clients";
import {
  parseCreateClientRequest,
  resolveClientLogo,
} from "@/lib/clients/parse-create-client-request";
import { connectDb } from "@/lib/db/mongoose";
import { parseListClientsQuery } from "@/schemas/list-clients-query";

export const GET = withApiHandler(async (request) => {
  await connectDb();

  const auth = await runApiGuards(request, { superAdmin: true });
  if (auth instanceof Response) return auth;

  const query = parseListClientsQuery(new URL(request.url).searchParams);
  const clients = await listClients({ status: query.status });
  return buildListClientsResponse(clients);
});

export const POST = withApiHandler(async (request) => {
  await connectDb();

  const auth = await runApiGuards(request, { superAdmin: true });
  if (auth instanceof Response) return auth;

  const { input, logoFile } = await parseCreateClientRequest(request);
  const logoImage = await resolveClientLogo(auth, logoFile);
  const { client } = await createClient(auth, input, { logoImage });

  return buildCreateClientResponse(client);
});
