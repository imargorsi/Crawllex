import { NextResponse } from "next/server";

import { HttpError, UnauthorizedError } from "@/lib/api/http-errors";
import { ApiResponse } from "@/lib/api/response";
import { clientIp, ensureRouteNotRateLimited, recordRouteAttempt } from "@/lib/auth/rate-limit";
import { LEAD_INGEST_KEY_HEADER, LEAD_INGEST_MAX_BODY_BYTES } from "@/lib/leads/constants";
import { findLeadSourceByPlainKey } from "@/lib/leads/manage-lead-source";
import type { LeadSourceDocument } from "@/models";

const INVALID_KEY_MESSAGE = "Invalid lead source key.";

export function extractLeadSourcePlainKey(request: Request): string | null {
  const headerKey = request.headers.get(LEAD_INGEST_KEY_HEADER)?.trim();
  if (headerKey) return headerKey;

  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    return token || null;
  }

  return null;
}

export async function requireLeadSourceFromRequest(request: Request): Promise<LeadSourceDocument> {
  const plaintextKey = extractLeadSourcePlainKey(request);
  if (!plaintextKey) {
    throw new UnauthorizedError(INVALID_KEY_MESSAGE);
  }

  const source = await findLeadSourceByPlainKey(plaintextKey);
  if (!source) {
    throw new UnauthorizedError(INVALID_KEY_MESSAGE);
  }

  return source;
}

export function ingestRateLimitResponse(
  request: Request,
  routeKey: string,
  maxAttempts: number,
): NextResponse | null {
  const ip = clientIp(request);
  const retryAfter = ensureRouteNotRateLimited(routeKey, ip, maxAttempts);
  if (retryAfter !== null) {
    return ApiResponse.error(`Too many requests. Try again in ${retryAfter} seconds.`, {}, 429);
  }
  recordRouteAttempt(routeKey, ip);
  return null;
}

export async function readJsonBody(
  request: Request,
  maxBytes = LEAD_INGEST_MAX_BODY_BYTES,
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const length = Number(contentLength);
    if (Number.isFinite(length) && length > maxBytes) {
      throw new HttpError(413, "Payload too large.");
    }
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    throw new HttpError(413, "Payload too large.");
  }
  if (!raw.trim()) {
    throw new HttpError(400, "Invalid request body.");
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError(400, "Invalid request body.");
  }
}
