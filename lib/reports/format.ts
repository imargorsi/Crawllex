/** Number and text formatting shared by the report text and the HTML renderer. */

export function formatInt(value: number | null | undefined): string {
  if (value == null) return "–";
  return Math.round(value).toLocaleString("en-US");
}

/** Ratio (0–1) to percent with one decimal, e.g. 0.295 → "29.5%". */
export function formatPercent(ratio: number | null | undefined): string {
  if (ratio == null) return "–";
  return `${(ratio * 100).toFixed(1)}%`;
}

export function formatPosition(value: number | null | undefined): string {
  if (value == null) return "–";
  return value.toFixed(1);
}

/** Seconds to "1m 05s" (or "13s" under a minute). */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "–";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes === 0) return `${rest}s`;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}

type TChangeDirection = "up" | "down" | "flat" | "none";

export type TChange = {
  direction: TChangeDirection;
  /** Signed relative change, e.g. 0.12 = +12%. Null when there is no baseline. */
  ratio: number | null;
};

/** Relative change against a baseline. A zero or missing baseline gives no change. */
export function relativeChange(current: number, previous: number | null | undefined): TChange {
  if (previous == null || previous === 0) {
    return { direction: "none", ratio: null };
  }
  const ratio = (current - previous) / previous;
  return { direction: ratio > 0.0005 ? "up" : ratio < -0.0005 ? "down" : "flat", ratio };
}


/** Count with the right noun: "no clicks", "1 click", "29 clicks". */
export function countPhrase(value: number, singular: string, plural: string): string {
  if (value === 0) return `no ${plural}`;
  if (value === 1) return `1 ${singular}`;
  return `${formatInt(value)} ${plural}`;
}

/** Upper-cases the first character. Use on sentences that start with a count phrase. */
export function startCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
