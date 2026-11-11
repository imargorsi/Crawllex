import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { lensGet, lensPath } from "@/lib/lens/client";
import { lensErrorResponse } from "@/lib/lens/respond";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";

/** SEO dashboard of a project, as the Lens API returns it (score, issues, pages, runs). The Lens project id is the Crawllex project id. */
export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) return ApiResponse.error("Project Not Found.", {}, 404);

  const permissionError = await requireProjectPermission(auth, projectId, "dashboard.view");
  if (permissionError) return permissionError;

  try {
    const body = await lensGet<Record<string, unknown>>(lensPath("projects", projectId, "seo"));
    return ApiResponse.success(body);
  } catch (error) {
    return lensErrorResponse(error);
  }
});
