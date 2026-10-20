import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import { checkWpSourceConnection } from "@/lib/integrations/wordpress/wp-source";
import { requireProjectPermission } from "@/lib/projects/get-project-access";

export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const params = await context!.params;
  if (!params.id || !params.sourceId) {
    return ApiResponse.error("Lead source not found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, params.id, "integrations.view");
  if (permissionError) return permissionError;

  const user = await checkWpSourceConnection(params.id, params.sourceId);
  return ApiResponse.success({ wordpressUser: user }, "WordPress connection works.");
});
