import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { lensGet, lensPath } from "@/lib/lens/client";
import { lensErrorResponse } from "@/lib/lens/respond";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";

type LensList<T> = { items: T[] };

/** Overview of a project's Lens runs, open issues and incidents. The Lens project id is the Crawllex project id. */
export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) return ApiResponse.error("Project Not Found.", {}, 404);

  const permissionError = await requireProjectPermission(auth, projectId, "dashboard.view");
  if (permissionError) return permissionError;

  try {
    const base = lensPath("projects", projectId);
    const [runs, issues, incidents] = await Promise.all([
      lensGet<LensList<unknown>>(`${base}/runs`),
      lensGet<LensList<unknown>>(`${base}/issues`),
      lensGet<LensList<unknown>>(`${base}/incidents`),
    ]);
    return ApiResponse.success({ runs: runs.items, issues: issues.items, incidents: incidents.items });
  } catch (error) {
    return lensErrorResponse(error);
  }
});
