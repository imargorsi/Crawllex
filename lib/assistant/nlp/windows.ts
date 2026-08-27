import type { TDateRangePresetId } from "@/lib/frontend/seo-activities/date-range.utils";
import { resolveDateRangePreset } from "@/lib/frontend/seo-activities/date-range.utils";
import { ANALYTICS_MAX_RANGE_DAYS } from "@/lib/integrations/constants";
import {
  addUtcDays,
  inclusiveDaySpan,
  parseUtcDateString,
  resolveAnalyticsDatePreset,
  toUtcDateString,
  utcYesterdayString,
} from "@/lib/integrations/date.utils";
import type { TAssistantWindowSpec } from "@/types/assistant.types";

export type TResolvedAssistantRange = {
  from: string | null;
  to: string | null;
  label: string;
  isEmpty?: boolean;
  notice?: string;
};

const PRESET_LABELS: Record<TDateRangePresetId, string> = {
  all: "all time",
  last_15_days: "the last 15 days",
  last_30_days: "the last 30 days",
  last_90_days: "the last 90 days",
  last_month: "last month",
  this_month: "this month",
  last_year: "last year",
  this_year: "this year",
};

const NAMED_LABELS = {
  today: "today",
  yesterday: "yesterday",
  this_week: "this week",
  last_week: "last week",
} as const;

export function emptyAssistantWindow(): TAssistantWindowSpec {
  return {
    preset: null,
    lastNDays: null,
    lastNWeeks: null,
    lastNMonths: null,
    named: null,
    onDate: null,
  };
}

export function assistantWindowSpec(
  spec: Partial<TAssistantWindowSpec>,
): TAssistantWindowSpec {
  return {
    preset: spec.preset ?? null,
    lastNDays: spec.lastNDays ?? null,
    lastNWeeks: spec.lastNWeeks ?? null,
    lastNMonths: spec.lastNMonths ?? null,
    named: spec.named ?? null,
    onDate: spec.onDate ?? null,
  };
}

function lastNDaysLabel(days: number): string {
  return days === 1 ? "the last day" : `the last ${days} days`;
}

function lastNUnitLabel(amount: number, unit: "week" | "month"): string {
  return amount === 1 ? `the last ${unit}` : `the last ${amount} ${unit}s`;
}

function localTodayIso(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addLocalDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year!, month! - 1, day! + days);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function addLocalMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const cursor = new Date(year!, month! - 1 + months, 1);
  const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  cursor.setDate(Math.min(day!, lastDay));
  const nextYear = cursor.getFullYear();
  const nextMonth = String(cursor.getMonth() + 1).padStart(2, "0");
  const nextDay = String(cursor.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function addUtcMonths(isoDate: string, months: number): string {
  const date = parseUtcDateString(isoDate);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return toUtcDateString(date);
}

function mondayOfLocalWeek(now: Date): string {
  const today = localTodayIso(now);
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  const weekday = date.getDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  return addLocalDays(today, -offset);
}

function mondayOfUtcWeek(now: Date): string {
  const utcToday = toUtcDateString(now);
  const weekday = parseUtcDateString(utcToday).getUTCDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  return addUtcDays(utcToday, -offset);
}

export function formatOnDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  const formatted = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `on ${formatted}`;
}

function clampAnalyticsRange(from: string, to: string): { from: string; to: string } {
  if (inclusiveDaySpan(from, to) <= ANALYTICS_MAX_RANGE_DAYS) {
    return { from, to };
  }
  return { from: addUtcDays(to, -(ANALYTICS_MAX_RANGE_DAYS - 1)), to };
}

function analyticsYearRange(
  preset: "this_year" | "last_year",
  now: Date,
): { from: string; to: string } {
  const yesterday = utcYesterdayString(now);
  if (preset === "this_year") {
    const from = toUtcDateString(new Date(Date.UTC(now.getUTCFullYear(), 0, 1)));
    return clampAnalyticsRange(from, yesterday);
  }
  const year = now.getUTCFullYear() - 1;
  const from = toUtcDateString(new Date(Date.UTC(year, 0, 1)));
  const to = toUtcDateString(new Date(Date.UTC(year, 11, 31)));
  return clampAnalyticsRange(from, to);
}

function analyticsAllRange(now: Date): { from: string; to: string } {
  const to = utcYesterdayString(now);
  return { from: addUtcDays(to, -(ANALYTICS_MAX_RANGE_DAYS - 1)), to };
}

function analyticsLatestCompleteNotice(
  requestedLabel: string,
  yesterday: string,
): TResolvedAssistantRange {
  return {
    from: yesterday,
    to: yesterday,
    label: "yesterday",
    notice: `Search data for ${requestedLabel} isn't available yet.`,
  };
}

