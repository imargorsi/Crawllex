import { NextResponse } from "next/server";

import { ValidationError } from "@/lib/api/http-errors";
import { ApiResponse } from "@/lib/api/response";
import { assertProjectActiveForLeads } from "@/lib/leads/assert-project-active";
import {
  LEAD_DUPLICATE_MESSAGE,
  LEAD_INGEST_INACTIVE_MESSAGE,
  LEAD_SOURCE_LAST_ERROR_MAX_LENGTH,
} from "@/lib/leads/constants";
import { findDuplicateLead } from "@/lib/leads/create-lead";
import { sanitizeLeadExtras } from "@/lib/leads/extras.utils";
import { normalizeLeadEmail, normalizeLeadPhone } from "@/lib/leads/normalize";
import { serializeLead } from "@/lib/leads/serialize-lead";
import { isDuplicateKeyError } from "@/lib/roles/role-mutation.utils";
import { stampLeadSourceSiteUrl } from "@/lib/leads/lead-source-site-url";
import { Lead, LeadSource, type LeadDocument, type LeadSourceDocument } from "@/models";
import type { IngestLeadInput } from "@/schemas/lead";
import type { TLeadIngestResultDto, TLeadIngestVerifyDto } from "@/types/lead.types";

function clipLastError(message: string): string {
  return message.slice(0, LEAD_SOURCE_LAST_ERROR_MAX_LENGTH);
}

async function findLeadByIdempotencyKey(
  sourceId: LeadSourceDocument["_id"],
  idempotencyKey: string,
): Promise<LeadDocument | null> {
  return Lead.findOne({ leadSourceId: sourceId, idempotencyKey });
}

export async function recordLeadSourceIngestFailure(
  source: LeadSourceDocument,
  message: string,
): Promise<void> {
  await LeadSource.updateOne(
    { _id: source._id },
    {
      $inc: { failedCount: 1 },
      $set: { lastError: clipLastError(message) },
    },
  );
}

async function recordLeadSourceIngestSuccess(source: LeadSourceDocument): Promise<void> {
  await LeadSource.updateOne(
    { _id: source._id },
    {
      $inc: { ingestCount: 1 },
      $set: {
        lastIngestedAt: new Date(),
        lastError: null,
        status: "connected",
      },
    },
  );
}

export async function verifyLeadSourceIngest(
  source: LeadSourceDocument,
  siteUrl?: string,
): Promise<TLeadIngestVerifyDto> {
  try {
    await assertProjectActiveForLeads(String(source.projectId), LEAD_INGEST_INACTIVE_MESSAGE);
  } catch (error) {
    const message = error instanceof Error ? error.message : LEAD_INGEST_INACTIVE_MESSAGE;
    await LeadSource.updateOne(
      { _id: source._id },
      { $set: { lastError: clipLastError(message) } },
    );
    throw error;
  }

  await LeadSource.updateOne(
    { _id: source._id },
    {
      $set: {
        lastVerifiedAt: new Date(),
        lastError: null,
        status: "connected",
      },
    },
  );
  await stampLeadSourceSiteUrl(source, siteUrl);

  return {
    source: {
      id: String(source._id),
      name: source.name,
      provider: source.provider,
    },
  };
}

export async function ingestLeadFromSource(
  source: LeadSourceDocument,
  input: IngestLeadInput,
): Promise<{ lead: LeadDocument; replayed: boolean }> {
  const existingByKey = await findLeadByIdempotencyKey(source._id, input.idempotencyKey);
  if (existingByKey) {
    return { lead: existingByKey, replayed: true };
  }

  try {
    await assertProjectActiveForLeads(String(source.projectId), LEAD_INGEST_INACTIVE_MESSAGE);
  } catch (error) {
    const message = error instanceof Error ? error.message : LEAD_INGEST_INACTIVE_MESSAGE;
    await recordLeadSourceIngestFailure(source, message);
    throw error;
  }

  const extras = sanitizeLeadExtras(input.extras, {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    message: input.message,
  });
  await stampLeadSourceSiteUrl(source, input.siteUrl);
  const normalizedEmail = normalizeLeadEmail(input.email);
  const normalizedPhone = normalizeLeadPhone(input.phone);

  const duplicate = await findDuplicateLead(
    String(source.projectId),
    normalizedEmail,
    normalizedPhone,
  );
  if (duplicate) {
    await recordLeadSourceIngestFailure(source, LEAD_DUPLICATE_MESSAGE);
    throw new ValidationError({ email: [LEAD_DUPLICATE_MESSAGE] }, LEAD_DUPLICATE_MESSAGE);
  }

  const actorId = source.connectedByUserId;
  try {
    const lead = await Lead.create({
      projectId: source.projectId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      servicesInterestedIn: input.servicesInterestedIn,
      message: input.message,
      leadDate: input.leadDate,
      extras,
      normalizedEmail,
      normalizedPhone,
      origin: "wordpress",
      leadSourceId: source._id,
      idempotencyKey: input.idempotencyKey,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await recordLeadSourceIngestSuccess(source);
    return { lead, replayed: false };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const replayed = await findLeadByIdempotencyKey(source._id, input.idempotencyKey);
      if (replayed) {
        return { lead: replayed, replayed: true };
      }
      await recordLeadSourceIngestFailure(source, LEAD_DUPLICATE_MESSAGE);
      throw new ValidationError({ email: [LEAD_DUPLICATE_MESSAGE] }, LEAD_DUPLICATE_MESSAGE);
    }
    throw error;
  }
}

export function buildVerifyLeadSourceResponse(payload: TLeadIngestVerifyDto): NextResponse {
  return ApiResponse.success(payload, "Lead source verified.");
}

export function buildIngestLeadResponse(payload: TLeadIngestResultDto, replayed: boolean): NextResponse {
  return ApiResponse.success(
    payload,
    replayed ? "Lead already ingested." : "Lead ingested.",
    replayed ? 200 : 201,
  );
}

export function serializeIngestLeadResult(
  lead: LeadDocument,
  replayed: boolean,
): TLeadIngestResultDto {
  return {
    lead: serializeLead(lead),
    replayed,
  };
}
