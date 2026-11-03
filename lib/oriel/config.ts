import path from "node:path";

/** Oriel retrieval settings. All values are server-side; nothing here reaches the browser. */
export function orielEnabled(): boolean {
  return process.env.ORIEL_ENABLED === "true";
}

/** Functional corpus folder. Dev default: doc/oriel/corpus (local, gitignored). */
export function orielCorpusDir(): string {
  return process.env.ORIEL_CORPUS_DIR?.trim() || path.join(process.cwd(), "doc", "oriel", "corpus");
}

/** Oriel API on logibox, tailnet only. Example: http://100.90.184.0:8643 */
export function orielApiConfig(): { baseUrl: string; key: string } | null {
  const baseUrl = process.env.ORIEL_BASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.ORIEL_API_KEY?.trim();
  if (!baseUrl || !key) return null;
  return { baseUrl, key };
}

export const ORIEL_TOP_K = 3;
export const ORIEL_MIN_SCORE = 1.5;
export const ORIEL_QUESTION_MAX_CHARS = 500;
export const ORIEL_TIMEOUT_MS = 120_000;
export const ORIEL_RATE_LIMIT_PER_MINUTE = 20;
