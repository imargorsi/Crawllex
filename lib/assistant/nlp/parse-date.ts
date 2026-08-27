import { isValidIsoDate } from "@/lib/frontend/seo-activities/date-range.utils";

const MONTH_INDEX: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const MONTH_PATTERN = Object.keys(MONTH_INDEX).join("|");

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toIso(year: number, month: number, day: number): string | null {
  const iso = `${year}-${pad2(month)}-${pad2(day)}`;
  return isValidIsoDate(iso) ? iso : null;
}

function currentYear(now: Date): number {
  return now.getFullYear();
}

/** Parse ISO and month-name calendar dates. Ambiguous numeric dates (1/2/2026) are ignored. */
export function parseAssistantOnDates(query: string, now = new Date()): string[] {
  const dates = new Set<string>();
  const year = currentYear(now);

  for (const match of query.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)) {
    if (isValidIsoDate(match[1])) dates.add(match[1]!);
  }

  const monthFirst = new RegExp(
    `\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`,
    "gi",
  );
  for (const match of query.matchAll(monthFirst)) {
    const month = MONTH_INDEX[match[1]!.toLowerCase()];
    const day = Number(match[2]);
    const parsedYear = match[3] ? Number(match[3]) : year;
    const iso = month ? toIso(parsedYear, month, day) : null;
    if (iso) dates.add(iso);
  }

  const dayFirst = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_PATTERN})(?:,?\\s+(\\d{4}))?\\b`,
    "gi",
  );
  for (const match of query.matchAll(dayFirst)) {
    const day = Number(match[1]);
    const month = MONTH_INDEX[match[2]!.toLowerCase()];
    const parsedYear = match[3] ? Number(match[3]) : year;
    const iso = month ? toIso(parsedYear, month, day) : null;
    if (iso) dates.add(iso);
  }

  return [...dates];
}