export function resolveLeadsSeoWindow(
  spec: TAssistantWindowSpec,
  fallback: "this_month" | "all",
  now = new Date(),
): TResolvedAssistantRange {
  if (spec.onDate) {
    return {
      from: spec.onDate,
      to: spec.onDate,
      label: formatOnDateLabel(spec.onDate),
    };
  }

  if (spec.named === "today") {
    const today = localTodayIso(now);
    return { from: today, to: today, label: NAMED_LABELS.today };
  }

  if (spec.named === "yesterday") {
    const yesterday = addLocalDays(localTodayIso(now), -1);
    return { from: yesterday, to: yesterday, label: NAMED_LABELS.yesterday };
  }

  if (spec.named === "this_week") {
    const from = mondayOfLocalWeek(now);
    const to = localTodayIso(now);
    return { from, to, label: NAMED_LABELS.this_week };
  }

  if (spec.named === "last_week") {
    const thisMonday = mondayOfLocalWeek(now);
    const from = addLocalDays(thisMonday, -7);
    const to = addLocalDays(thisMonday, -1);
    return { from, to, label: NAMED_LABELS.last_week };
  }

  if (spec.lastNMonths != null && spec.lastNMonths > 0) {
    const to = localTodayIso(now);
    const from = addLocalMonths(to, -spec.lastNMonths);
    return { from, to, label: lastNUnitLabel(spec.lastNMonths, "month") };
  }

  if (spec.lastNWeeks != null && spec.lastNWeeks > 0) {
    const to = localTodayIso(now);
    const from = addLocalDays(to, -(spec.lastNWeeks * 7 - 1));
    return { from, to, label: lastNUnitLabel(spec.lastNWeeks, "week") };
  }

  if (spec.lastNDays != null && spec.lastNDays > 0) {
    const to = localTodayIso(now);
    const from = addLocalDays(to, -(spec.lastNDays - 1));
    return { from, to, label: lastNDaysLabel(spec.lastNDays) };
  }

  const preset = spec.preset ?? fallback;
  if (preset === "all") {
    return { from: null, to: null, label: PRESET_LABELS.all };
  }

  const range = resolveDateRangePreset(preset, now);
  return {
    from: range.from,
    to: range.to,
    label: PRESET_LABELS[preset],
  };
}

export function resolveAnalyticsWindow(
  spec: TAssistantWindowSpec,
  now = new Date(),
): TResolvedAssistantRange {
  const yesterday = utcYesterdayString(now);

  if (spec.onDate) {
    if (spec.onDate > yesterday) {
      return analyticsLatestCompleteNotice(formatOnDateLabel(spec.onDate), yesterday);
    }
    return {
      from: spec.onDate,
      to: spec.onDate,
      label: formatOnDateLabel(spec.onDate),
    };
  }

  if (spec.named === "today") {
    return analyticsLatestCompleteNotice(NAMED_LABELS.today, yesterday);
  }

  if (spec.named === "yesterday") {
    return { from: yesterday, to: yesterday, label: NAMED_LABELS.yesterday };
  }

  if (spec.named === "this_week") {
    const from = mondayOfUtcWeek(now);
    if (from > yesterday) {
      return {
        from,
        to: yesterday,
        label: NAMED_LABELS.this_week,
        isEmpty: true,
      };
    }
    return { from, to: yesterday, label: NAMED_LABELS.this_week };
  }

  if (spec.named === "last_week") {
    const thisMonday = mondayOfUtcWeek(now);
    const from = addUtcDays(thisMonday, -7);
    const to = addUtcDays(thisMonday, -1);
    return { from, to, label: NAMED_LABELS.last_week };
  }

  if (spec.lastNMonths != null && spec.lastNMonths > 0) {
    const unclampedFrom = addUtcMonths(yesterday, -spec.lastNMonths);
    const range = clampAnalyticsRange(unclampedFrom, yesterday);
    return { from: range.from, to: range.to, label: lastNUnitLabel(spec.lastNMonths, "month") };
  }

  if (spec.lastNWeeks != null && spec.lastNWeeks > 0) {
    const unclampedFrom = addUtcDays(yesterday, -(spec.lastNWeeks * 7 - 1));
    const range = clampAnalyticsRange(unclampedFrom, yesterday);
    return { from: range.from, to: range.to, label: lastNUnitLabel(spec.lastNWeeks, "week") };
  }

  if (spec.lastNDays != null && spec.lastNDays > 0) {
    const unclampedFrom = addUtcDays(yesterday, -(spec.lastNDays - 1));
    const range = clampAnalyticsRange(unclampedFrom, yesterday);
    const span = inclusiveDaySpan(range.from, range.to);
    return { from: range.from, to: range.to, label: lastNDaysLabel(span) };
  }

  const preset = spec.preset ?? "last_30_days";

  if (preset === "all") {
    const range = analyticsAllRange(now);
    return {
      from: range.from,
      to: range.to,
      label: lastNDaysLabel(ANALYTICS_MAX_RANGE_DAYS),
    };
  }

  if (preset === "this_year" || preset === "last_year") {
    const range = analyticsYearRange(preset, now);
    return { from: range.from, to: range.to, label: PRESET_LABELS[preset] };
  }

  const range = resolveAnalyticsDatePreset(preset, now);
  if (!range.from || !range.to) {
    const fallback = resolveAnalyticsDatePreset("last_30_days", now);
    return {
      from: fallback.from!,
      to: fallback.to!,
      label: PRESET_LABELS.last_30_days,
    };
  }

  return { from: range.from, to: range.to, label: PRESET_LABELS[preset] };
}

export function rangeQuery(from: string | null, to: string | null): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
