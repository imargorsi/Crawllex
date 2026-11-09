/**
 * Checks a model reply against the data it was given. Every number in the reply must come from the
 * project data or the earlier answers (a ratio also counts as a percentage). Format labels the
 * model must never print (e.g. "Metric:") make the reply fail too.
 */

const NUMBER = /\d+(?:,\d{3})*(?:\.\d+)?/g;
const FORBIDDEN = /\b(Metric|Short Title|Bullet|Heading)\s*:/i;

/** All numeric values in a JSON-like value, plus their percent form for ratios. */
function numericValues(value: unknown, out: Set<number> = new Set()): Set<number> {
  if (typeof value === "number" && Number.isFinite(value)) {
    out.add(round(value));
    out.add(round(value * 100));
  } else if (typeof value === "string") {
    // Dates and labels in the data (e.g. "2026-10-10") carry numbers too.
    for (const n of numbersIn(value)) out.add(n);
  } else if (Array.isArray(value)) {
    for (const item of value) numericValues(item, out);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) numericValues(item, out);
  }
  return out;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Numbers printed in a text (commas removed, `%` ignored). */
function numbersIn(text: string): number[] {
  return (text.match(NUMBER) ?? []).map((token) => round(Number(token.replace(/,/g, ""))));
}

export function isGroundedReply(reply: string, data: unknown, earlierAnswers: string[]): boolean {
  if (FORBIDDEN.test(reply)) return false;
  const allowed = numericValues(data);
  for (const answer of earlierAnswers) numbersIn(answer).forEach((n) => allowed.add(n));
  return numbersIn(reply).every((n) => allowed.has(n));
}
