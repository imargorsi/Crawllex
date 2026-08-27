import { assistantWindowSpec } from "@/lib/assistant/nlp/windows";
import type { TDateRangePresetId } from "@/lib/frontend/seo-activities/date-range.utils";
import type { TAssistantWindowSpec } from "@/types/assistant.types";

const WORD_AMOUNTS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  twenty: 20,
  thirty: 30,
  sixty: 60,
  ninety: 90,
};

const LAST_N_DAY_PRESETS: Record<number, TDateRangePresetId> = {
  15: "last_15_days",
  30: "last_30_days",
  90: "last_90_days",
};

const AMOUNT = "(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|twenty|thirty|sixty|ninety)";
const LAST = "(?:in\\s+)?(?:the\\s+)?(?:last|past|previous)";

function parseAmount(raw: string): number | null {
  if (/^\d+$/.test(raw)) {
    const value = Number(raw);
    return Number.isFinite(value) && value >= 1 ? value : null;
  }
  return WORD_AMOUNTS[raw.toLowerCase()] ?? null;
}

function windowFromDays(days: number): TAssistantWindowSpec | null {
  if (!Number.isFinite(days) || days < 1) return null;
  const preset = LAST_N_DAY_PRESETS[days];
  if (preset) return assistantWindowSpec({ preset });
  return assistantWindowSpec({ lastNDays: days });
}

/** last/past N days, weeks, or months — digits or words, including "the last day". */
export function parseAssistantDurationWindow(query: string): TAssistantWindowSpec | null {
  const months = query.match(new RegExp(`\\b${LAST}\\s+${AMOUNT}\\s+months?\\b`, "i"));
  if (months) {
    const amount = parseAmount(months[1]!);
    if (amount) return assistantWindowSpec({ lastNMonths: amount });
  }

  const weeks = query.match(new RegExp(`\\b${LAST}\\s+${AMOUNT}\\s+weeks?\\b`, "i"));
  if (weeks) {
    const amount = parseAmount(weeks[1]!);
    if (amount) return assistantWindowSpec({ lastNWeeks: amount });
  }

  const days = query.match(new RegExp(`\\b${LAST}\\s+${AMOUNT}\\s+days?\\b`, "i"));
  if (days) {
    const amount = parseAmount(days[1]!);
    if (amount) return windowFromDays(amount);
  }

  if (new RegExp(`\\b${LAST}\\s+days?\\b`, "i").test(query)) {
    return windowFromDays(1);
  }

  const shorthand = query.match(/\b(?:last|past|previous)\s+(7|14|15|30|60|90)\b/i);
  if (shorthand) return windowFromDays(Number(shorthand[1]));

  return null;
}
