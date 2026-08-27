import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  LEAD_IMPORT_SAMPLE_CSV_FILENAME,
  PUBLIC_RESOURCES_DIR,
  WP_PLUGIN_BASENAME,
  WP_PLUGIN_SLUG,
  WP_PLUGIN_ZIP_FILENAME,
  WP_PLUGIN_ZIP_HREF,
} from "@/lib/leads/constants";
import {
  buildWordpressPluginUpdateDto,
  buildWordpressPluginZipFromSource,
  publicResourcesDir,
  readWordpressPluginVersion,
  wordpressPluginPublicZipPath,
} from "@/lib/leads/plugin-package";
import { resolvePublicResourceFile } from "@/lib/leads/public-resources";

describe("WordPress plugin package", () => {
  it("reads the plugin header version", () => {
    expect(readWordpressPluginVersion()).toBe("0.4.1");
  });

  it("builds a zip whose entries live under the WordPress plugin slug", () => {
    const zip = buildWordpressPluginZipFromSource();
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
    expect(zip.includes(Buffer.from(`${WP_PLUGIN_SLUG}/${WP_PLUGIN_SLUG}.php`))).toBe(true);
    expect(zip.includes(Buffer.from("includes/class-updater.php"))).toBe(true);
    expect(zip.includes(Buffer.from("includes/forms/class-wpforms.php"))).toBe(true);
    expect(zip.includes(Buffer.from("assets/admin.css"))).toBe(true);
    expect(zip.includes(Buffer.from("assets/logo-wpforms.png"))).toBe(true);
    expect(zip.includes(Buffer.from("includes/dashboard-url.php"))).toBe(true);
  });

  it("keeps the zip and sample CSV together under public/resources", () => {
    const zipPath = wordpressPluginPublicZipPath();
    expect(existsSync(zipPath)).toBe(true);
    const zip = readFileSync(zipPath);
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
    expect(path.posix.join("/", PUBLIC_RESOURCES_DIR, WP_PLUGIN_ZIP_FILENAME)).toBe(
      WP_PLUGIN_ZIP_HREF,
    );
    expect(
      existsSync(path.join(publicResourcesDir(), LEAD_IMPORT_SAMPLE_CSV_FILENAME)),
    ).toBe(true);
  });

  it("resolves allowlisted files from public/resources", () => {
    expect(resolvePublicResourceFile(WP_PLUGIN_ZIP_FILENAME)?.contentType).toBe("application/zip");
    expect(resolvePublicResourceFile(LEAD_IMPORT_SAMPLE_CSV_FILENAME)?.contentType).toContain(
      "text/csv",
    );
    expect(resolvePublicResourceFile("../package.json")).toBeNull();
    expect(resolvePublicResourceFile("..\\package.json")).toBeNull();
  });

  it("stamps the current APP_URL into the packed dashboard-url.php", () => {
    const previous = process.env.APP_URL;
    process.env.APP_URL = "https://crawllex.example";
    try {
      const zip = buildWordpressPluginZipFromSource();
      expect(zip.includes(Buffer.from("https://crawllex.example"))).toBe(true);
    } finally {
      if (previous === undefined) {
        delete process.env.APP_URL;
      } else {
        process.env.APP_URL = previous;
      }
    }
  });

  it("points WordPress updates at the public zip", () => {
    const payload = buildWordpressPluginUpdateDto();
    expect(payload.slug).toBe(WP_PLUGIN_SLUG);
    expect(payload.plugin).toBe(WP_PLUGIN_BASENAME);
    expect(payload.version).toBe("0.4.1");
    expect(payload.downloadUrl).toBe(`http://localhost:3000${WP_PLUGIN_ZIP_HREF}`);
    expect(WP_PLUGIN_ZIP_FILENAME).toBe("crawllex-lead-capture.zip");
  });
});
