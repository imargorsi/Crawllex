import { existsSync, statSync } from "node:fs";
import path from "node:path";

import {
  LEAD_IMPORT_SAMPLE_CSV_FILENAME,
  PUBLIC_RESOURCES_DIR,
  WP_PLUGIN_ZIP_FILENAME,
} from "@/lib/leads/constants";

const CONTENT_TYPES: Record<string, string> = {
  [WP_PLUGIN_ZIP_FILENAME]: "application/zip",
  [LEAD_IMPORT_SAMPLE_CSV_FILENAME]: "text/csv; charset=utf-8",
};

export type TPublicResourceFile = {
  filename: string;
  absolutePath: string;
  contentType: string;
};

export function resolvePublicResourceFile(
  filename: string,
  cwd = process.cwd(),
): TPublicResourceFile | null {
  const contentType = CONTENT_TYPES[filename];
  if (!contentType) return null;
  if (filename.includes("/") || filename.includes("\\") || filename.includes("\0")) {
    return null;
  }

  const resourcesRoot = path.resolve(cwd, "public", PUBLIC_RESOURCES_DIR);
  const absolutePath = path.resolve(resourcesRoot, filename);
  const relative = path.relative(resourcesRoot, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    return null;
  }

  return { filename, absolutePath, contentType };
}
