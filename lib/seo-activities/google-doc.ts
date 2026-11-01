import * as cheerio from "cheerio";

import { HttpError } from "@/lib/api/http-errors";
import { parseGoogleDocId } from "@/lib/seo-activities/google-doc-url";

/** Limit on the converted WordPress HTML (text and markup; image bytes are not included). */
export const GOOGLE_DOC_MAX_CHARS = 5 * 1024 * 1024;
/** Limit on the raw export. Image-heavy Docs embed images as base64, so this is far above GOOGLE_DOC_MAX_CHARS. */
export const GOOGLE_DOC_MAX_DOWNLOAD_CHARS = 30 * 1024 * 1024;
export const GOOGLE_DOC_MAX_IMAGES = 30;
export const GOOGLE_DOC_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const GOOGLE_DOC_FETCH_TIMEOUT_MS = 20_000;
export const GOOGLE_DOC_NOT_PUBLIC_MESSAGE =
  "The Google Doc is not public. Set sharing to 'Anyone with the link can view'.";

/** Placeholder written into <img src>. publishBlogDraft swaps it for the uploaded WordPress media URL. */
export const GOOGLE_DOC_IMAGE_TOKEN_PREFIX = "crawllex-image:";

/** Image types WordPress accepts from the Doc export. */
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export type TDocImage = {
  contentType: string;
  extension: string;
  bytes: Buffer;
  alt: string;
};

export type TConvertedDoc = {
  /** WordPress post content. Images appear as <img src="crawllex-image:N">. */
  content: string;
  images: TDocImage[];
};

/** Downloads a public Google Doc as HTML. Private docs redirect to a login page and are refused. */
export async function fetchPublicGoogleDocHtml(docUrl: string): Promise<string> {
  const id = parseGoogleDocId(docUrl);
  if (!id) {
    throw new HttpError(422, "Enter a Google Docs link (docs.google.com/document/d/...).");
  }

  let response: Response;
  try {
    response = await fetch(`https://docs.google.com/document/d/${id}/export?format=html`, {
      redirect: "follow",
      signal: AbortSignal.timeout(GOOGLE_DOC_FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new HttpError(502, "Could not download the Google Doc.");
  }

  const finalHost = response.url ? new URL(response.url).hostname : "docs.google.com";
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || finalHost !== "docs.google.com" || !contentType.includes("text/html")) {
    throw new HttpError(422, GOOGLE_DOC_NOT_PUBLIC_MESSAGE);
  }

  const html = await response.text();
  if (html.length > GOOGLE_DOC_MAX_DOWNLOAD_CHARS) {
    throw new HttpError(422, "The Google Doc is too large to download.");
  }
  return html;
}

type TDocsApiInlineObject = {
  inlineObjectProperties?: { embeddedObject?: { title?: string; description?: string } };
};

type TDocsApiDocument = {
  body?: unknown;
  inlineObjects?: Record<string, TDocsApiInlineObject>;
};

/** Finds every inline object id in reading order, including inside tables. */
function collectInlineObjectIds(node: unknown, out: string[]): void {
  if (Array.isArray(node)) {
    for (const item of node) collectInlineObjectIds(item, out);
    return;
  }
  if (!node || typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  const element = record.inlineObjectElement as { inlineObjectId?: unknown } | undefined;
  if (typeof element?.inlineObjectId === "string") out.push(element.inlineObjectId);
  for (const value of Object.values(record)) collectInlineObjectIds(value, out);
}

/**
 * Alt text for each image in a Doc, in document order. Docs keeps it under Image > Alt text
 * (stored as the image's description, or title). The export HTML does not carry it, so the
 * Docs API is asked. Returns null without the key, or when the call fails.
 */
export async function fetchDocImageAlts(docUrl: string, apiKey: string): Promise<string[] | null> {
  const id = parseGoogleDocId(docUrl);
  if (!id || !apiKey) return null;

  try {
    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${id}?fields=body,inlineObjects&key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(GOOGLE_DOC_FETCH_TIMEOUT_MS) },
    );
    if (!response.ok) return null;

    const doc = (await response.json()) as TDocsApiDocument;
    const objectIds: string[] = [];
    collectInlineObjectIds(doc.body, objectIds);
    return objectIds.map((objectId) => {
      const embedded = doc.inlineObjects?.[objectId]?.inlineObjectProperties?.embeddedObject;
      return (embedded?.description || embedded?.title || "").trim();
    });
  } catch {
    return null;
  }
}

type HtmlNode = {
  type: string;
  name?: string;
  data?: string;
  attribs?: Record<string, string>;
  children?: HtmlNode[];
};

/** Tags whose content is dropped entirely. */
const DROPPED_TAGS = new Set([
  "script",
  "style",
  "svg",
  "noscript",
  "head",
  "title",
  "meta",
  "link",
  "iframe",
  "object",
  "video",
  "audio",
  "canvas",
  "form",
  "input",
  "button",
  "select",
  "textarea",
]);

/** Block tags kept as-is, so the Doc's h1-h6, paragraphs and lists carry over. */
const BLOCK_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "li", "blockquote"]);

