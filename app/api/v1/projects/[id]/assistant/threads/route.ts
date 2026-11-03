import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { listAssistantThreads } from "@/lib/assistant/history";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";

export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) return ApiResponse.error("Project Not Found.", {}, 404);

  const permissionError = await requireProjectPermission(auth, projectId, "dashboard.view");
  if (permissionError) return permissionError;

  // Only the signed-in user's own conversations are listed.
  const items = await listAssistantThreads(projectId, auth.user._id.toString());
  return ApiResponse.success({ items });
});
