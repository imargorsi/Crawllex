import { NextResponse } from "next/server";

import { ApiResponse } from "@/lib/api/response";

import { LensError } from "./client";

/** Maps a Lens failure to an API error. Nothing from Lens internals reaches the browser. */
export function lensErrorResponse(error: unknown): NextResponse {
  if (error instanceof LensError) {
    if (error.reason === "disabled") return ApiResponse.error("Lens is not connected.", {}, 503);
    if (error.reason === "not_found") return ApiResponse.error("Not Found.", {}, 404);
    return ApiResponse.error("Lens could not be reached.", {}, 502);
  }
  throw error;
}
