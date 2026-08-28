import { withApiHandler } from "@/lib/api/handler";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { activateClient, buildClientStatusResponse } from "@/lib/clients/client-status-actions";
import { connectDb } from "@/lib/db/mongoose";

export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request, { superAdmin: true });
  if (auth instanceof Response) return auth;

  const { id } = await context!.params;
  if (!id) {
    throw new Error("Client id is required.");
  }

  const client = await activateClient(id);
  return buildClientStatusResponse(client, "Client activated.");
});
