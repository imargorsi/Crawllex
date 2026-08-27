import { deflateRawSync } from "node:zlib";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { HttpError } from "@/lib/api/http-errors";
import { env } from "@/lib/config/env";
import {
  PUBLIC_RESOURCES_DIR,
  LEAD_IMPORT_SAMPLE_CSV_FILENAME,
  WP_PLUGIN_BASENAME,
  WP_PLUGIN_BOOTSTRAP_FILE,
  WP_PLUGIN_DIST_DIR,
  WP_PLUGIN_HOMEPAGE,
  WP_PLUGIN_NAME,
  WP_PLUGIN_REQUIRES_PHP,
  WP_PLUGIN_REQUIRES_WP,
  WP_PLUGIN_SLUG,
  WP_PLUGIN_SOURCE_SUBDIR,
  WP_PLUGIN_TESTED_WP,
  WP_PLUGIN_ZIP_FILENAME,
  WP_PLUGIN_ZIP_HREF,
} from "@/lib/leads/constants";

export type TWordpressPluginUpdateDto = {
  slug: string;
  plugin: string;
  name: string;
  version: string;
  requires: string;
  requiresPhp: string;
  tested: string;
  homepage: string;
  downloadUrl: string;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC_TABLE[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const DASHBOARD_URL_PHP = "includes/dashboard-url.php";

function wordpressDashboardUrl(): string {
  return env.appUrl().replace(/\/$/, "");
}

export function buildWordpressDashboardUrlPhp(origin = wordpressDashboardUrl()): string {
  const escaped = origin.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `<?php
if (!defined('ABSPATH')) {
    exit;
}

if (!defined('CRAWLLEX_LC_DASHBOARD_URL')) {
    define('CRAWLLEX_LC_DASHBOARD_URL', '${escaped}');
}
`;
}

export function writeWordpressDashboardUrlPhp(cwd = process.cwd()): string {
  const origin = wordpressDashboardUrl();
  writeFileSync(
    path.join(wordpressPluginSourceDir(cwd), DASHBOARD_URL_PHP),
    buildWordpressDashboardUrlPhp(origin),
  );
  return origin;
}

function distRoot(cwd = process.cwd()): string {
  return path.join(cwd, WP_PLUGIN_DIST_DIR);
}

export function wordpressPluginSourceDir(cwd = process.cwd()): string {
  return path.join(distRoot(cwd), WP_PLUGIN_SOURCE_SUBDIR);
}

export function wordpressPluginZipPath(cwd = process.cwd()): string {
  return path.join(distRoot(cwd), WP_PLUGIN_ZIP_FILENAME);
}

export function publicResourcesDir(cwd = process.cwd()): string {
  return path.join(cwd, "public", PUBLIC_RESOURCES_DIR);
}

export function wordpressPluginPublicZipPath(cwd = process.cwd()): string {
  return path.join(publicResourcesDir(cwd), WP_PLUGIN_ZIP_FILENAME);
}

export function readWordpressPluginVersion(sourceDir = wordpressPluginSourceDir()): string {
  const bootstrap = path.join(sourceDir, WP_PLUGIN_BOOTSTRAP_FILE);
  if (!existsSync(bootstrap)) {
    throw new HttpError(404, "Plugin package is not available.");
  }
  const php = readFileSync(bootstrap, "utf8");
  const header = php.match(/^\s*\*\s*Version:\s*(\S+)/m);
  const version = header?.[1]?.trim();
  if (!version) {
    throw new HttpError(500, "Plugin version header is missing.");
  }
  return version;
}

type TZipEntry = {
  name: string;
  data: Buffer;
};

function collectPluginFiles(sourceDir: string): TZipEntry[] {
  const entries: TZipEntry[] = [];

  function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      if (name === ".DS_Store" || name.endsWith(".zip")) continue;
      const full = path.join(dir, name);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
        continue;
      }
      const relative = path.relative(sourceDir, full).split(path.sep).join("/");
      const data =
        relative === DASHBOARD_URL_PHP
          ? Buffer.from(buildWordpressDashboardUrlPhp())
          : readFileSync(full);
      entries.push({
        name: `${WP_PLUGIN_SLUG}/${relative}`,
        data,
      });
    }
  }

  walk(sourceDir);
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

function buildZip(files: TZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const crc = crc32(file.data);
    const compressed = deflateRawSync(file.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    const localRecord = Buffer.concat([local, name, compressed]);
    locals.push(localRecord);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, name]));
    offset += localRecord.length;
  }

  const localBlob = Buffer.concat(locals);
  const centralBlob = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBlob.length, 12);
  eocd.writeUInt32LE(localBlob.length, 16);
  return Buffer.concat([localBlob, centralBlob, eocd]);
}

export function buildWordpressPluginZipFromSource(cwd = process.cwd()): Buffer {
  const sourceDir = wordpressPluginSourceDir(cwd);
  if (!existsSync(sourceDir)) {
    throw new HttpError(404, "Plugin package is not available.");
  }
  const files = collectPluginFiles(sourceDir);
  if (files.length === 0) {
    throw new HttpError(404, "Plugin package is not available.");
  }
  return buildZip(files);
}

export function writeWordpressPluginZip(cwd = process.cwd()): {
  zipPath: string;
  version: string;
  bytes: number;
} {
  const zipPath = wordpressPluginZipPath(cwd);
  const publicPath = wordpressPluginPublicZipPath(cwd);
  const distDir = distRoot(cwd);
  writeWordpressDashboardUrlPhp(cwd);
  const buffer = buildWordpressPluginZipFromSource(cwd);
  if (existsSync(distDir)) {
    for (const name of readdirSync(distDir)) {
      if (!name.endsWith(".zip")) continue;
      const existing = path.join(distDir, name);
      if (existing !== zipPath) unlinkSync(existing);
    }
  }
  writeFileSync(zipPath, buffer);
  const publicDir = publicResourcesDir(cwd);
  mkdirSync(publicDir, { recursive: true });
  writeFileSync(publicPath, buffer);
  const sampleCsv = path.join(distDir, LEAD_IMPORT_SAMPLE_CSV_FILENAME);
  if (existsSync(sampleCsv)) {
    copyFileSync(sampleCsv, path.join(publicDir, LEAD_IMPORT_SAMPLE_CSV_FILENAME));
  }
  return {
    zipPath: publicPath,
    version: readWordpressPluginVersion(wordpressPluginSourceDir(cwd)),
    bytes: buffer.length,
  };
}

export function buildWordpressPluginUpdateDto(): TWordpressPluginUpdateDto {
  const origin = env.appUrl().replace(/\/$/, "");
  return {
    slug: WP_PLUGIN_SLUG,
    plugin: WP_PLUGIN_BASENAME,
    name: WP_PLUGIN_NAME,
    version: readWordpressPluginVersion(),
    requires: WP_PLUGIN_REQUIRES_WP,
    requiresPhp: WP_PLUGIN_REQUIRES_PHP,
    tested: WP_PLUGIN_TESTED_WP,
    homepage: WP_PLUGIN_HOMEPAGE,
    downloadUrl: `${origin}${WP_PLUGIN_ZIP_HREF}`,
  };
}
