import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type TCorpusChunk = {
  id: string;
  source: string;
  heading: string;
  text: string;
};

/** Split one markdown file into chunks at "##" and "###" headings. Keeps the heading path. */
export function chunkMarkdown(source: string, markdown: string): TCorpusChunk[] {
  const chunks: TCorpusChunk[] = [];
  let title = "";
  let section = "";
  let sub = "";
  let lines: string[] = [];

  const flush = () => {
    const text = lines.join("\n").trim();
    if (text) {
      chunks.push({
        id: `${source}#${chunks.length + 1}`,
        source,
        heading: [title, section, sub].filter(Boolean).join(" › "),
        text,
      });
    }
    lines = [];
  };

  for (const line of markdown.split("\n")) {
    const h1 = /^#\s+(.+)$/.exec(line);
    const h2 = /^##\s+(.+)$/.exec(line);
    const h3 = /^###\s+(.+)$/.exec(line);
    if (h1) {
      flush();
      title = h1[1]!.trim();
      section = "";
      sub = "";
      continue;
    }
    if (h2) {
      flush();
      section = h2[1]!.trim();
      sub = "";
      continue;
    }
    if (h3) {
      flush();
      sub = h3[1]!.trim();
      continue;
    }
    lines.push(line);
  }
  flush();
  return chunks;
}

/** Load every corpus file (MANIFEST excluded). Read at first use and cached per process. */
let cache: { dir: string; chunks: TCorpusChunk[] } | null = null;

export function loadCorpus(dir: string): TCorpusChunk[] {
  if (cache && cache.dir === dir) return cache.chunks;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "MANIFEST.md")
    .sort();
  const chunks: TCorpusChunk[] = [];
  for (const file of files) {
    const markdown = readFileSync(path.join(dir, file), "utf8");
    chunks.push(...chunkMarkdown(file, markdown));
  }
  cache = { dir, chunks };
  return chunks;
}

export function resetCorpusCacheForTests(): void {
  cache = null;
}
