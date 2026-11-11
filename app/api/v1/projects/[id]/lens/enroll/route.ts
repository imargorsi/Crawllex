import mongoose from "mongoose";

import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { enrollLensProject } from "@/lib/lens/actions";
import { lensErrorResponse } from "@/lib/lens/respond";
import { connectDb } from "@/lib/db/mongoose";
import { Project } from "@/models";

/**
 * Enrolls an active project in Lens. Super admin only. Lens queues the first audit in the background.
 * Idempotent: a project already enrolled is not enrolled again and gets no new first audit.
 * The enrollment is saved only after Lens accepts it.
 */
export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request, { superAdmin: true });
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId || !mongoose.isValidObjectId(projectId)) return ApiResponse.error("Project Not Found.", {}, 404);

  const project = await Project.findById(projectId);
  if (!project) return ApiResponse.error("Project Not Found.", {}, 404);
  if (project.status !== "active") return ApiResponse.error("Only active projects can be enrolled in Lens.", {}, 409);
  if (project.lensEnrolledAt) {
    return ApiResponse.success({ lensEnrolled: true, alreadyEnrolled: true, firstRunQueued: false });
  }

  try {
    const { firstRunQueued } = await enrollLensProject({
      id: String(project._id),
      businessName: project.businessName,
      websiteUrl: project.websiteUrl,
      status: project.status,
    });
    project.lensEnrolledAt = new Date();
    project.lensEnrolledByUserId = auth.user._id;
    await project.save();
    return ApiResponse.success({ lensEnrolled: true, alreadyEnrolled: false, firstRunQueued }, "Project enrolled in Lens.");
  } catch (error) {
    return lensErrorResponse(error);
  }
});
