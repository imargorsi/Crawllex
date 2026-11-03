/**
 * Rich text written by the SEO team (executive summary, section overviews, next steps).
 * Stored as blocks, never as HTML: the editor produces blocks, the schema validates them and every
 * renderer draws them with escaped text. Only headings, paragraphs, bullet lists, bold and italic exist.
 */

/** A run of text. `href` is set on links only; it is always passed through `isSafeHref` first. */
export type TRichInline = { text: string; bold?: boolean; italic?: boolean; href?: string };

export type TRichBlock =
  | { type: "heading"; level: 2 | 3; runs: TRichInline[] }
  | { type: "paragraph"; runs: TRichInline[] }
  | { type: "bullets"; items: TRichInline[][] };

export type TRichDoc = TRichBlock[];

/** Sections the team can write by hand. Each one replaces the generated text when provided. */
export const REPORT_WRITTEN_KEYS = ["executiveSummary", "search", "traffic", "leads", "work"] as const;

export type TReportWrittenKey = (typeof REPORT_WRITTEN_KEYS)[number];

const SAFE_PROTOCOLS = ["https:", "http:", "mailto:"];

/** Only web and mail links are allowed. Anything else (javascript:, data:, relative paths) is rejected. */
export function isSafeHref(url: string): boolean {
  try {
    const parsed = new URL(url);
    return SAFE_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/** Block text separator used by plain-text exports of a document. */
const BLOCK_BREAK = "\n\n";

function runsText(runs: TRichInline[]): string {
  return runs.map((run) => run.text).join("");
}

/** True when the document has no visible text. Empty documents are treated as "not written". */
export function isRichDocEmpty(doc: TRichDoc): boolean {
  return doc.every((block) =>
    block.type === "bullets" ? block.items.every((item) => runsText(item).trim() === "") : runsText(block.runs).trim() === "",
  );
}

/** Plain text of a document, one paragraph per block. Used for list summaries and checks. */
export function richDocPlainText(doc: TRichDoc): string {
  return doc
    .map((block) =>
      block.type === "bullets"
        ? block.items
            .map(runsText)
            .filter((text) => text.trim() !== "")
            .join("\n")
        : runsText(block.runs),
    )
    .filter((text) => text.trim() !== "")
    .join(BLOCK_BREAK);
}

/** First paragraph of plain text, for list cards. Returns null when the document is empty. */
export function richDocFirstParagraph(doc: TRichDoc): string | null {
  return richDocPlainText(doc).split(BLOCK_BREAK)[0]?.trim() || null;
}
