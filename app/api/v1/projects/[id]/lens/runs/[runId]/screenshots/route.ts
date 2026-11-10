import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { lensGet, lensPath } from "@/lib/lens/client";
import { lensErrorResponse } from "@/lib/lens/respond";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";

/** Screenshot file names of one Lens run (relative paths, png only). */
export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId, runId } = await context!.params;
  if (!projectId || !runId) return ApiResponse.error("Not Found.", {}, 404);

  const permissionError = await requireProjectPermission(auth, projectId, "dashboard.view");
  if (permissionError) return permissionError;

  try {
    const body = await lensGet<{ items: string[] }>(lensPath("projects", projectId, "runs", runId, "screenshots"));
    return ApiResponse.success({ items: body.items });
  } catch (error) {
    return lensErrorResponse(error);
  }
});
