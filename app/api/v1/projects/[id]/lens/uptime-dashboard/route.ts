import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { lensGet, lensPath } from "@/lib/lens/client";
import { lensErrorResponse } from "@/lib/lens/respond";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";

/** Uptime screen data (rolling 30 days, real checks): `{ uptime, incidents }` in the TLensUptime / TLensIncident contract. */
export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) return ApiResponse.error("Project Not Found.", {}, 404);

  const permissionError = await requireProjectPermission(auth, projectId, "lens.view");
  if (permissionError) return permissionError;

  try {
    return ApiResponse.success(await lensGet<unknown>(lensPath("projects", projectId, "uptime-dashboard")));
  } catch (error) {
    return lensErrorResponse(error);
  }
});
