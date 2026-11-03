import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";
import { getReport, reportPdf } from "@/lib/reports/report-service";

function safeFilename(title: string): string {
  const ascii = title
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${ascii || "report"}.pdf`;
}

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

  const pdf = await reportPdf(report);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename(report.title)}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
