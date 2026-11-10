import type { TCorpusChunk } from "./corpus";
import { ORIEL_QUESTION_MAX_CHARS } from "./config";
import { type TScoredChunk, retrieve } from "./retrieve";
import { leakedTerm } from "./output-guard";

export const ORIEL_NOT_COVERED =
  "This is not covered in the Crawllex guides. Please contact your project owner or the Crawllex team.";

export const ORIEL_GREETING = "Hey, I am Oriel. What can I help you with?";

/** Short greetings only. Anything longer goes through retrieval. */
const GREETING_PATTERN = /^(hi|hey|hello|hiya|yo|good (morning|afternoon|evening))( there)?( oriel)?[\s!.?,]*$/i;

export type TOrielOutcome =
  | { kind: "answer"; message: string; sources: string[] }
  | { kind: "not_covered"; message: string; sources: string[] };

export type TOrielDeps = {
  chunks: TCorpusChunk[];
  generate: (content: string) => Promise<string>;
};

/** Remove control characters and cap length. The question is data, never instructions to this code. */
export function cleanQuestion(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ORIEL_QUESTION_MAX_CHARS);
}

export function buildGroundedPrompt(question: string, hits: TScoredChunk[]): string {
  const excerpts = hits
    .map(({ chunk }) => `[${chunk.source} › ${chunk.heading || "(section)"}]\n${chunk.text}`)
    .join("\n\n");
  return `Guide excerpts:\n\n${excerpts}\n\nUser question:\n${question}`;
}

/**
 * Answer a Crawllex how-to or product question from the functional corpus only.
 * No matching excerpt → fixed sentence, no model call (so nothing can be invented).
 * Model output that leaks internal terms → fixed sentence.
 */
export async function answerGuideQuestion(raw: string, deps: TOrielDeps): Promise<TOrielOutcome> {
  const question = cleanQuestion(raw);
  if (!question) return { kind: "not_covered", message: ORIEL_NOT_COVERED, sources: [] };
  if (GREETING_PATTERN.test(question)) return { kind: "answer", message: ORIEL_GREETING, sources: [] };

  const hits = retrieve(question, deps.chunks);
  if (hits.length === 0) return { kind: "not_covered", message: ORIEL_NOT_COVERED, sources: [] };

  const answer = (await deps.generate(buildGroundedPrompt(question, hits))).trim();
  if (!answer || leakedTerm(answer)) {
    return { kind: "not_covered", message: ORIEL_NOT_COVERED, sources: [] };
  }
  return {
    kind: "answer",
    message: answer,
    sources: [...new Set(hits.map((h) => `${h.chunk.source} › ${h.chunk.heading}`))],
  };
}
