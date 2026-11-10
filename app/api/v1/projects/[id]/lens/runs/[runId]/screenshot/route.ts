import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { lensGetRaw, lensPath } from "@/lib/lens/client";
import { lensErrorResponse } from "@/lib/lens/respond";
import { connectDb } from "@/lib/db/mongoose";
import { requireProjectPermission } from "@/lib/projects/get-project-access";

/** One screenshot (png) of a Lens run, streamed through Crawllex. The file name is a query value: ?name=dir/file.png */
export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request);
  if (auth instanceof Response) return auth;

  const { id: projectId, runId } = await context!.params;
  if (!projectId || !runId) return ApiResponse.error("Not Found.", {}, 404);

  const permissionError = await requireProjectPermission(auth, projectId, "dashboard.view");
  if (permissionError) return permissionError;

  const name = new URL(request.url).searchParams.get("name") ?? "";
  if (!name.toLowerCase().endsWith(".png") || name.split("/").some((part) => part === "" || part === "." || part === "..")) {
    return ApiResponse.error("Not Found.", {}, 404);
  }

  try {
    const upstream = await lensGetRaw(lensPath("projects", projectId, "runs", runId, "screenshots", ...name.split("/")));
    return new NextResponse(upstream.body, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    return lensErrorResponse(error);
  }
});
