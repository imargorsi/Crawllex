import { ZodError } from "zod";

import { withApiHandler } from "@/lib/api/handler";
import { connectDb } from "@/lib/db/mongoose";
import { LEAD_INGEST_RATE_MAX } from "@/lib/leads/constants";
import {
  buildIngestLeadResponse,
  ingestLeadFromSource,
  recordLeadSourceIngestFailure,
  serializeIngestLeadResult,
} from "@/lib/leads/ingest-lead";
import {
  ingestRateLimitResponse,
  readJsonBody,
  requireLeadSourceFromRequest,
} from "@/lib/leads/lead-source-auth";
import { ingestLeadSchema } from "@/schemas/lead";

export const POST = withApiHandler(async (request) => {
  const limited = ingestRateLimitResponse(request, "leads-ingest", LEAD_INGEST_RATE_MAX);
  if (limited) return limited;

  await connectDb();

  const source = await requireLeadSourceFromRequest(request);
  const body = await readJsonBody(request);

  let input;
  try {
    input = ingestLeadSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      await recordLeadSourceIngestFailure(source, "Validation failed.");
    }
    throw error;
  }

  const result = await ingestLeadFromSource(source, input);
  return buildIngestLeadResponse(serializeIngestLeadResult(result.lead, result.replayed), result.replayed);
});
