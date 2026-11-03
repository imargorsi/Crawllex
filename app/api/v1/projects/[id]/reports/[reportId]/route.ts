import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import { hasProjectPermission, requireProjectPermission } from "@/lib/projects/get-project-access";
import { deleteReport, getReport } from "@/lib/reports/report-service";

type TRouteParams = { id: string; reportId: string };

export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId, reportId } = (await context!.params) as TRouteParams;
  if (!projectId) {
    return ApiResponse.error("Project Not Found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, projectId, "reports.view");
  if (permissionError) return permissionError;

  const includeDeliveries = await hasProjectPermission(auth, projectId, "reports.create");
  const report = await getReport(projectId, reportId, { includeDeliveries });
  if (!report) {
    return ApiResponse.error("Report Not Found.", {}, 404);
  }

  return ApiResponse.success(report);
});

export const DELETE = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId, reportId } = (await context!.params) as TRouteParams;
  if (!projectId) {
    return ApiResponse.error("Project Not Found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, projectId, "reports.delete");
  if (permissionError) return permissionError;

  const deleted = await deleteReport(projectId, reportId);
  if (!deleted) {
    return ApiResponse.error("Report Not Found.", {}, 404);
  }

  return ApiResponse.success(null, "Report deleted.");
});
