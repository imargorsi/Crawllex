import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Report artwork and fonts, read once per process. Fonts are embedded into the report HTML as data
 * URIs so the preview and the PDF renderer need no network and no font install.
 */
export type TReportAssets = {
  /** PNG data URIs with transparent background. SVG artwork from the template rendered black in the PDF. */
  lcLogoUri: string;
  dotsUri: string;
  chevronsUri: string;
  coverArtUri: string;
  contactBgDataUri: string;
  fontFaceCss: string;
  /** Browser script that splits sections into A4 pages (assets/paginate.js). */
  paginateJs: string;
};

const ASSET_DIR = path.join(process.cwd(), "lib", "reports", "assets");

const FONT_FACES: ReadonlyArray<{ file: string; family: string; weight: number }> = [
  { file: "red-hat-display-latin-700-normal.woff2", family: "Red Hat Display", weight: 700 },
  { file: "poppins-latin-400-normal.woff2", family: "Poppins", weight: 400 },
  { file: "poppins-latin-700-normal.woff2", family: "Poppins", weight: 700 },
  { file: "rosario-latin-400-normal.woff2", family: "Rosario", weight: 400 },
];

let cached: TReportAssets | null = null;

function pngDataUri(file: string): string {
  return `data:image/png;base64,${readFileSync(path.join(ASSET_DIR, file)).toString("base64")}`;
}

export function loadReportAssets(): TReportAssets {
  if (cached) return cached;

  const fontFaceCss = FONT_FACES.map(({ file, family, weight }) => {
    const data = readFileSync(path.join(ASSET_DIR, "fonts", file)).toString("base64");
    return `@font-face { font-family: "${family}"; font-style: normal; font-weight: ${weight}; src: url(data:font/woff2;base64,${data}) format("woff2"); }`;
  }).join("\n");

  cached = {
    lcLogoUri: pngDataUri("lc-logo.png"),
    dotsUri: pngDataUri("dots.png"),
    chevronsUri: pngDataUri("chevrons.png"),
    coverArtUri: pngDataUri("cover-art.png"),
    contactBgDataUri: `data:image/jpeg;base64,${readFileSync(path.join(ASSET_DIR, "contact-bg.jpg")).toString("base64")}`,
    fontFaceCss,
    paginateJs: readFileSync(path.join(ASSET_DIR, "paginate.js"), "utf8"),
  };
  return cached;
}

/** No artwork: used by tests and when files are missing. Text fallbacks render instead. */
export const EMPTY_REPORT_ASSETS: TReportAssets = { lcLogoUri: "", dotsUri: "", chevronsUri: "", coverArtUri: "", contactBgDataUri: "", fontFaceCss: "", paginateJs: "" };
