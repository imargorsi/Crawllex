import { withApiHandler } from "@/lib/api/handler";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import {
  approveProject,
  buildProjectStatusResponse,
} from "@/lib/projects/project-status-actions";
import { connectDb } from "@/lib/db/mongoose";
import { enrollLensProject } from "@/lib/lens/actions";

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

  // Enrolling starts the first Lens check. Best effort: an approval never fails because Lens is unavailable.
  // If it is missed, a super admin can start the check from the Lens page.
  try {
    await enrollLensProject({
      id: String(project._id),
      businessName: project.businessName,
      websiteUrl: project.websiteUrl,
      status: project.status,
    });
  } catch (error) {
    console.error("lens.enroll_failed", { projectId: id, reason: error instanceof Error ? error.message : "unknown" });
  }

  return buildProjectStatusResponse(project, "Project approved.");
});
