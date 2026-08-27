/**
 * Rebuilds the WordPress plugin zip in `crawllex-leads-capture/` and copies it
 * (plus the sample CSV) into `public/resources/`.
 *
 * Run: npm run plugin:pack
 */
import { writeWordpressPluginZip } from "../lib/leads/plugin-package";

const result = writeWordpressPluginZip();
console.log(
  `Wrote ${result.zipPath} (${result.version}, ${result.bytes} bytes). Dashboard URL stamped from APP_URL. Keep only this zip in the folder.`,
);
