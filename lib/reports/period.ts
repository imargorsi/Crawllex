import { addUtcDays, inclusiveDaySpan } from "@/lib/integrations/date.utils";

import type { TReportPeriodDto } from "@/types/reports.types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** First and last day (YYYY-MM-DD) of a calendar month. `month` is 1-12. */
export function monthBounds(year: number, month: number): { from: string; to: string } {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}

export function isFullCalendarMonth(from: string, to: string): boolean {
  const [year, month, day] = from.split("-").map(Number);
  if (day !== 1) return false;
  return monthBounds(year, month).to === to;
}

/** Human label, e.g. "1 September 2026 – 30 September 2026". Uses an en dash. */
export function formatPeriodLabel(from: string, to: string): string {
  const format = (value: string): string => {
    const [year, month, day] = value.split("-").map(Number);
    return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
  };
  return `${format(from)} – ${format(to)}`;
}

/** Month name for titles, e.g. "September 2026". */
export function formatMonthTitle(from: string): string {
  const [year, month] = from.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Comparison window. A full calendar month compares with the previous calendar month.
 * Any other range compares with the same number of days immediately before it.
 */
export function resolveReportPeriod(from: string, to: string): TReportPeriodDto {
  let previousFrom: string;
  let previousTo: string;

  if (isFullCalendarMonth(from, to)) {
    const [year, month] = from.split("-").map(Number);
    const prev = month === 1 ? monthBounds(year - 1, 12) : monthBounds(year, month - 1);
    previousFrom = prev.from;
    previousTo = prev.to;
  } else {
    const span = inclusiveDaySpan(from, to);
    previousTo = addUtcDays(from, -1);
    previousFrom = addUtcDays(previousTo, -(span - 1));
  }

  return {
    from,
    to,
    label: formatPeriodLabel(from, to),
    previousFrom,
    previousTo,
    previousLabel: formatPeriodLabel(previousFrom, previousTo),
  };
}
