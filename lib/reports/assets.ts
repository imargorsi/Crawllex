import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Report artwork and fonts, read once per process. Fonts are embedded into the report HTML as data
 * URIs so the preview and the PDF renderer need no network and no font install.
 */
export type TReportAssets = {
  lcLogoSvg: string;
  dotsSvg: string;
  chevronsSvg: string;
  fontFaceCss: string;
};

const ASSET_DIR = path.join(process.cwd(), "lib", "reports", "assets");

const FONT_FACES: ReadonlyArray<{ file: string; family: string; weight: number }> = [
  { file: "red-hat-display-latin-700-normal.woff2", family: "Red Hat Display", weight: 700 },
  { file: "poppins-latin-400-normal.woff2", family: "Poppins", weight: 400 },
  { file: "poppins-latin-700-normal.woff2", family: "Poppins", weight: 700 },
  { file: "rosario-latin-400-normal.woff2", family: "Rosario", weight: 400 },
];

let cached: TReportAssets | null = null;

export function loadReportAssets(): TReportAssets {
  if (cached) return cached;

  const fontFaceCss = FONT_FACES.map(({ file, family, weight }) => {
    const data = readFileSync(path.join(ASSET_DIR, "fonts", file)).toString("base64");
    return `@font-face { font-family: "${family}"; font-style: normal; font-weight: ${weight}; src: url(data:font/woff2;base64,${data}) format("woff2"); }`;
  }).join("\n");

  cached = {
    lcLogoSvg: readFileSync(path.join(ASSET_DIR, "lc-logo.svg"), "utf8"),
    dotsSvg: readFileSync(path.join(ASSET_DIR, "dots.svg"), "utf8"),
    chevronsSvg: readFileSync(path.join(ASSET_DIR, "chevrons.svg"), "utf8"),
    fontFaceCss,
  };
  return cached;
}

/** No artwork: used by tests and when files are missing. Text fallbacks render instead. */
export const EMPTY_REPORT_ASSETS: TReportAssets = { lcLogoSvg: "", dotsSvg: "", chevronsSvg: "", fontFaceCss: "" };
