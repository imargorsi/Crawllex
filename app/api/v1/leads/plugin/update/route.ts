import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { connectDb } from "@/lib/db/mongoose";
import { LEAD_PLUGIN_UPDATE_RATE_MAX } from "@/lib/leads/constants";
import {
  ingestRateLimitResponse,
  requireLeadSourceFromRequest,
} from "@/lib/leads/lead-source-auth";
import { buildWordpressPluginUpdateDto } from "@/lib/leads/plugin-package";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const limited = ingestRateLimitResponse(request, "leads-plugin-update", LEAD_PLUGIN_UPDATE_RATE_MAX);
  if (limited) return limited;

  await connectDb();
  await requireLeadSourceFromRequest(request);

  return ApiResponse.success(buildWordpressPluginUpdateDto());
});
