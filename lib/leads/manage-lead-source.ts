import mongoose, { type Types } from "mongoose";
import { NextResponse } from "next/server";

import { HttpError, NotFoundError, ValidationError } from "@/lib/api/http-errors";
import { ApiResponse } from "@/lib/api/response";
import type { AuthContext } from "@/lib/auth/guards";
import { assertProjectActiveForLeads } from "@/lib/leads/assert-project-active";
import {
  LEAD_SOURCE_DEFAULT_NAME,
  LEAD_SOURCE_KEY_UNAVAILABLE_MESSAGE,
  LEAD_SOURCE_MVP_MAX_PER_PROJECT,
  LEAD_SOURCE_PROVIDER,
} from "@/lib/leads/constants";
import {
  decryptLeadSourceKey,
  encryptLeadSourceKey,
  generateLeadSourceKey,
  hashLeadSourceKey,
} from "@/lib/leads/lead-source-key";
import { serializeLeadSource } from "@/lib/leads/serialize-lead-source";
import { isDuplicateKeyError } from "@/lib/roles/role-mutation.utils";
import { LeadSource, type LeadSourceDocument } from "@/models";
import type { TLeadSourceListDto, TLeadSourceSecretDto } from "@/types/lead-source.types";

const ALREADY_CONNECTED_MESSAGE = "A WordPress lead source is already connected.";
const INACTIVE_CONNECT_MESSAGE = "Project must be active to connect a lead source.";

async function findProjectSource(
  projectId: string,
  sourceId: string,
): Promise<LeadSourceDocument> {
  if (!mongoose.isValidObjectId(sourceId)) {
    throw new NotFoundError("Lead source");
  }

  const source = await LeadSource.findOne({
    _id: sourceId,
    projectId,
    provider: LEAD_SOURCE_PROVIDER,
  });
  if (!source) {
    throw new NotFoundError("Lead source");
  }
  return source;
}

function alreadyConnectedError(): ValidationError {
  return new ValidationError({ source: [ALREADY_CONNECTED_MESSAGE] }, ALREADY_CONNECTED_MESSAGE);
}

export async function listLeadSources(projectId: string): Promise<TLeadSourceListDto> {
  const docs = await LeadSource.find({ projectId, provider: LEAD_SOURCE_PROVIDER }).sort({
    createdAt: -1,
  });
  return { items: docs.map(serializeLeadSource) };
}

export async function createLeadSource(
  auth: AuthContext,
  projectId: string,
): Promise<TLeadSourceSecretDto> {
  await assertProjectActiveForLeads(projectId, INACTIVE_CONNECT_MESSAGE);

  const existingCount = await LeadSource.countDocuments({
    projectId,
    provider: LEAD_SOURCE_PROVIDER,
  });
  if (existingCount >= LEAD_SOURCE_MVP_MAX_PER_PROJECT) {
    throw alreadyConnectedError();
  }

  const generated = generateLeadSourceKey();
  const userId = auth.user._id as Types.ObjectId;
  const now = new Date();

  try {
    const source = await LeadSource.create({
      projectId,
      provider: LEAD_SOURCE_PROVIDER,
      name: LEAD_SOURCE_DEFAULT_NAME,
      status: "connected",
      keyHash: generated.keyHash,
      keyPrefix: generated.keyPrefix,
      keyCiphertext: encryptLeadSourceKey(generated.plaintext),
      siteUrl: null,
      lastVerifiedAt: null,
      lastIngestedAt: null,
      lastError: null,
      ingestCount: 0,
      failedCount: 0,
      connectedByUserId: userId,
      connectedAt: now,
    });

    return {
      source: serializeLeadSource(source),
      plaintextKey: generated.plaintext,
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw alreadyConnectedError();
    }
    throw error;
  }
}

export async function rotateLeadSourceKey(
  auth: AuthContext,
  projectId: string,
  sourceId: string,
): Promise<TLeadSourceSecretDto> {
  await assertProjectActiveForLeads(projectId, INACTIVE_CONNECT_MESSAGE);

  const source = await findProjectSource(projectId, sourceId);
  const generated = generateLeadSourceKey();

  source.keyHash = generated.keyHash;
  source.keyPrefix = generated.keyPrefix;
  source.keyCiphertext = encryptLeadSourceKey(generated.plaintext);
  source.status = "connected";
  source.lastError = null;
  source.connectedByUserId = auth.user._id as Types.ObjectId;
  source.connectedAt = new Date();
  await source.save();

  return {
    source: serializeLeadSource(source),
    plaintextKey: generated.plaintext,
  };
}

export async function disconnectLeadSource(projectId: string, sourceId: string): Promise<void> {
  const source = await findProjectSource(projectId, sourceId);
  await LeadSource.deleteOne({ _id: source._id, projectId });
}

/** Ingest lookup. Hashes the plaintext key and finds a connected source. */
export async function findLeadSourceByPlainKey(
  plaintextKey: string,
): Promise<LeadSourceDocument | null> {
  const trimmed = plaintextKey.trim();
  if (!trimmed) return null;
  const keyHash = hashLeadSourceKey(trimmed);
  return LeadSource.findOne({ keyHash, status: "connected" });
}

export async function revealLeadSourceKey(
  projectId: string,
  sourceId: string,
): Promise<TLeadSourceSecretDto> {
  const source = await findProjectSource(projectId, sourceId);
  const plaintext = source.keyCiphertext ? decryptLeadSourceKey(source.keyCiphertext) : null;
  if (!plaintext) {
    throw new HttpError(422, LEAD_SOURCE_KEY_UNAVAILABLE_MESSAGE);
  }
  return {
    source: serializeLeadSource(source),
    plaintextKey: plaintext,
  };
}

export function buildRevealLeadSourceKeyResponse(payload: TLeadSourceSecretDto): NextResponse {
  return ApiResponse.success(payload);
}

export function buildListLeadSourcesResponse(payload: TLeadSourceListDto): NextResponse {
  return ApiResponse.success(payload);
}

export function buildCreateLeadSourceResponse(payload: TLeadSourceSecretDto): NextResponse {
  return ApiResponse.success(payload, "Lead source connected.", 201);
}

export function buildRotateLeadSourceResponse(payload: TLeadSourceSecretDto): NextResponse {
  return ApiResponse.success(payload, "Lead source key rotated.");
}

export function buildDisconnectLeadSourceResponse(): NextResponse {
  return ApiResponse.success(null, "Lead source disconnected.");
}
