import { withApiHandler } from "@/lib/api/handler";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import {
  approveProject,
  buildProjectStatusResponse,
} from "@/lib/projects/project-status-actions";
import { connectDb } from "@/lib/db/mongoose";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request, { superAdmin: true });
  if (auth instanceof Response) return auth;

  const { id } = await context!.params;
  if (!id) {
    throw new Error("Project id is required.");
  }

  const project = await approveProject(auth, id);

  return buildProjectStatusResponse(project, "Project approved.");
});
