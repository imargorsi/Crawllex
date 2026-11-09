/**
 * One-shot hand-off from the dashboard shortcut to the Oriel page: a conversation to open or a
 * question to ask. Kept in sessionStorage (this tab only, cleared after use). Not business data.
 */
const KEY = "crawllex.oriel.handoff";

export type TOrielHandoff = { threadId?: string; query?: string };

export function setOrielHandoff(handoff: TOrielHandoff): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(handoff));
  } catch {
    // Storage blocked: the page opens without the hand-off.
  }
}

/** Reads the pending hand-off without clearing it. */
export function peekOrielHandoff(): TOrielHandoff {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TOrielHandoff) : {};
  } catch {
    return {};
  }
}

export function clearOrielHandoff(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
