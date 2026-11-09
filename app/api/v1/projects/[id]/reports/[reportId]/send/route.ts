import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";
import { sendReport } from "@/lib/reports/report-service";

/** Emails the report to its recipients. Only after the team has reviewed the preview. */
export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const params = (await context!.params) as { id: string; reportId: string };
  if (!params.id) {
    return ApiResponse.error("Project Not Found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, params.id, "reports.create");
  if (permissionError) return permissionError;

  const report = await sendReport(params.id, params.reportId);
  if (!report) {
    return ApiResponse.error("Report Not Found.", {}, 404);
  }

  return ApiResponse.success(report, "Report sent.");
});
