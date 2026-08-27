import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import {
  buildRotateLeadSourceResponse,
  rotateLeadSourceKey,
} from "@/lib/leads/manage-lead-source";
import { requireProjectPermission } from "@/lib/projects/get-project-access";

export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const params = await context!.params;
  const projectId = params.id;
  const sourceId = params.sourceId;

  if (!projectId || !sourceId) {
    return ApiResponse.error("Lead source not found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, projectId, "integrations.update");
  if (permissionError) return permissionError;

  const payload = await rotateLeadSourceKey(auth, projectId, sourceId);
  return buildRotateLeadSourceResponse(payload);
});