/** Table parts kept as-is. A <table> is kept whole, except a single code cell (see below). */
const TABLE_PART_TAGS = new Set(["tbody", "thead", "tfoot", "tr", "td", "th"]);

/** Containers where whitespace-only text between children is just source formatting. */
const CONTAINER_TAGS = new Set([
  "root",
  "body",
  "html",
  "div",
  "ul",
  "ol",
  "blockquote",
  "table",
  "tbody",
  "thead",
  "tfoot",
  "tr",
]);

/** A Doc code block exported as a one-cell table: every line is a code-only paragraph. */
const CODE_ONLY_CELL_TABLE =
  /^(?:<tbody>)?<tr><td(?:\s[^>]*)?>((?:<p(?:\s[^>]*)?>(?:<code>[^<]*<\/code>)+<\/p>)+)<\/td><\/tr>(?:<\/tbody>)?$/;

/** Consecutive paragraphs that hold only inline code become one <pre><code> block. */
const CODE_PARAGRAPH_RUN = /(?:<p(?:\s[^>]*)?>(?:<code>[^<]*<\/code>)+<\/p>\s*)+/g;
const CODE_PARAGRAPH = /<p(?:\s[^>]*)?>((?:<code>[^<]*<\/code>)+)<\/p>/g;

/**
 * Doc styles kept on output: alignment, text and cell colors, cell borders.
 * Each value must match its pattern, so nothing else from the Doc's CSS reaches WordPress.
 */
const COLOR_VALUE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i;
const BORDER_VALUE = /^(none|(solid|dashed|dotted|double)\s+#[0-9a-f]{3,6}\s+[\d.]+pt)$/i;
const KEPT_STYLE_VALUES: Record<string, RegExp> = {
  "text-align": /^(left|right|center|justify|start|end)$/i,
  "vertical-align": /^(top|middle|bottom|baseline)$/i,
  color: COLOR_VALUE,
  "background-color": COLOR_VALUE,
  "border-top": BORDER_VALUE,
  "border-right": BORDER_VALUE,
  "border-bottom": BORDER_VALUE,
  "border-left": BORDER_VALUE,
};

/** Colors Docs writes by default. They are dropped so the WordPress theme decides the defaults. */
const DEFAULT_COLORS = new Set(["color:#000000", "color:#000", "background-color:#ffffff", "background-color:#fff"]);

/** Which kept styles each element gets. Paragraphs and headings only need alignment. */
const BLOCK_STYLE_PROPS = ["text-align"];
const CELL_STYLE_PROPS = [
  "text-align",
  "vertical-align",
  "background-color",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
];
const INLINE_STYLE_PROPS = ["color", "background-color"];

/** Font families that mark code in a Google Doc. */
const MONO_FONT = /font-family:[^;}"]*(courier|consolas|mono|menlo|source code)/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Google wraps outbound links as google.com/url?q=<target>. Unwrap them and keep only http(s). */
function cleanHref(raw: string | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.hostname === "www.google.com" && url.pathname === "/url") {
    const target = url.searchParams.get("q");
    return target ? cleanHref(target) : null;
  }
  return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
}

type TStyleDeclaration = [property: string, value: string];

/**
 * Classes from the export's <style> block: which ones mark bold, italic, underline or monospace text,
 * and the kept style declarations (alignment, colors, borders) each class carries.
 */
type TDocStyleClasses = {
  bold: Set<string>;
  italic: Set<string>;
  underline: Set<string>;
  mono: Set<string>;
  declarations: Map<string, TStyleDeclaration[]>;
};

type TRenderContext = {
  styles: TDocStyleClasses;
  images: TDocImage[];
  /** Alt texts from the Docs API, one per <img> in document order. Undefined when unavailable. */
  imageAlts?: string[];
  /** <img> tags seen so far, including remote ones that are dropped. */
  imagesSeen: number;
};

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/** Splits an inline or class style into kept declarations. Anything not on the allow-list is dropped. */
function keptDeclarations(css: string): TStyleDeclaration[] {
  const kept: TStyleDeclaration[] = [];
  for (const part of css.split(";")) {
    const colon = part.indexOf(":");
    if (colon < 0) continue;
    const property = part.slice(0, colon).trim().toLowerCase();
    const value = part.slice(colon + 1).trim();
    const pattern = KEPT_STYLE_VALUES[property];
    if (!pattern || !pattern.test(value)) continue;
    // Docs writes black text and white backgrounds on every span. Dropping them keeps the theme's
    // own colors, so the post stays readable on dark themes.
    if (DEFAULT_COLORS.has(`${property}:${value.toLowerCase()}`)) continue;
    kept.push([property, value]);
  }
  return kept;
}

