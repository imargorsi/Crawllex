import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { lensGet, lensPath } from "@/lib/lens/client";
import { lensErrorResponse } from "@/lib/lens/respond";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";

/** Uptime summary of a project: totals, daily series, incidents, and whether example data is included. */
export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) return ApiResponse.error("Project Not Found.", {}, 404);

  const permissionError = await requireProjectPermission(auth, projectId, "lens.view");
  if (permissionError) return permissionError;

  const days = new URL(request.url).searchParams.get("days") ?? "7";
  try {
    const summary = await lensGet<unknown>(`${lensPath("projects", projectId, "uptime")}?days=${encodeURIComponent(days)}`);
    return ApiResponse.success(summary);
  } catch (error) {
    return lensErrorResponse(error);
  }
});
