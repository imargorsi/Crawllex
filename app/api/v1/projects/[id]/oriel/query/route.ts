import { ZodError } from "zod";

import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { answerGuideQuestion } from "@/lib/oriel/answer";
import { callOriel, OrielError } from "@/lib/oriel/client";
import { loadCorpus } from "@/lib/oriel/corpus";
import { orielCorpusDir, orielEnabled } from "@/lib/oriel/config";
import { allowOrielRequest } from "@/lib/oriel/rate-limit";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";
import { orielQuerySchema } from "@/schemas/oriel";

// One model call with a grounded prompt; allow the local model's slower answers.
export const maxDuration = 60;

function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] ? String(issue.path[0]) : "body";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

export const POST = withApiHandler(async (request, context) => {
  if (!orielEnabled()) return ApiResponse.error("Not Found.", {}, 404);

  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) return ApiResponse.error("Project Not Found.", {}, 404);

  const permissionError = await requireProjectPermission(auth, projectId, "oriel.view");
  if (permissionError) return permissionError;

  if (!allowOrielRequest(auth.user._id.toString())) {
    return ApiResponse.error("Too many questions. Please wait a minute and try again.", {}, 429);
  }

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
    input = orielQuerySchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return ApiResponse.validation("Validation failed.", zodFieldErrors(error));
    }
    throw error;
  }

  try {
    const outcome = await answerGuideQuestion(input.query, {
      chunks: loadCorpus(orielCorpusDir()),
      generate: callOriel,
    });
    console.info(`[oriel] outcome=${outcome.kind}`);
    return ApiResponse.success({ message: outcome.message, sources: outcome.sources, kind: outcome.kind });
  } catch (error) {
    // Question text is never logged. Only the reason code.
    const reason = error instanceof OrielError ? error.reason : "unexpected";
    console.error(`[oriel] unavailable reason=${reason}`);
    return ApiResponse.error("Oriel is unavailable right now. Please try again later.", {}, 503);
  }
});
