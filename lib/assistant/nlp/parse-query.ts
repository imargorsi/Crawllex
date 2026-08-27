import { extractAssistantEntities } from "@/lib/assistant/nlp/engine";
import { correctAssistantQuery } from "@/lib/assistant/nlp/correct-query";
import {
  ASSISTANT_LEXICON_TERM_SET,
  ASSISTANT_PHRASE_ENTITIES,
  ASSISTANT_TERM_ENTITIES,
} from "@/lib/assistant/nlp/lexicon";
import { normalizeAssistantQuery } from "@/lib/assistant/nlp/normalize";
import { parseAssistantOnDates } from "@/lib/assistant/nlp/parse-date";
import { parseAssistantDurationWindow } from "@/lib/assistant/nlp/parse-duration";
import {
  assistantWindowSpec,
  emptyAssistantWindow,
} from "@/lib/assistant/nlp/windows";
import type { TAnalyticsDimensionType, TAnalyticsSource } from "@/lib/integrations/constants";
import type { TDateRangePresetId } from "@/lib/frontend/seo-activities/date-range.utils";
import type { TSeoActivityType } from "@/types/seo-activity.types";
import type {
  TAssistantAnalyticsMetric,
  TAssistantNamedWindow,
  TAssistantParse,
  TAssistantWindowSpec,
} from "@/types/assistant.types";

type TParsedSlots = {
  domains: Set<"leads" | "analytics" | "seo">;
  metrics: TAssistantAnalyticsMetric[];
  dimensions: TAnalyticsDimensionType[];
  activityTypes: Array<TSeoActivityType | "all">;
  windows: TAssistantWindowSpec[];
  hasTop: boolean;
  source: TAnalyticsSource | null;
};

const METRIC_TYPES: Record<string, TAssistantAnalyticsMetric> = {
  "metric.clicks": "clicks",
  "metric.impressions": "impressions",
  "metric.ctr": "ctr",
  "metric.position": "position",
  "metric.sessions": "sessions",
  "metric.totalUsers": "totalUsers",
  "metric.newUsers": "newUsers",
  "metric.organicSessions": "organicSessions",
  "metric.pageViews": "pageViews",
  "metric.engagementRate": "engagementRate",
  "metric.avgSessionDuration": "avgSessionDuration",
};

const DIMENSION_TYPES: Record<string, TAnalyticsDimensionType> = {
  "dimension.query": "query",
  "dimension.page": "page",
  "dimension.country": "country",
  "dimension.device": "device",
  "dimension.landing_page": "landing_page",
  "dimension.channel_group": "channel_group",
};

const WINDOW_PRESETS: Record<string, TDateRangePresetId> = {
  "window.this_month": "this_month",
  "window.last_month": "last_month",
  "window.this_year": "this_year",
  "window.last_year": "last_year",
  "window.all": "all",
};

