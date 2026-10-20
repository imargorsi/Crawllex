import * as cheerio from "cheerio";

import { HttpError } from "@/lib/api/http-errors";
import { parseGoogleDocId } from "@/lib/seo-activities/google-doc-url";

export const GOOGLE_DOC_MAX_CHARS = 5 * 1024 * 1024;
export const GOOGLE_DOC_FETCH_TIMEOUT_MS = 20_000;
export const GOOGLE_DOC_NOT_PUBLIC_MESSAGE =
  "The Google Doc is not public. Set sharing to 'Anyone with the link can view'.";

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
  if (html.length > GOOGLE_DOC_MAX_CHARS) {
    throw new HttpError(422, "The Google Doc is too large.");
  }
  return html;
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
  "img",
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

/** Containers where whitespace-only text between children is just source formatting. */
const CONTAINER_TAGS = new Set(["root", "body", "html", "div", "ul", "ol", "blockquote"]);

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

/** Classes from the export's <style> block that mark bold, italic or underline text. */
type TDocStyleClasses = { bold: Set<string>; italic: Set<string>; underline: Set<string> };

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function readStyleClasses(css: string): TDocStyleClasses {
  const classes: TDocStyleClasses = { bold: new Set(), italic: new Set(), underline: new Set() };
  for (const match of css.matchAll(/\.([A-Za-z0-9_-]+)\s*\{([^}]*)\}/g)) {
    const className = match[1]!;
    const body = match[2]!;
    if (/font-weight:\s*(bold|[6-9]00)/i.test(body)) classes.bold.add(className);
    if (/font-style:\s*italic/i.test(body)) classes.italic.add(className);
    if (/text-decoration:[^;]*underline/i.test(body)) classes.underline.add(className);
  }
  return classes;
}

function renderNode(node: HtmlNode, styles: TDocStyleClasses, inHeading: boolean): string {
  if (node.type === "text") return escapeHtml(node.data ?? "");
  if (node.type !== "tag" && node.type !== "root") return "";

  const name = (node.name ?? node.type).toLowerCase();
  if (DROPPED_TAGS.has(name)) return "";
  if (name === "br") return "<br>";

  const childHeading = inHeading || HEADING_TAGS.has(name);
  const children = (node.children ?? []).filter(
    (child) => !(CONTAINER_TAGS.has(name) && child.type === "text" && /^\s*$/.test(child.data ?? ""))
  );
  const inner = children.map((child) => renderNode(child, styles, childHeading)).join("");

  if (name === "a") {
    const href = cleanHref(node.attribs?.href);
    return href ? `<a href="${escapeHtml(href)}">${inner}</a>` : inner;
  }

  if (BLOCK_TAGS.has(name)) {
    if (name === "p" && inner.replace(/<[^>]+>|&nbsp;|\s/g, "") === "") {
      return "<p>&nbsp;</p>";
    }
    return `<${name}>${inner}</${name}>`;
  }

  if (name === "b" || name === "strong") return inHeading ? inner : `<strong>${inner}</strong>`;
  if (name === "i" || name === "em") return `<em>${inner}</em>`;
  if (name === "u") return `<u>${inner}</u>`;

  // Google Docs marks formatting with inline styles or with classes defined in its <style> block.
  const style = node.attribs?.style ?? "";
  const classNames = (node.attribs?.class ?? "").split(/\s+/).filter(Boolean);
  const hasClass = (set: Set<string>) => classNames.some((c) => set.has(c));

  let out = inner;
  if (/font-style:\s*italic/i.test(style) || hasClass(styles.italic)) out = `<em>${out}</em>`;
  if (!inHeading && (/font-weight:\s*(bold|[6-9]00)/i.test(style) || hasClass(styles.bold))) {
    out = `<strong>${out}</strong>`;
  }
  if (/text-decoration:[^;]*underline/i.test(style) || hasClass(styles.underline)) {
    out = `<u>${out}</u>`;
  }
  return out;
}

/**
 * Converts Google Docs HTML export into WordPress-ready HTML.
 * Keeps h1-h6, paragraphs (blank Doc lines become empty paragraphs), lists, bold, italic, underline and links.
 * Drops images, styles, classes and everything else.
 */
export function googleDocHtmlToWordPress(html: string): string {
  const $ = cheerio.load(html);
  const styles = readStyleClasses($("style").text());
  const body = $("body").get(0) ?? $.root().get(0);
  const rendered = renderNode(body as unknown as HtmlNode, styles, false);

  return rendered
    .replace(/^(<p>&nbsp;<\/p>)+/, "")
    .replace(/(<p>&nbsp;<\/p>)+$/, "")
    .trim();
}
