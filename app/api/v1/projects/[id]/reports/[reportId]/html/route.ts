import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";
import { getReport, reportHtmlDocument } from "@/lib/reports/report-service";

/** Same print document as the PDF, served for the browser preview. Review it here before sending. */
export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const params = (await context!.params) as { id: string; reportId: string };
  if (!params.id) {
    return ApiResponse.error("Project Not Found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, params.id, "reports.view");
  if (permissionError) return permissionError;

  const report = await getReport(params.id, params.reportId, { includeDeliveries: false });
  if (!report) {
    return ApiResponse.error("Report Not Found.", {}, 404);
  }

  return new NextResponse(reportHtmlDocument(report), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      // Only the report's own inline style and pagination script, plus embedded images and fonts.
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; img-src data:; style-src 'unsafe-inline'; font-src data:",
    },
  });
});
