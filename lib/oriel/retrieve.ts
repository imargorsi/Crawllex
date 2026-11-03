import type { TCorpusChunk } from "./corpus";
import { ORIEL_MIN_SCORE, ORIEL_TOP_K } from "./config";

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from", "how", "i", "if",
  "in", "is", "it", "its", "me", "my", "of", "on", "or", "our", "so", "that", "the", "their", "this",
  "to", "we", "what", "when", "which", "who", "why", "will", "with", "you", "your", "there", "then",
  "about", "any", "get", "use", "need", "want", "tell", "please", "explain", "help", "crawllex", "platform",
]);

/** Lowercase, split on non-letters/digits, drop stopwords, crude stemming. Language: Latin script only. */
export function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const out: string[] = [];
  for (const raw of words) {
    if (STOPWORDS.has(raw)) continue;
    let w = raw;
    if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
    else if (w.length > 4 && w.endsWith("ing")) w = w.slice(0, -3);
    else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
    out.push(w);
  }
  return out;
}

export type TScoredChunk = { chunk: TCorpusChunk; score: number };

const K1 = 1.2;
const B = 0.75;

/** BM25 over corpus chunks. Heading terms count double. Returns top chunks above the minimum score. */
export function retrieve(question: string, chunks: TCorpusChunk[]): TScoredChunk[] {
  const queryTerms = [...new Set(tokenize(question))];
  if (queryTerms.length === 0 || chunks.length === 0) return [];

  const docs = chunks.map((chunk) => {
    const body = tokenize(chunk.text);
    const head = tokenize(chunk.heading);
    return { chunk, tf: countTerms([...body, ...head, ...head]), len: body.length + head.length * 2 };
  });
  const avgLen = docs.reduce((sum, d) => sum + d.len, 0) / docs.length || 1;
  const df = new Map<string, number>();
  for (const term of queryTerms) {
    df.set(term, docs.filter((d) => d.tf.has(term)).length);
  }

  const scored: TScoredChunk[] = docs.map((doc) => {
    let score = 0;
    let matched = 0;
    for (const term of queryTerms) {
      const f = doc.tf.get(term) ?? 0;
      if (f === 0) continue;
      matched += 1;
      const n = df.get(term) ?? 0;
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * doc.len) / avgLen)));
    }
    // A single shared word is not enough when the question has several content words.
    const enough = queryTerms.length === 1 ? matched >= 1 : matched >= 2;
    return { chunk: doc.chunk, score: enough ? score : 0 };
  });

  return scored
    .filter((s) => s.score >= ORIEL_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, ORIEL_TOP_K);
}

function countTerms(terms: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of terms) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}
