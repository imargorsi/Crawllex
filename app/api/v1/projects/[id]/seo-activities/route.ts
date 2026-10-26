import { ZodError } from "zod";

import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";
import {
  buildCreateSeoActivityResponse,
  createSeoActivity,
} from "@/lib/seo-activities/create-seo-activity";
import {
  buildListSeoActivitiesResponse,
  listSeoActivities,
} from "@/lib/seo-activities/list-seo-activities";
import { parseListSeoActivitiesQuery } from "@/schemas/list-seo-activities-query";
import { createSeoActivitySchema } from "@/schemas/seo-activity";

function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] ? String(issue.path[0]) : "body";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) {
    return ApiResponse.error("Project Not Found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, projectId, "seo_activities.view");
  if (permissionError) return permissionError;

  let query;
  try {
    query = parseListSeoActivitiesQuery(new URL(request.url).searchParams);
  } catch (error) {
    if (error instanceof ZodError) {
      return ApiResponse.validation("Validation failed.", zodFieldErrors(error));
    }
    throw error;
  }

  const payload = await listSeoActivities(projectId, query);
  return buildListSeoActivitiesResponse(payload);
});

// A blog push uploads images to WordPress before it creates the draft.
export const maxDuration = 60;

export const POST = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId } = await context!.params;
  if (!projectId) {
    return ApiResponse.error("Project Not Found.", {}, 404);
  }

  const permissionError = await requireProjectPermission(auth, projectId, "seo_activities.create");
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
    input = createSeoActivitySchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return ApiResponse.validation("Validation failed.", zodFieldErrors(error));
    }
    throw error;
  }

  // Pushing to the live WordPress site is an integration action, so it needs integrations.update too.
  if (input.pushToWordpress) {
    const integrationError = await requireProjectPermission(auth, projectId, "integrations.update");
    if (integrationError) return integrationError;
  }

  const { activity } = await createSeoActivity(auth, projectId, input);
  return buildCreateSeoActivityResponse(activity);
});
