import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runAssistantQuery } from "@/lib/assistant/run-query";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";
import { assistantQuerySchema } from "@/schemas/assistant";

function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] ? String(issue.path[0]) : "body";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

export const maxDuration = 60;

const encoder = new TextEncoder();

function sse(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Same answer as `POST …/assistant/query`, streamed as server-sent events:
 *   token  { text }   partial AI text, as it is generated
 *   done   { ...result }  final result (same shape as the JSON route)
 *   error  { message }  safe message; the stream then closes
 */
export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) {
    return ApiResponse.error("Project Not Found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, projectId, "dashboard.view");
  if (permissionError) return permissionError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.validation("Invalid Request Body.", {
      body: ["Request Body Must Be Valid JSON."],
    });
  }

  let input;
  try {
    input = assistantQuerySchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return ApiResponse.validation("Validation failed.", zodFieldErrors(error));
    }
    throw error;
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // The client may have left; writes to a closed stream are ignored.
      let open = true;
      const send = (event: string, data: unknown) => {
        if (!open) return;
        try {
          controller.enqueue(sse(event, data));
        } catch {
          open = false;
        }
      };
      try {
        const result = await runAssistantQuery(auth, projectId, input, (text) => send("token", { text }));
        send("done", result);
      } catch {
        // Details are logged by the query layer. The client gets a fixed message.
        send("error", { message: "The assistant could not answer right now. Try again." });
      } finally {
        if (open) controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      Connection: "keep-alive",
    },
  });
});
