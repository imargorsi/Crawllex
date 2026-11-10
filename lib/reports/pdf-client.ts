import { HttpError } from "@/lib/api/http-errors";
import { env } from "@/lib/config/env";
import { REPORT_MAX_HTML_BYTES, REPORT_RENDER_TIMEOUT_MS } from "@/lib/reports/constants";

/**
 * Sends report HTML to the report renderer service and returns the PDF bytes.
 * The renderer is a separate service (services/report-renderer). Only its URL and token are
 * configured here, so it can move to another server without code changes.
 */
export async function renderReportPdf(html: string): Promise<Buffer> {
  const baseUrl = env.reportRendererUrl();
  const token = env.reportRendererToken();
  if (!baseUrl || !token) {
    throw new HttpError(503, "PDF Renderer Is Not Configured.");
  }

  const body = Buffer.from(html, "utf8");
  if (body.byteLength > REPORT_MAX_HTML_BYTES) {
    throw new HttpError(413, "Report Is Too Large To Render.");
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/render`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/html; charset=utf-8",
        Accept: "application/pdf",
      },
      body,
      signal: AbortSignal.timeout(REPORT_RENDER_TIMEOUT_MS),
    });
  } catch {
    throw new HttpError(502, "PDF Rendering Failed.");
  }

  if (!response.ok) {
    throw new HttpError(502, "PDF Rendering Failed.");
  }

  return Buffer.from(await response.arrayBuffer());
}
