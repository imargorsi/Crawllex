import { monthBounds } from "@/lib/reports/period";

export type TMonthOption = {
  /** YYYY-MM, the value of the month picker. */
  value: string;
  year: number;
  month: number;
};

/** Newest first, `count` months back from the reference date (UTC). */
export function buildMonthOptions(count = 24, now = new Date()): TMonthOption[] {
  const options: TMonthOption[] = [];
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;
  for (let index = 0; index < count; index += 1) {
    options.push({
      value: `${year}-${String(month).padStart(2, "0")}`,
      year,
      month,
    });
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return options;
}

/** Default selection: the previous full calendar month, which is what a monthly report covers. */
export function defaultMonthValue(now = new Date()): string {
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** YYYY-MM to the first and last day of that month. Returns null for malformed input. */
export function monthValueToPeriod(value: string): { periodFrom: string; periodTo: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const bounds = monthBounds(year, month);
  return { periodFrom: bounds.from, periodTo: bounds.to };
}
