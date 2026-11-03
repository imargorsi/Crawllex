import { ZodError } from "zod";

import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import { hasProjectPermission, requireProjectPermission } from "@/lib/projects/get-project-access";
import { createReport, listReports } from "@/lib/reports/report-service";
import { createReportSchema } from "@/schemas/reports";

function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] ? String(issue.path[0]) : "body";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) {
    return ApiResponse.error("Project Not Found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, projectId, "reports.view");
  if (permissionError) return permissionError;

  const includeDeliveries = await hasProjectPermission(auth, projectId, "reports.create");
  const reports = await listReports(projectId, { includeDeliveries });
  return ApiResponse.success(reports);
});

export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) {
    return ApiResponse.error("Project Not Found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, projectId, "reports.create");
  if (permissionError) return permissionError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.validation("Invalid Request Body.", {
      body: ["Request Body Must Be Valid JSON."],
    });
  }

  let input;
  try {
    input = createReportSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return ApiResponse.validation("Validation failed.", zodFieldErrors(error));
    }
    throw error;
  }

  const report = await createReport(projectId, String(auth.user._id), input);
  return ApiResponse.success(report, "Report created.", 201);
});
