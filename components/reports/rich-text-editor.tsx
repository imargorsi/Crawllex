"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ReportFieldLabel } from "@/components/reports/report-field-label";
import { Input } from "@/components/input";
import { Button } from "@/components/ui/button";
import type { TAppIconComponent } from "@/components/ui/app-icon";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { isSafeHref, type TRichBlock, type TRichDoc, type TRichInline } from "@/lib/reports/rich-text";
import { cn } from "@/lib/utils";

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

type TToolbarItem = { key: string; label: string; glyph: ReactNode; onRun: () => void };

const ELEMENT = 1;
const TEXT = 3;
const BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "BLOCKQUOTE"]);
const NO_FORMAT = { bold: false, italic: false };

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

const hasText = (runs: TRichInline[]) => runs.some((run) => run.text.trim() !== "");

function mergeRuns(runs: TRichInline[]): TRichInline[] {
  return runs.reduce<TRichInline[]>((merged, run) => {
    const last = merged[merged.length - 1];
    if (last && Boolean(last.bold) === Boolean(run.bold) && Boolean(last.italic) === Boolean(run.italic) && last.href === run.href) {
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
  if (element.tagName === "A") {
    const href = element.getAttribute("href") ?? "";
    const runs = inlineRuns(element, formatFlags(element, flags));
    return isSafeHref(href) ? runs.map((run) => ({ ...run, href })) : runs;
  }
  return inlineRuns(element, formatFlags(element, flags));
}

/** Inline runs of an element's children, with adjacent runs of the same formatting merged. */
function inlineRuns(node: Node, flags = NO_FORMAT): TRichInline[] {
  return mergeRuns(Array.from(node.childNodes).flatMap((child) => nodeRuns(child, flags)));
}

const isInlineNode = (node: Node) => node.nodeType === TEXT || (node.nodeType === ELEMENT && !BLOCK_TAGS.has((node as HTMLElement).tagName));

/**
 * Child nodes → blocks. Consecutive inline nodes (plain text, bold, italic and links) form one paragraph,
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
  if (run.href && isSafeHref(run.href)) {
    const anchor = document.createElement("a");
    anchor.setAttribute("href", run.href);
    anchor.appendChild(node);
    node = anchor;
  }
  return node;
}

/** Document blocks → DOM. Text is set as text nodes, never as HTML. */
function blockNode(block: TRichBlock): Node {
  if (block.type === "heading") {
    const heading = document.createElement(block.level === 2 ? "h2" : "h3");
    heading.append(...block.runs.map(runNode));
    return heading;
  }
  if (block.type === "paragraph") {
    const paragraph = document.createElement("p");
    paragraph.append(...block.runs.map(runNode));
    return paragraph;
  }
  const list = document.createElement("ul");
  block.items.forEach((item) => {
    const li = document.createElement("li");
    li.append(...item.map(runNode));
    list.appendChild(li);
  });
  return list;
}

/** Full address for a typed link. Adds https:// when no scheme is typed. */
function normaliseLink(input: string): string {
  const value = input.trim();
  if (!value) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
}

/** Rich text editor: bold, italic, headings, paragraphs, bullet lists and links. Pasted text is plain. */
export function RichTextEditor({ id, label, hint, placeholder, defaultValue, onChange, error, required, icon }: TRichTextEditorProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.reports" });
  const rootRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [empty, setEmpty] = useState(!defaultValue?.length);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !defaultValue) return;
    root.replaceChildren(...defaultValue.map(blockNode));
    // Mount-only: after this the editor owns its content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toolbar: TToolbarItem[] = [
    { key: "bold", label: t("toolbarBold"), glyph: <strong>B</strong>, onRun: () => document.execCommand("bold") },
    { key: "italic", label: t("toolbarItalic"), glyph: <em>I</em>, onRun: () => document.execCommand("italic") },
    { key: "h2", label: t("toolbarHeading"), glyph: "H2", onRun: () => document.execCommand("formatBlock", false, "h2") },
    { key: "h3", label: t("toolbarSubheading"), glyph: "H3", onRun: () => document.execCommand("formatBlock", false, "h3") },
    { key: "p", label: t("toolbarParagraph"), glyph: "¶", onRun: () => document.execCommand("formatBlock", false, "p") },
    { key: "list", label: t("toolbarList"), glyph: "•", onRun: () => document.execCommand("insertUnorderedList") },
  ];

  function emitChange() {
    if (rootRef.current) onChange(serializeEditor(rootRef.current));
  }

  function handleInput(event: FormEvent<HTMLDivElement>) {
    const root = event.currentTarget;
    setEmpty(root.textContent?.trim() === "" && root.querySelector("ul, h2, h3") === null);
    emitChange();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
  }

  function runCommand(event: MouseEvent<HTMLButtonElement>, run: () => void) {
    event.preventDefault();
    rootRef.current?.focus();
    run();
    emitChange();
  }

  /** Selection inside the editor, or null. Read on mousedown so the toolbar click does not lose it. */
  function currentSelection(): Range | null {
    const root = rootRef.current;
    const selection = window.getSelection();
    if (!root || !selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    return root.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
  }

  function openLinkBar(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (linkOpen) {
      setLinkOpen(false);
      return;
    }
    const range = currentSelection();
    const anchor = range?.commonAncestorContainer instanceof Element ? range.commonAncestorContainer.closest("a") : range?.commonAncestorContainer.parentElement?.closest("a");
    savedRange.current = null;
    setLinkError(null);
    if (anchor && rootRef.current?.contains(anchor)) {
      const linkRange = document.createRange();
      linkRange.selectNodeContents(anchor);
      savedRange.current = linkRange;
      setLinkUrl(anchor.getAttribute("href") ?? "");
    } else if (range && !range.collapsed) {
      savedRange.current = range;
      setLinkUrl("");
    } else {
      setLinkUrl("");
      setLinkError(t("linkSelectText"));
    }
    setLinkOpen(true);
  }

  function restoreSelection(): boolean {
    const range = savedRange.current;
    const root = rootRef.current;
    if (!range || !root) return false;
    root.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  }

  function applyLink() {
    const url = normaliseLink(linkUrl);
    if (!isSafeHref(url)) {
      setLinkError(t("linkInvalid"));
      return;
    }
    if (!restoreSelection()) {
      setLinkError(t("linkSelectText"));
      return;
    }
    document.execCommand("createLink", false, url);
    emitChange();
    setLinkOpen(false);
  }

  function removeLink() {
    if (restoreSelection()) {
      document.execCommand("unlink");
      emitChange();
    }
    setLinkOpen(false);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <ReportFieldLabel htmlFor={id} label={label} icon={icon} required={required} />
      <div
        className={cn(
          "overflow-hidden rounded-xl transition focus-within:border-[var(--accent-border)] focus-within:ring-2 focus-within:ring-brand/25",
          "border-2 border-border/60 bg-transparent dark:border-text-primary/25",
          error && "border-[color-mix(in_srgb,var(--destructive)_68%,transparent)]",
        )}
      >
        <div role="toolbar" aria-label={`${label} formatting`} className="flex items-center gap-0.5 border-b border-border/50 px-1.5 py-1">
          {toolbar.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-label={item.label}
              title={item.label}
              onMouseDown={(event) => runCommand(event, item.onRun)}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              {item.glyph}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-border/60" aria-hidden />
          <button
            type="button"
            aria-label={t("linkButton")}
            title={t("linkButton")}
            aria-expanded={linkOpen}
            onMouseDown={openLinkBar}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-semibold transition-colors hover:bg-bg-hover hover:text-text-primary",
              linkOpen ? "text-brand" : "text-text-secondary",
            )}
          >
            <Icons.link className="size-4" aria-hidden />
            {t("linkButton")}
          </button>
        </div>

        {linkOpen ? (
          <div className="flex flex-col gap-3 border-b border-border/50 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Input
                  id={`${id}-link`}
                  type="url"
                  label={t("linkUrl")}
                  placeholder="https://"
                  value={linkUrl}
                  onChange={(event) => {
                    setLinkUrl(event.target.value);
                    setLinkError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyLink();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" size="md" onClick={applyLink}>
                  {t("linkApply")}
                </Button>
                <Button type="button" variant="outline" size="md" onClick={removeLink}>
                  {t("linkRemove")}
                </Button>
              </div>
            </div>
            {linkError ? <p className="text-sm text-destructive">{linkError}</p> : null}
          </div>
        ) : null}

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
              "[&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4",
            )}
          />
        </div>
      </div>
      {hint ? <p className="text-sm text-text-secondary">{hint}</p> : null}
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
