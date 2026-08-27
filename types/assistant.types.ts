import type { TAnalyticsDimensionType, TAnalyticsSource } from "@/lib/integrations/constants";
import type { TDateRangePresetId } from "@/lib/frontend/seo-activities/date-range.utils";
import type { TSeoActivityType } from "@/types/seo-activity.types";

export type TAssistantIntent =
  | "leads_count"
  | "analytics_overview"
  | "analytics_metric"
  | "analytics_top"
  | "seo_count"
  | "unknown";

export type TAssistantAnalyticsMetric =
  | "clicks"
  | "impressions"
  | "ctr"
  | "position"
  | "sessions"
  | "totalUsers"
  | "newUsers"
  | "organicSessions"
  | "pageViews"
  | "engagementRate"
  | "avgSessionDuration";

export type TAssistantNamedWindow = "today" | "yesterday" | "this_week" | "last_week";

export type TAssistantWindowSpec = {
  preset: TDateRangePresetId | null;
  lastNDays: number | null;
  lastNWeeks: number | null;
  lastNMonths: number | null;
  named: TAssistantNamedWindow | null;
  onDate: string | null;
};

export type TAssistantParse =
  | { kind: "unknown" }
  | { kind: "leads_count"; window: TAssistantWindowSpec }
  | { kind: "analytics_overview"; window: TAssistantWindowSpec }
  | {
      kind: "analytics_metric";
      metric: TAssistantAnalyticsMetric;
      window: TAssistantWindowSpec;
    }
  | {
      kind: "analytics_top";
      source: TAnalyticsSource;
      dimensionType: TAnalyticsDimensionType;
      window: TAssistantWindowSpec;
    }
  | {
      kind: "seo_count";
      activityType: TSeoActivityType | "all";
      window: TAssistantWindowSpec;
    };

export type TAssistantAction = {
  label: string;
  route: string;
};

export type TAssistantListItem = {
  label: string;
  detail: string;
};

export type TAssistantHistoryItem = {
  id: string;
  query: string;
  intent: string;
  createdAt: string;
};

export type TAssistantQueryResult = {
  message: string;
  intent: TAssistantIntent;
  action?: TAssistantAction;
  items?: TAssistantListItem[];
  history: TAssistantHistoryItem[];
};

export type TAssistantHistoryDto = {
  items: TAssistantHistoryItem[];
};
