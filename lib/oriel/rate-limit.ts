import { ORIEL_RATE_LIMIT_PER_MINUTE } from "./config";

/** Per-user sliding window, per server instance. Replace with a shared store before scaling out. */
const hits = new Map<string, number[]>();

export function allowOrielRequest(userId: string, now = Date.now()): boolean {
  const windowStart = now - 60_000;
  const recent = (hits.get(userId) ?? []).filter((t) => t > windowStart);
  if (recent.length >= ORIEL_RATE_LIMIT_PER_MINUTE) {
    hits.set(userId, recent);
    return false;
  }
  recent.push(now);
  hits.set(userId, recent);
  return true;
}

export function resetOrielRateLimitForTests(): void {
  hits.clear();
}
