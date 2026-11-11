import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { deleteAssistantThread, getAssistantThreadMessages } from "@/lib/assistant/history";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";

const THREAD_ID = /^[A-Za-z0-9-]{8,64}$/;

export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId, threadId } = await context!.params;
  if (!projectId) return ApiResponse.error("Project Not Found.", {}, 404);

  const permissionError = await requireProjectPermission(auth, projectId, "oriel.view");
  if (permissionError) return permissionError;

  if (!THREAD_ID.test(threadId)) return ApiResponse.error("Conversation Not Found.", {}, 404);

  const messages = await getAssistantThreadMessages(projectId, auth.user._id.toString(), threadId);
  if (messages.length === 0) return ApiResponse.error("Conversation Not Found.", {}, 404);
  return ApiResponse.success({ threadId, messages });
});

export const DELETE = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId, threadId } = await context!.params;
  if (!projectId) return ApiResponse.error("Project Not Found.", {}, 404);

  const permissionError = await requireProjectPermission(auth, projectId, "oriel.delete");
  if (permissionError) return permissionError;

  if (!THREAD_ID.test(threadId)) return ApiResponse.error("Conversation Not Found.", {}, 404);

  const removed = await deleteAssistantThread(projectId, auth.user._id.toString(), threadId);
  if (removed === 0) return ApiResponse.error("Conversation Not Found.", {}, 404);
  return ApiResponse.success({ threadId, removed }, "Conversation deleted.");
});