const WINDOW_NAMED: Record<string, TAssistantNamedWindow> = {
  "window.today": "today",
  "window.yesterday": "yesterday",
  "window.this_week": "this_week",
  "window.last_week": "last_week",
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function serializeWindow(window: TAssistantWindowSpec): string {
  return `${window.preset ?? ""}:${window.lastNDays ?? ""}:${window.lastNWeeks ?? ""}:${window.lastNMonths ?? ""}:${window.named ?? ""}:${window.onDate ?? ""}`;
}

function applyAllTimeKeywords(query: string, slots: TParsedSlots): void {
  if (/\b(?:overall|altogether)\b/i.test(query) || /\bin total\b/i.test(query)) {
    slots.windows.push(assistantWindowSpec({ preset: "all" }));
  }
  if (/\btotal\b/i.test(query) && !/\btotal\s+(users?|visitors?)\b/i.test(query)) {
    slots.windows.push(assistantWindowSpec({ preset: "all" }));
  }
}

function applyEntity(slots: TParsedSlots, entityType: string): void {
  if (entityType === "domain.leads") slots.domains.add("leads");
  if (entityType === "domain.analytics") slots.domains.add("analytics");
  if (entityType === "domain.seo") slots.domains.add("seo");

  const metric = METRIC_TYPES[entityType];
  if (metric) slots.metrics.push(metric);

  const dimension = DIMENSION_TYPES[entityType];
  if (dimension) slots.dimensions.push(dimension);

  if (entityType === "activity.blogs") slots.activityTypes.push("blogs");
  if (entityType === "activity.backlinks") slots.activityTypes.push("backlinks");
  if (entityType === "activity.technical_work") {
    slots.activityTypes.push("technical_work");
  }

  const preset = WINDOW_PRESETS[entityType];
  if (preset) slots.windows.push(assistantWindowSpec({ preset }));

  const named = WINDOW_NAMED[entityType];
  if (named) slots.windows.push(assistantWindowSpec({ named }));

  if (entityType === "topic.top") slots.hasTop = true;
  if (entityType === "source.gsc") slots.source = "gsc";
  if (entityType === "source.ga4") slots.source = "ga4";
}

function windowSpecificity(window: TAssistantWindowSpec): number {
  if (window.onDate) return 100;
  if (window.named === "today" || window.named === "yesterday") return 90;
  if (window.named === "this_week" || window.named === "last_week") return 70;
  if (window.lastNDays != null || window.lastNWeeks != null || window.lastNMonths != null) {
    return 70;
  }
  if (
    window.preset === "last_15_days" ||
    window.preset === "last_30_days" ||
    window.preset === "last_90_days"
  ) {
    return 60;
  }
  if (window.preset === "this_month" || window.preset === "last_month") return 50;
  if (window.preset === "this_year" || window.preset === "last_year") return 30;
  if (window.preset === "all") return 10;
  return 0;
}

/** Fill slots from wink (best-effort), then lexicon tokens/phrases, then duration and calendar parsers. */
function collectSlots(query: string): TParsedSlots {
  const slots: TParsedSlots = {
    domains: new Set(),
    metrics: [],
    dimensions: [],
    activityTypes: [],
    windows: [],
    hasTop: false,
    source: null,
  };

  for (const entity of extractAssistantEntities(query)) {
    applyEntity(slots, entity.type);
  }

  for (const token of query.toLowerCase().split(/\s+/)) {
    const entityType = ASSISTANT_TERM_ENTITIES[token];
    if (entityType) applyEntity(slots, entityType);
  }

  const lowered = query.toLowerCase().replace(/-/g, " ");
  for (const item of ASSISTANT_PHRASE_ENTITIES) {
    if (lowered.includes(item.phrase)) applyEntity(slots, item.entity);
  }

  const duration = parseAssistantDurationWindow(query);
  if (duration) slots.windows.push(duration);

  for (const onDate of parseAssistantOnDates(query)) {
    slots.windows.push(assistantWindowSpec({ onDate }));
  }

  applyAllTimeKeywords(query, slots);

  if (/\b(?:total|all)\s+leads\b/i.test(query)) {
    slots.domains.add("leads");
    slots.windows.push(assistantWindowSpec({ preset: "all" }));
  }

  slots.metrics = unique(slots.metrics);
  slots.dimensions = unique(slots.dimensions);
  slots.activityTypes = unique(slots.activityTypes);

  return slots;
}

function pickWindow(windows: TAssistantWindowSpec[]): TAssistantWindowSpec | null {
  if (windows.length === 0) return emptyAssistantWindow();

  const uniqueWindows: TAssistantWindowSpec[] = [];
  const seen = new Set<string>();
  for (const window of windows) {
    const key = serializeWindow(window);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueWindows.push(window);
  }

  if (uniqueWindows.length === 1) return uniqueWindows[0] ?? emptyAssistantWindow();

  const ranked = uniqueWindows
    .slice()
    .sort((a, b) => windowSpecificity(b) - windowSpecificity(a));
  const best = ranked[0];
  const second = ranked[1];
  if (!best || !second) return best ?? emptyAssistantWindow();
  if (windowSpecificity(best) > windowSpecificity(second)) return best;
  return null;
}

function inferDomain(slots: TParsedSlots): "leads" | "analytics" | "seo" | null {
  const explicit = [...slots.domains];
  const fromTopics = new Set<"leads" | "analytics" | "seo">();
  if (slots.metrics.length > 0 || slots.dimensions.length > 0) fromTopics.add("analytics");
  if (slots.activityTypes.length > 0) fromTopics.add("seo");

  if (fromTopics.size > 1) return null;

  if (fromTopics.size === 1) {
    const topic = [...fromTopics][0]!;
    if (explicit.some((domain) => domain !== topic)) return null;
    return topic;
  }

  if (explicit.length === 1) return explicit[0] ?? null;
  return null;
}

function preferDimension(dimensions: TAnalyticsDimensionType[]): TAnalyticsDimensionType | null {
  if (dimensions.length === 0) return null;
  if (dimensions.includes("landing_page")) return "landing_page";
  if (dimensions.includes("channel_group")) return "channel_group";
  if (dimensions.length > 1) return null;
  return dimensions[0] ?? null;
}

function preferMetric(metrics: TAssistantAnalyticsMetric[]): TAssistantAnalyticsMetric | null {
  if (metrics.length === 0) return null;
  const order: TAssistantAnalyticsMetric[] = [
    "avgSessionDuration",
    "organicSessions",
    "pageViews",
    "newUsers",
    "engagementRate",
    "ctr",
    "position",
    "impressions",
    "totalUsers",
    "sessions",
    "clicks",
  ];
  return order.find((metric) => metrics.includes(metric)) ?? metrics[0] ?? null;
}

function dimensionSource(
  dimension: TAnalyticsDimensionType,
  source: TAnalyticsSource | null,
): TAnalyticsSource {
  if (source) {
    if (dimension === "query" || dimension === "device") return "gsc";
    if (dimension === "landing_page" || dimension === "channel_group") return "ga4";
    return source;
  }
  if (dimension === "landing_page" || dimension === "channel_group") return "ga4";
  return "gsc";
}

export function parseAssistantQuery(query: string): TAssistantParse {
  const normalized = correctAssistantQuery(
    normalizeAssistantQuery(query),
    ASSISTANT_LEXICON_TERM_SET,
  );
  if (!normalized) return { kind: "unknown" };

  const slots = collectSlots(normalized);
  const window = pickWindow(slots.windows);
  if (window == null) return { kind: "unknown" };

  const domain = inferDomain(slots);
  if (domain == null) return { kind: "unknown" };

  if (domain === "leads") {
    return { kind: "leads_count", window };
  }

  if (domain === "seo") {
    const activityType =
      slots.activityTypes.length === 1 ? slots.activityTypes[0]! : "all";
    if (slots.activityTypes.length > 1) return { kind: "unknown" };
    return { kind: "seo_count", activityType, window };
  }

  const metric = preferMetric(slots.metrics);
  const dimension = preferDimension(slots.dimensions);

  if (slots.hasTop && dimension == null && metric != null) {
    return { kind: "analytics_metric", metric, window };
  }

  if (slots.hasTop || dimension != null) {
    if (metric === "pageViews" && dimension === "page" && !slots.hasTop) {
      return { kind: "analytics_metric", metric, window };
    }
    const topDimension = dimension ?? (slots.hasTop ? "query" : null);
    if (topDimension == null) {
      return { kind: "analytics_overview", window };
    }
    return {
      kind: "analytics_top",
      source: dimensionSource(topDimension, slots.source),
      dimensionType: topDimension,
      window,
    };
  }

  if (metric != null) {
    return { kind: "analytics_metric", metric, window };
  }

  return { kind: "analytics_overview", window };
}