function readStyleClasses(css: string): TDocStyleClasses {
  const classes: TDocStyleClasses = {
    bold: new Set(),
    italic: new Set(),
    underline: new Set(),
    mono: new Set(),
    declarations: new Map(),
  };
  for (const match of css.matchAll(/\.([A-Za-z0-9_-]+)\s*\{([^}]*)\}/g)) {
    const className = match[1]!;
    const body = match[2]!;
    if (/font-weight:\s*(bold|[6-9]00)/i.test(body)) classes.bold.add(className);
    if (/font-style:\s*italic/i.test(body)) classes.italic.add(className);
    if (/text-decoration:[^;]*underline/i.test(body)) classes.underline.add(className);
    if (MONO_FONT.test(body)) classes.mono.add(className);
    const kept = keptDeclarations(body);
    if (kept.length) {
      classes.declarations.set(className, [...(classes.declarations.get(className) ?? []), ...kept]);
    }
  }
  return classes;
}

/** Keeps an embedded (base64) image for upload. Remote or non-image sources are dropped. */
function renderImage(node: HtmlNode, ctx: TRenderContext): string {
  const match = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(node.attribs?.src ?? "");
  if (!match) return "";
  const contentType = match[1]!.toLowerCase();
  const extension = IMAGE_EXTENSIONS[contentType];
  if (!extension) return "";

  const bytes = Buffer.from(match[2]!.replace(/\s/g, ""), "base64");
  if (ctx.images.length >= GOOGLE_DOC_MAX_IMAGES) {
    throw new HttpError(422, `The Google Doc has more than ${GOOGLE_DOC_MAX_IMAGES} images.`);
  }
  if (bytes.length > GOOGLE_DOC_MAX_IMAGE_BYTES) {
    throw new HttpError(422, "An image in the Google Doc is larger than 5 MB.");
  }

  const index = ctx.images.length;
  const exportedAlt = node.attribs?.alt ?? "";
  // Alt text comes from the Docs API when available; the export's own alt is the fallback.
  const alt = ctx.imageAlts?.[ctx.imagesSeen] || exportedAlt;
  ctx.images.push({ contentType, extension, bytes, alt });
  return `<img src="${GOOGLE_DOC_IMAGE_TOKEN_PREFIX}${index}" alt="${escapeHtml(alt)}">`;
}

/** Style declarations a node keeps: its classes' rules first, then its inline style. */
function keptStyleFor(node: HtmlNode, styles: TDocStyleClasses): Map<string, string> {
  const kept = new Map<string, string>();
  const classNames = (node.attribs?.class ?? "").split(/\s+/).filter(Boolean);
  for (const className of classNames) {
    for (const [property, value] of styles.declarations.get(className) ?? []) kept.set(property, value);
  }
  for (const [property, value] of keptDeclarations(node.attribs?.style ?? "")) kept.set(property, value);
  return kept;
}

/** Inline style attribute with only the kept properties allowed for this element. Empty when none. */
function styleAttr(kept: Map<string, string>, allowed: string[]): string {
  const parts = allowed.filter((p) => kept.has(p)).map((p) => `${p}:${kept.get(p)}`);
  return parts.length ? ` style="${escapeHtml(parts.join(";"))}"` : "";
}

