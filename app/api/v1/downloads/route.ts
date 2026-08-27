import { readFile, stat } from "node:fs/promises";

import { NextResponse } from "next/server";

import { resolvePublicResourceFile, type TPublicResourceFile } from "@/lib/leads/public-resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resourceResponse(
  file: TPublicResourceFile,
  body: BodyInit | null,
  length: number,
) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Length": String(length),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function filenameFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("file");
  if (fromQuery) return fromQuery;
  return url.pathname.split("/").filter(Boolean).at(-1) ?? null;
}

function lookupFile(request: Request) {
  const filename = filenameFromRequest(request);
  return filename ? resolvePublicResourceFile(filename) : null;
}

function notFound() {
  return new NextResponse("File is not available.", { status: 404 });
}

export async function HEAD(request: Request) {
  const file = lookupFile(request);
  if (!file) return notFound();
  const info = await stat(file.absolutePath);
  return resourceResponse(file, null, info.size);
}

export async function GET(request: Request) {
  const file = lookupFile(request);
  if (!file) return notFound();
  const data = await readFile(file.absolutePath);
  return resourceResponse(file, new Uint8Array(data), data.length);
}
