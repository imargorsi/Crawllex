import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";

type RouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

export function withApiHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
