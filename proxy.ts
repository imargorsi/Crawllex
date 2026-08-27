import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  LEAD_IMPORT_SAMPLE_CSV_FILENAME,
  WP_PLUGIN_ZIP_FILENAME,
} from "@/lib/leads/constants";

const PUBLIC_RESOURCE_FILES = new Set([
  WP_PLUGIN_ZIP_FILENAME,
  LEAD_IMPORT_SAMPLE_CSV_FILENAME,
]);

export function proxy(request: NextRequest) {
  const filename = request.nextUrl.pathname.slice("/resources/".length);
  if (!PUBLIC_RESOURCE_FILES.has(filename)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/api/v1/downloads";
  url.searchParams.set("file", filename);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/resources/:path*"],
};
