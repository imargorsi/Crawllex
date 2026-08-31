import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import {
  canPreviewClientFile,
  clientFileContentDisposition,
  readClientIntakeFile,
} from "@/lib/clients/client-file-storage";
import { getClientById } from "@/lib/clients/get-client";
import { connectDb } from "@/lib/db/mongoose";

export const GET = withApiHandler(async (request, context) => {
  await connectDb();

  const auth = await runApiGuards(request, { superAdmin: true });
  if (auth instanceof Response) return auth;

  const params = await context!.params;
  const clientId = params.id;
  const fileId = params.fileId;
  if (!clientId || !fileId) {
    return ApiResponse.error("File not found.", {}, 404);
  }

  const client = await getClientById(clientId);
  const stored = await readClientIntakeFile(client, fileId);
  if (!stored) {
    return ApiResponse.error("File not found.", {}, 404);
  }

  const wantDownload = new URL(request.url).searchParams.get("download") === "1";
  const asDownload = wantDownload || !canPreviewClientFile(stored);

  return new NextResponse(stored.stream, {
    headers: {
      "Content-Type": stored.contentType,
      "Content-Disposition": clientFileContentDisposition(stored.originalName, asDownload),
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
