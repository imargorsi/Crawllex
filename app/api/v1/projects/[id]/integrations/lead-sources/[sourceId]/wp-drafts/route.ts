import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import { pushWpDraft } from "@/lib/integrations/wordpress/wp-source";
import { requireProjectPermission } from "@/lib/projects/get-project-access";
import { wpDraftSchema } from "@/schemas/wordpress";

export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const params = await context!.params;
  if (!params.id || !params.sourceId) {
    return ApiResponse.error("Lead source not found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, params.id, "integrations.update");
  if (permissionError) return permissionError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.validation("Invalid Request Body.", {
      body: ["Request Body Must Be Valid JSON."],
    });
  }

  const input = wpDraftSchema.parse(body);
  const draft = await pushWpDraft(params.id, params.sourceId, input);
  return ApiResponse.success({ draft }, "Draft created in WordPress.");
});
