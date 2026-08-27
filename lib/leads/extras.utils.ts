import {
  LEAD_DATE_USE_TODAY,
  LEAD_EXTRAS_KEY_MAX_LENGTH,
  LEAD_EXTRAS_MAX_KEYS,
  LEAD_EXTRAS_VALUE_MAX_LENGTH,
  LEAD_FIELDS,
  LEAD_FIELD_SKIP,
} from "@/lib/leads/constants";
import type { TLeadColumnMapping, TLeadField } from "@/types/lead.types";

const RESERVED_EXTRAS_KEYS = new Set<string>([
  ...LEAD_FIELDS,
  "extras",
  "idempotencyKey",
  "pluginVersion",
]);

/** CSV headers currently assigned to a core Crawllex field. */
export function coreMappedHeaders(
  mapping: Pick<TLeadColumnMapping, TLeadField>,
): Set<string> {
  const used = new Set<string>();
  for (const field of LEAD_FIELDS) {
    const value = mapping[field];
    if (!value || value === LEAD_DATE_USE_TODAY || value === LEAD_FIELD_SKIP) continue;
    used.add(value);
  }
  return used;
}

/**
 * Unmapped headers default to Keep As Extra. Remembers explicit Skip while a
 * header stays unmapped; newly freed headers (unmapped from a core field) keep.
 */
export function reconcileExtrasHeaders(
  headers: readonly string[],
  mapping: Pick<TLeadColumnMapping, TLeadField>,
  previousExtras: readonly string[],
  previousUsed: ReadonlySet<string>,
): string[] {
  const used = coreMappedHeaders(mapping);
  const previousKeep = new Set(previousExtras);

  return headers.filter((header) => {
    if (used.has(header)) return false;
    if (previousKeep.has(header)) return true;
    // Newly unmapped (was assigned to a core field) → keep by default.
    return previousUsed.has(header);
  });
}

export function suggestExtrasHeaders(
  headers: readonly string[],
  mapping: Pick<TLeadColumnMapping, TLeadField>,
): string[] {
  const used = coreMappedHeaders(mapping);
  return headers.filter((header) => !used.has(header));
}

/** Build a plain string map from kept CSV columns (empty cells omitted). */
export function buildLeadExtras(
  row: Record<string, string>,
  extrasHeaders: readonly string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const header of extrasHeaders) {
    if (Object.keys(out).length >= LEAD_EXTRAS_MAX_KEYS) break;
    const key = header.trim().slice(0, LEAD_EXTRAS_KEY_MAX_LENGTH);
    if (!key || key in out) continue;
    const value = (row[header] ?? "").trim().slice(0, LEAD_EXTRAS_VALUE_MAX_LENGTH);
    if (!value) continue;
    out[key] = value;
  }
  return out;
}

export type TLeadExtrasCore = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  servicesInterestedIn?: string | null;
};

/** Elementor (and similar builders) use opaque ids like `field_e068e2d`. */
export function isGeneratedFormFieldKey(key: string): boolean {
  return /^field_[a-z0-9]+$/i.test(key.trim());
}

function extraValueDuplicatesCore(value: string, core: TLeadExtrasCore | undefined): boolean {
  if (!core) return false;
  const trimmed = value.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();
  const first = (core.firstName ?? "").trim();
  const last = (core.lastName ?? "").trim();
  const fullName = [first, last].filter(Boolean).join(" ");
  if (first && lower === first.toLowerCase()) return true;
  if (fullName && lower === fullName.toLowerCase()) return true;
  if ((core.email ?? "").trim() && lower === core.email!.trim().toLowerCase()) return true;
  if ((core.message ?? "").trim() && lower === core.message!.trim().toLowerCase()) return true;

  const extraDigits = trimmed.replace(/\D/g, "");
  const phoneDigits = (core.phone ?? "").replace(/\D/g, "");
  if (extraDigits.length >= 7 && phoneDigits.length >= 7 && extraDigits === phoneDigits) {
    return true;
  }
  return false;
}

/** Cap, drop reserved keys, drop extras that copy core values, and keep generated ids only when unique. */
export function sanitizeLeadExtras(
  raw: Record<string, string> | undefined,
  core?: TLeadExtrasCore,
): Record<string, string> {
  if (!raw) return {};
  const labeled: Record<string, string> = {};
  const generated: Array<[string, string]> = [];

  for (const [header, rawValue] of Object.entries(raw)) {
    const key = header.trim().slice(0, LEAD_EXTRAS_KEY_MAX_LENGTH);
    if (!key || RESERVED_EXTRAS_KEYS.has(key)) continue;
    const value = rawValue.trim().slice(0, LEAD_EXTRAS_VALUE_MAX_LENGTH);
    if (!value) continue;
    if (extraValueDuplicatesCore(value, core)) continue;
    if (isGeneratedFormFieldKey(key)) {
      generated.push([key, value]);
      continue;
    }
    if (key in labeled) continue;
    if (Object.keys(labeled).length >= LEAD_EXTRAS_MAX_KEYS) break;
    labeled[key] = value;
  }

  const seen = new Set(Object.values(labeled).map((value) => value.trim().toLowerCase()));
  for (const [key, value] of generated) {
    if (Object.keys(labeled).length >= LEAD_EXTRAS_MAX_KEYS) break;
    const lower = value.trim().toLowerCase();
    if (seen.has(lower)) continue;
    labeled[key] = value;
    seen.add(lower);
  }
  return labeled;
}

/**
 * Additional Fields for UI/export: core services land here, generated ids and
 * duplicates of name/email/phone/message are omitted.
 */
export function leadExtrasForDisplay(
  lead: TLeadExtrasCore & { extras?: Record<string, string> | null },
  servicesLabel: string,
): Array<[string, string]> {
  const merged: Record<string, string> = { ...(lead.extras ?? {}) };
  const services = lead.servicesInterestedIn?.trim();
  if (services) {
    const already = Object.values(merged).some(
      (value) => value.trim().toLowerCase() === services.toLowerCase(),
    );
    if (!already) {
      merged[servicesLabel] = services;
    }
  }
  return Object.entries(sanitizeLeadExtras(merged, lead));
}

export function extrasRecordFromDoc(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  if (value instanceof Map) {
    const out: Record<string, string> = {};
    for (const [key, raw] of value.entries()) {
      if (typeof key !== "string" || typeof raw !== "string") continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      out[key] = trimmed;
    }
    return out;
  }
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    out[key] = trimmed;
  }
  return out;
}
