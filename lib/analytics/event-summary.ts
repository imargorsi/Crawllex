/**
 * Turns raw GA4 event names into plain-language highlights.
 * Matching is token based, so unknown names still work: `add_to_cart`, `click_tel`, `tel_click`.
 */

export const CONTACT_KINDS = ["call", "email", "whatsapp"] as const;
export type TContactKind = (typeof CONTACT_KINDS)[number];

export type TEventKind =
  | TContactKind
  | "lead"
  | "download"
  | "firstVisit"
  | "pageView"
  | "sessionStart"
  | "engagement"
  | "click"
  | "other";

export type THighlightKind = Exclude<TEventKind, TContactKind>;

export type TEventHighlight = {
  kind: THighlightKind;
  /** Raw GA4 name(s) merged into this highlight, e.g. `click_tel`. */
  name: string;
  /** Title-cased name for `other` events, empty for known kinds. */
  label: string;
  count: number;
};

export type TEventSummary = {
  contacts: Record<TContactKind, number>;
  highlights: TEventHighlight[];
};

export type TEventRowInput = {
  dimensionValue: string;
  eventCount: number | null;
};

// Map, not a plain object: a plain object would match inherited keys such as "constructor".
const EXPLICIT = new Map<string, TEventKind>([
  ["first_visit", "firstVisit"],
  ["page_view", "pageView"],
  ["session_start", "sessionStart"],
  ["user_engagement", "engagement"],
]);

/** Lower number = shown first. Contacts always come first. */
const PRIORITY: Record<TEventKind, number> = {
  call: 0,
  email: 1,
  whatsapp: 2,
  lead: 3,
  download: 4,
  firstVisit: 5,
  sessionStart: 6,
  pageView: 7,
  click: 8,
  engagement: 9,
  other: 10,
};

function tokensOf(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function classifyEvent(name: string): TEventKind {
  const normalized = name.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const explicit = EXPLICIT.get(normalized);
  if (explicit) return explicit;

  const tokens = new Set(tokensOf(normalized));
  const has = (...words: string[]) => words.some((word) => tokens.has(word));

  if (has("tel", "phone", "call", "dial")) return "call";
  if (has("mailto", "email", "mail")) return "email";
  if (has("whatsapp", "wa", "wame")) return "whatsapp";
  if (has("form", "lead", "contact", "submit", "booking", "quote")) return "lead";
  if (has("download")) return "download";
  if (has("visit")) return "firstVisit";
  if (has("engagement", "scroll")) return "engagement";
  if (has("click")) return "click";
  return "other";
}

export function isContactKind(kind: TEventKind): kind is TContactKind {
  return (CONTACT_KINDS as readonly string[]).includes(kind);
}

export function humanizeEventName(name: string): string {
  return tokensOf(name)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function summarizeEvents(rows: TEventRowInput[]): TEventSummary {
  const contacts: Record<TContactKind, number> = { call: 0, email: 0, whatsapp: 0 };
  const byKey = new Map<string, TEventHighlight>();

  for (const row of rows) {
    const count = row.eventCount ?? 0;
    if (count <= 0 || !row.dimensionValue) continue;

    const kind = classifyEvent(row.dimensionValue);
    if (kind === "call" || kind === "email" || kind === "whatsapp") {
      contacts[kind] += count;
      continue;
    }

    // Unknown events stay separate per name; known kinds merge (e.g. click_tel + tel_click).
    const key = kind === "other" ? `other:${row.dimensionValue}` : kind;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += count;
      continue;
    }
    byKey.set(key, {
      kind,
      name: row.dimensionValue,
      label: kind === "other" ? humanizeEventName(row.dimensionValue) || row.dimensionValue : "",
      count,
    });
  }

  const highlights = [...byKey.values()].sort(
    (a, b) => PRIORITY[a.kind] - PRIORITY[b.kind] || b.count - a.count,
  );

  return { contacts, highlights };
}
