import mongoose from "mongoose";

import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { getLensSchedule, setLensFrequency } from "@/lib/lens/actions";
import { lensErrorResponse } from "@/lib/lens/respond";
import { isLensFrequency } from "@/lib/lens/schedule";
import { connectDb } from "@/lib/db/mongoose";
import { Project } from "@/models";

/**
 * Lens audit frequency for one enrolled project (Settings > Agents & AI). Super admin only.
 * GET returns { frequency, enabled, nextRunAt }. PUT { frequency: "weekly" | "twice_monthly" | "monthly" }.
 */
async function loadEnrolled(request: Request, context: { params: Promise<Record<string, string>> }) {
  await connectDb();
  const auth = await runApiGuards(request, { superAdmin: true });
  if (auth instanceof Response) return auth;
  const { id: projectId } = await context.params;
  if (!projectId || !mongoose.isValidObjectId(projectId)) return ApiResponse.error("Project Not Found.", {}, 404);
  const project = await Project.findById(projectId).select("lensEnrolledAt");
  if (!project) return ApiResponse.error("Project Not Found.", {}, 404);
  if (!project.lensEnrolledAt) return ApiResponse.error("Enroll the project in Lens first.", {}, 409);
  return { projectId };
}

export const GET = withApiHandler(async (request, context) => {
  const loaded = await loadEnrolled(request, context);
  if (loaded instanceof Response) return loaded;
  try {
    return ApiResponse.success(await getLensSchedule(loaded.projectId));
  } catch (error) {
    return lensErrorResponse(error);
  }
});

export const PUT = withApiHandler(async (request, context) => {
  const loaded = await loadEnrolled(request, context);
  if (loaded instanceof Response) return loaded;
  const body = (await request.json().catch(() => null)) as { frequency?: unknown } | null;
  if (!isLensFrequency(body?.frequency)) return ApiResponse.error("Choose weekly, twice a month or monthly.", {}, 400);
  try {
    await setLensFrequency(loaded.projectId, body.frequency);
    return ApiResponse.success(await getLensSchedule(loaded.projectId), "Audit frequency saved.");
  } catch (error) {
    return lensErrorResponse(error);
  }
});