function renderNode(node: HtmlNode, ctx: TRenderContext, inHeading: boolean): string {
  if (node.type === "text") return escapeHtml(node.data ?? "");
  if (node.type !== "tag" && node.type !== "root") return "";

  const name = (node.name ?? node.type).toLowerCase();
  if (DROPPED_TAGS.has(name)) return "";
  if (name === "br") return "<br>";
  if (name === "img") {
    const rendered = renderImage(node, ctx);
    ctx.imagesSeen += 1;
    return rendered;
  }

  const childHeading = inHeading || HEADING_TAGS.has(name);
  const children = (node.children ?? []).filter(
    (child) => !(CONTAINER_TAGS.has(name) && child.type === "text" && /^\s*$/.test(child.data ?? ""))
  );
  const inner = children.map((child) => renderNode(child, ctx, childHeading)).join("");

  if (name === "a") {
    const href = cleanHref(node.attribs?.href);
    return href ? `<a href="${escapeHtml(href)}">${inner}</a>` : inner;
  }

  if (name === "table") {
    const codeOnly = CODE_ONLY_CELL_TABLE.exec(inner);
    if (codeOnly) return codeOnly[1]!;
    // Wrapped so a wide table scrolls on phones instead of pushing the page sideways.
    return `<figure class="wp-block-table" style="overflow-x:auto"><table>${inner}</table></figure>`;
  }
  if (name === "td" || name === "th") {
    return `<${name}${styleAttr(keptStyleFor(node, ctx.styles), CELL_STYLE_PROPS)}>${inner}</${name}>`;
  }
  if (TABLE_PART_TAGS.has(name)) {
    return `<${name}>${inner}</${name}>`;
  }

  if (BLOCK_TAGS.has(name)) {
    // An image-only paragraph has no text but must stay, so check for the img tag first.
    if (name === "p" && !inner.includes("<img ") && inner.replace(/<[^>]+>|&nbsp;|\s/g, "") === "") {
      return `<p${styleAttr(keptStyleFor(node, ctx.styles), BLOCK_STYLE_PROPS)}>&nbsp;</p>`;
    }
    return `<${name}${styleAttr(keptStyleFor(node, ctx.styles), BLOCK_STYLE_PROPS)}>${inner}</${name}>`;
  }

  if (name === "b" || name === "strong") return inHeading ? inner : `<strong>${inner}</strong>`;
  if (name === "i" || name === "em") return `<em>${inner}</em>`;
  if (name === "u") return `<u>${inner}</u>`;

  // Google Docs marks formatting with inline styles or with classes defined in its <style> block.
  const style = node.attribs?.style ?? "";
  const classNames = (node.attribs?.class ?? "").split(/\s+/).filter(Boolean);
  const hasClass = (set: Set<string>) => classNames.some((c) => set.has(c));

  let out = inner;
  if (/font-style:\s*italic/i.test(style) || hasClass(ctx.styles.italic)) out = `<em>${out}</em>`;
  if (!inHeading && (/font-weight:\s*(bold|[6-9]00)/i.test(style) || hasClass(ctx.styles.bold))) {
    out = `<strong>${out}</strong>`;
  }
  if (/text-decoration:[^;]*underline/i.test(style) || hasClass(ctx.styles.underline)) {
    out = `<u>${out}</u>`;
  }
  if (MONO_FONT.test(style) || hasClass(ctx.styles.mono)) {
    out = `<code>${out}</code>`;
  }
  const spanStyle = styleAttr(keptStyleFor(node, ctx.styles), INLINE_STYLE_PROPS);
  if (spanStyle && name === "span") out = `<span${spanStyle}>${out}</span>`;
  return out;
}

/**
 * Converts Google Docs HTML export into WordPress-ready HTML.
 * Keeps h1-h6, paragraphs (blank Doc lines become empty paragraphs), lists, bold, italic, underline,
 * links, tables, inline code and code blocks (monospace paragraphs). Embedded images are returned
 * separately so the caller can upload them; the content points at them with placeholder tokens.
 * Drops remote images, styles, classes and everything else.
 */
export function convertGoogleDoc(html: string, imageAlts?: string[]): TConvertedDoc {
  const $ = cheerio.load(html);
  // Alt texts only apply when the Docs API listed exactly one per exported <img>. Otherwise the
  // order cannot be trusted, so the export's own alt (usually empty) is used.
  const alts = imageAlts?.length === $("img").length ? imageAlts : undefined;
  const ctx: TRenderContext = {
    styles: readStyleClasses($("style").text()),
    images: [],
    imageAlts: alts,
    imagesSeen: 0,
  };
  const body = $("body").get(0) ?? $.root().get(0);
  const rendered = renderNode(body as unknown as HtmlNode, ctx, false);

  const content = rendered
    .replace(CODE_PARAGRAPH_RUN, (run) => {
      const lines = [...run.matchAll(CODE_PARAGRAPH)].map((m) =>
        m[1]!.replace(/<\/?code>/g, "").replace(/&nbsp;| /g, " ")
      );
      return `<pre class="wp-block-code"><code>${lines.join("\n")}</code></pre>`;
    })
    .replace(/^(<p>&nbsp;<\/p>)+/, "")
    .replace(/(<p>&nbsp;<\/p>)+$/, "")
    .trim();

  return { content, images: ctx.images };
}

/** Text and markup only. Use convertGoogleDoc when the images must be uploaded too. */
export function googleDocHtmlToWordPress(html: string): string {
  return convertGoogleDoc(html).content;
}
