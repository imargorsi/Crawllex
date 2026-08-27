import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/handler";
import { NotFoundError } from "@/lib/api/http-errors";
import { clientIp, ensureRouteNotRateLimited, recordRouteAttempt } from "@/lib/auth/rate-limit";
import { CLIENT_PUBLIC_VIEW_RATE_MAX } from "@/lib/clients/constants";
import {
  buildPublicClientResponse,
  buildPublicClientUnavailableResponse,
  getPublicClientByShareToken,
} from "@/lib/clients/get-public-client";
import { connectDb } from "@/lib/db/mongoose";

function publicViewRateLimitResponse(request: Request): NextResponse | null {
  const ip = clientIp(request);
  const retryAfter = ensureRouteNotRateLimited("onboarding-public-view", ip, CLIENT_PUBLIC_VIEW_RATE_MAX);
  if (retryAfter !== null) {
    return NextResponse.json(
      {
        success: false,
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
        errors: {},
      },
      { status: 429 },
    );
  }
  recordRouteAttempt("onboarding-public-view", ip);
  return null;
}

export const GET = withApiHandler(async (request, context) => {
  const limited = publicViewRateLimitResponse(request);
  if (limited) return limited;

  await connectDb();

  const { shareToken } = await context!.params;
  if (!shareToken) {
    return buildPublicClientUnavailableResponse();
  }

  try {
    const client = await getPublicClientByShareToken(shareToken);
    return buildPublicClientResponse(client);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return buildPublicClientUnavailableResponse();
    }
    throw error;
  }
});
