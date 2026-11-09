/**
 * Short-lived cache of AI answers, per server instance. Keyed by project, user and the normalized
 * question, so one user never reads another user's answer. Only successful AI answers are stored.
 * Five minutes keeps answers current enough for dashboard questions.
 */
export const ANSWER_CACHE_TTL_MS = 5 * 60 * 1000;
export const ANSWER_CACHE_MAX_ENTRIES = 200;

type TCacheEntry = { message: string; expiresAt: number };
const entries = new Map<string, TCacheEntry>();

export function answerCacheKey(projectId: string, userId: string, query: string): string {
  return `${projectId}|${userId}|${query.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

export function getCachedAnswer(key: string, now = Date.now()): string | null {
  const entry = entries.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    entries.delete(key);
    return null;
  }
  return entry.message;
}

export function setCachedAnswer(key: string, message: string, now = Date.now()): void {
  if (entries.size >= ANSWER_CACHE_MAX_ENTRIES) {
    // Oldest insertion first (Map keeps insertion order).
    const oldest = entries.keys().next().value;
    if (oldest !== undefined) entries.delete(oldest);
  }
  entries.set(key, { message, expiresAt: now + ANSWER_CACHE_TTL_MS });
}

export function resetAnswerCacheForTests(): void {
  entries.clear();
}
