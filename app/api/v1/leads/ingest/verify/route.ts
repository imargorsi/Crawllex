import { withApiHandler } from "@/lib/api/handler";
import { connectDb } from "@/lib/db/mongoose";
import { LEAD_INGEST_VERIFY_RATE_MAX } from "@/lib/leads/constants";
import { buildVerifyLeadSourceResponse, verifyLeadSourceIngest } from "@/lib/leads/ingest-lead";
import {
  ingestRateLimitResponse,
  readJsonBody,
  requireLeadSourceFromRequest,
} from "@/lib/leads/lead-source-auth";
import { ingestVerifySchema } from "@/schemas/lead";

export const POST = withApiHandler(async (request) => {
  const limited = ingestRateLimitResponse(request, "leads-ingest-verify", LEAD_INGEST_VERIFY_RATE_MAX);
  if (limited) return limited;

  await connectDb();

  const source = await requireLeadSourceFromRequest(request);
  const body = await readJsonBody(request);
  const input = ingestVerifySchema.parse(body);
  const payload = await verifyLeadSourceIngest(source, input.siteUrl);
  return buildVerifyLeadSourceResponse(payload);
});
