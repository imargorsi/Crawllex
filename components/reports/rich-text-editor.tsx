"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type MouseEvent, type ReactNode } from "react";

import { formFieldControlClass } from "@/lib/frontend/layout/dashboard-chrome";
import type { TAppIconComponent } from "@/components/ui/app-icon";
import { ReportFieldLabel } from "@/components/reports/report-field-label";
import { cn } from "@/lib/utils";
import type { TRichBlock, TRichDoc, TRichInline } from "@/lib/reports/rich-text";

type TRichTextEditorProps = {
  id: string;
  label: string;
  hint?: string;
  placeholder: string;
  /** Starting text. The editor owns the content after mount. */
  defaultValue: TRichDoc | null;
  onChange: (doc: TRichDoc) => void;
  error?: string;
  required?: boolean;
  icon?: TAppIconComponent;
};

type TFormat = "bold" | "italic" | "h2" | "h3" | "p" | "list";

const TOOLBAR: { format: TFormat; label: string; glyph: ReactNode; command: () => void }[] = [
  { format: "bold", label: "Bold", glyph: <strong>B</strong>, command: () => document.execCommand("bold") },
  { format: "italic", label: "Italic", glyph: <em>I</em>, command: () => document.execCommand("italic") },
  { format: "h2", label: "Heading", glyph: "H2", command: () => document.execCommand("formatBlock", false, "h2") },
  { format: "h3", label: "Subheading", glyph: "H3", command: () => document.execCommand("formatBlock", false, "h3") },
  { format: "p", label: "Paragraph", glyph: "¶", command: () => document.execCommand("formatBlock", false, "p") },
  { format: "list", label: "Bullet list", glyph: "•", command: () => document.execCommand("insertUnorderedList") },
];

const ELEMENT = 1;
const TEXT = 3;
const BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "BLOCKQUOTE"]);

function cleanText(text: string): string {
  return text.replace(/ /g, " ");
}

/** Bold or italic from a tag name or an inline style (browsers use either for execCommand). */
function formatFlags(element: HTMLElement, flags: { bold: boolean; italic: boolean }) {
  const weight = Number.parseInt(element.style.fontWeight, 10);
  return {
    bold: flags.bold || ["B", "STRONG"].includes(element.tagName) || weight >= 600 || element.style.fontWeight === "bold",
    italic: flags.italic || ["I", "EM"].includes(element.tagName) || element.style.fontStyle === "italic",
  };
}

const NO_FORMAT = { bold: false, italic: false };

const hasText = (runs: TRichInline[]) => runs.some((run) => run.text.trim() !== "");

function mergeRuns(runs: TRichInline[]): TRichInline[] {
  return runs.reduce<TRichInline[]>((merged, run) => {
    const last = merged[merged.length - 1];
    if (last && Boolean(last.bold) === Boolean(run.bold) && Boolean(last.italic) === Boolean(run.italic)) {
      last.text += run.text;
      return merged;
    }
    merged.push({ ...run });
    return merged;
  }, []);
}

/** Runs of one node. Text keeps the formatting it is nested in; a line break becomes a space. */
function nodeRuns(node: Node, flags: { bold: boolean; italic: boolean }): TRichInline[] {
  if (node.nodeType === TEXT) {
    const text = cleanText(node.textContent ?? "");
    return text ? [{ text, ...(flags.bold ? { bold: true } : {}), ...(flags.italic ? { italic: true } : {}) }] : [];
  }
  if (node.nodeType !== ELEMENT) return [];
  const element = node as HTMLElement;
  if (element.tagName === "BR") return [{ text: " " }];
  return inlineRuns(element, formatFlags(element, flags));
}

/** Inline runs of an element's children, with adjacent runs of the same formatting merged. */
function inlineRuns(node: Node, flags = NO_FORMAT): TRichInline[] {
  return mergeRuns(Array.from(node.childNodes).flatMap((child) => nodeRuns(child, flags)));
}

const isInlineNode = (node: Node) => node.nodeType === TEXT || (node.nodeType === ELEMENT && !BLOCK_TAGS.has((node as HTMLElement).tagName));

/**
 * Child nodes → blocks. Consecutive inline nodes (plain text and bold or italic spans) form one paragraph,
 * so "Plain text **bold**" stays a single paragraph.
 */
function blocksFromNodes(nodes: Node[]): TRichBlock[] {
  const blocks: TRichBlock[] = [];
  let inline: Node[] = [];
  const flushInline = () => {
    const runs = mergeRuns(inline.flatMap((node) => nodeRuns(node, NO_FORMAT)));
    if (hasText(runs)) blocks.push({ type: "paragraph", runs });
    inline = [];
  };
  nodes.forEach((node) => {
    if (isInlineNode(node)) {
      inline.push(node);
      return;
    }
    flushInline();
    blocks.push(...blocksFromElement(node));
  });
  flushInline();
  return blocks;
}

