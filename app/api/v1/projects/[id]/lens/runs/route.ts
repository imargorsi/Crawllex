import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { queueLensRun } from "@/lib/lens/actions";
import { lensErrorResponse } from "@/lib/lens/respond";
import { connectDb } from "@/lib/db/mongoose";
import { Project } from "@/models";
import mongoose from "mongoose";

/**
 * Manual Lens check. Super admin only. Scheduled and first checks are queued by Lens; this is the only
 * way a person starts a check. The project must be active.
 */
export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request, { superAdmin: true });
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId || !mongoose.isValidObjectId(projectId)) return ApiResponse.error("Project Not Found.", {}, 404);

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
