/**
 * Turns an assistant answer into blocks for rendering. Plain-text in, React-safe blocks out.
 * Supports only: `## Heading`, `- bullet` / `* bullet`, blank-line paragraphs, and `**bold**` inline.
 * No HTML, no links, no code. Anything else stays as text.
 */

export type TAssistantBlock =
  | { type: "heading"; text: string }
  | { type: "bullet"; text: string }
  | { type: "paragraph"; text: string };

export type TAssistantInlineSegment = { text: string; bold: boolean };

const HEADING = /^#{2,3}\s+(.+)$/;
const BULLET = /^[-*]\s+(.+)$/;

export function parseAssistantMessage(message: string): TAssistantBlock[] {
  const blocks: TAssistantBlock[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  for (const raw of message.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push({ type: "heading", text: heading[1].trim() });
      continue;
    }
    const bullet = BULLET.exec(line);
    if (bullet) {
      flush();
      blocks.push({ type: "bullet", text: bullet[1].trim() });
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return blocks;
}

/** Splits `**bold**` runs. Unpaired asterisks stay as plain text. */
export function parseAssistantInline(text: string): TAssistantInlineSegment[] {
  const segments: TAssistantInlineSegment[] = [];
  const parts = text.split(/\*\*(.+?)\*\*/g);
  parts.forEach((part, index) => {
    if (!part) return;
    segments.push({ text: part, bold: index % 2 === 1 });
  });
  return segments;
}