function blocksFromElement(node: Node): TRichBlock[] {
  if (node.nodeType !== ELEMENT) return [];
  const element = node as HTMLElement;
  const tag = element.tagName;
  if (tag === "H1" || tag === "H2") return [{ type: "heading", level: 2, runs: inlineRuns(element) }];
  if (/^H[3-6]$/.test(tag)) return [{ type: "heading", level: 3, runs: inlineRuns(element) }];
  if (tag === "UL" || tag === "OL") {
    const items = Array.from(element.children)
      .filter((child) => child.tagName === "LI")
      .map((item) => inlineRuns(item))
      .filter(hasText);
    return items.length > 0 ? [{ type: "bullets", items }] : [];
  }
  // Wrapper blocks (DIV, P, BLOCKQUOTE) that hold other blocks are read child by child.
  const hasBlockChildren = Array.from(element.children).some((child) => BLOCK_TAGS.has(child.tagName));
  if (hasBlockChildren) return blocksFromNodes(Array.from(element.childNodes));
  const runs = inlineRuns(element);
  return hasText(runs) ? [{ type: "paragraph", runs }] : [];
}

/** DOM of the editor → document blocks. Only the allowed structure survives; anything else becomes text. */
export function serializeEditor(root: HTMLElement): TRichDoc {
  return blocksFromNodes(Array.from(root.childNodes));
}

function runNode(run: TRichInline): Node {
  let node: Node = document.createTextNode(run.text);
  if (run.bold) {
    const strong = document.createElement("strong");
    strong.appendChild(node);
    node = strong;
  }
  if (run.italic) {
    const em = document.createElement("em");
    em.appendChild(node);
    node = em;
  }
  return node;
}

function runNodes(runs: TRichInline[]): Node[] {
  return runs.map(runNode);
}

/** Document blocks → DOM. Text is set as text nodes, never as HTML. */
function blockNode(block: TRichBlock): Node {
  if (block.type === "heading") {
    const heading = document.createElement(block.level === 2 ? "h2" : "h3");
    heading.append(...runNodes(block.runs));
    return heading;
  }
  if (block.type === "paragraph") {
    const paragraph = document.createElement("p");
    paragraph.append(...runNodes(block.runs));
    return paragraph;
  }
  const list = document.createElement("ul");
  block.items.forEach((item) => {
    const li = document.createElement("li");
    li.append(...runNodes(item));
    list.appendChild(li);
  });
  return list;
}

/** Rich text editor: bold, italic, headings, paragraphs and bullet lists. Pasted text is plain. */
export function RichTextEditor({ id, label, hint, placeholder, defaultValue, onChange, error, required, icon: Icon }: TRichTextEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(!defaultValue?.length);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !defaultValue) return;
    root.replaceChildren(...defaultValue.map(blockNode));
    // Mount-only: after this the editor owns its content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleInput(event: FormEvent<HTMLDivElement>) {
    const root = event.currentTarget;
    setEmpty(root.textContent?.trim() === "" && root.querySelector("ul, h2, h3") === null);
    onChange(serializeEditor(root));
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
  }

  function runCommand(event: MouseEvent<HTMLButtonElement>, command: () => void) {
    event.preventDefault();
    rootRef.current?.focus();
    command();
    if (rootRef.current) onChange(serializeEditor(rootRef.current));
  }

  return (
    <div className="flex flex-col gap-2.5">
      <ReportFieldLabel htmlFor={id} label={label} icon={Icon} required={required} />
      <div
        className={cn(
          "overflow-hidden rounded-xl transition focus-within:border-[var(--accent-border)] focus-within:ring-2 focus-within:ring-brand/25",
          formFieldControlClass,
          error && "border-[color-mix(in_srgb,var(--destructive)_68%,transparent)]",
        )}
      >
        <div role="toolbar" aria-label={`${label} formatting`} className="flex items-center gap-0.5 border-b border-border/50 px-1.5 py-1">
          {TOOLBAR.map((item) => (
            <button
              key={item.format}
              type="button"
              aria-label={item.label}
              title={item.label}
              onMouseDown={(event) => runCommand(event, item.command)}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              {item.glyph}
            </button>
          ))}
        </div>
        <div className="relative">
          {empty ? <p className="pointer-events-none absolute start-4 top-3.5 text-base text-text-muted">{placeholder}</p> : null}
          <div
            id={id}
            ref={rootRef}
            role="textbox"
            aria-multiline="true"
            aria-label={label}
            aria-invalid={Boolean(error)}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onPaste={handlePaste}
            className={cn(
              "min-h-44 px-4 py-3.5 text-base leading-relaxed text-text-primary outline-none",
              "[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight",
              "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:font-semibold",
              "[&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:ps-5 [&_li]:mb-1 [&_li]:marker:text-brand",
            )}
          />
        </div>
      </div>
      {hint ? <p className="text-sm text-text-secondary">{hint}</p> : null}
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
