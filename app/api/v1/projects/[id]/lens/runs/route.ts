import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { queueLensRun } from "@/lib/lens/actions";
import { lensErrorResponse } from "@/lib/lens/respond";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";
import { Project } from "@/models";
import mongoose from "mongoose";

/**
 * Manual Lens check. Needs `lens.run` on the project. The permission is restricted: no role has it by default,
 * and only a super admin can assign it. Scheduled and first checks are queued by Lens, not by this route.
 * The project must be active.
 */
export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId || !mongoose.isValidObjectId(projectId)) return ApiResponse.error("Project Not Found.", {}, 404);

  const permissionError = await requireProjectPermission(auth, projectId, "lens.run");
  if (permissionError) return permissionError;

  const project = await Project.findById(projectId);
  if (!project) return ApiResponse.error("Project Not Found.", {}, 404);
  if (project.status !== "active") return ApiResponse.error("Only active projects can be checked.", {}, 409);

  try {
    const job = await queueLensRun({
      id: String(project._id),
      businessName: project.businessName,
      websiteUrl: project.websiteUrl,
      status: project.status,
    });
    return ApiResponse.success(job);
  } catch (error) {
    return lensErrorResponse(error);
  }
});
