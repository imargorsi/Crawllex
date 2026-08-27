import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import {
  buildCreateLeadSourceResponse,
  buildListLeadSourcesResponse,
  createLeadSource,
  listLeadSources,
} from "@/lib/leads/manage-lead-source";
import { requireProjectPermission } from "@/lib/projects/get-project-access";

export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) {
    return ApiResponse.error("Project not found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, projectId, "integrations.view");
  if (permissionError) return permissionError;

  const payload = await listLeadSources(projectId);
  return buildListLeadSourcesResponse(payload);
});

export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) {
    return ApiResponse.error("Project not found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, projectId, "integrations.update");
  if (permissionError) return permissionError;

  const payload = await createLeadSource(auth, projectId);
  return buildCreateLeadSourceResponse(payload);
});
