import { Icons } from "@/lib/frontend/icons/app-icons";
import type { TAppIconComponent } from "@/components/ui/app-icon";
import type { TAssistantIntent } from "@/types/assistant.types";

export const ASSISTANT_TYPING_PHRASES = {
  leadsThisMonth: "How many leads this month?",
  leadsLastMonth: "How many leads last month?",
  clicksOverview: "Show analytics overview",
  topQueries: "What are the top queries?",
  topPages: "What are the top pages?",
  blogs: "How many blogs?",
  backlinks: "How many backlinks?",
  technicalWork: "How much technical work?",
} as const;

export type TAssistantSuggestion = {
  id: string;
  intent: Exclude<TAssistantIntent, "unknown">;
  label: string;
  query: string;
  icon: TAppIconComponent;
  permission: "leads.view" | "analytics.view" | "seo_activities.view";
};

type TSuggestionCopy = {
  leadsThisMonth: string;
  leadsLastMonth: string;
  analyticsOverview: string;
  topPages: string;
  topQueries: string;
  blogs: string;
  backlinks: string;
  technicalWork: string;
};

export function buildAssistantSuggestions(copy: TSuggestionCopy): TAssistantSuggestion[] {
  return [
    {
      id: "leadsThisMonth",
      intent: "leads_count",
      label: copy.leadsThisMonth,
      query: ASSISTANT_TYPING_PHRASES.leadsThisMonth,
      icon: Icons.user,
      permission: "leads.view",
    },
    {
      id: "analyticsOverview",
      intent: "analytics_overview",
      label: copy.analyticsOverview,
      query: ASSISTANT_TYPING_PHRASES.clicksOverview,
      icon: Icons.analytics,
      permission: "analytics.view",
    },
    {
      id: "topPages",
      intent: "analytics_top",
      label: copy.topPages,
      query: ASSISTANT_TYPING_PHRASES.topPages,
      icon: Icons.globe,
      permission: "analytics.view",
    },
    {
      id: "blogs",
      intent: "seo_count",
      label: copy.blogs,
      query: ASSISTANT_TYPING_PHRASES.blogs,
      icon: Icons.file,
      permission: "seo_activities.view",
    },
    {
      id: "topQueries",
      intent: "analytics_top",
      label: copy.topQueries,
      query: ASSISTANT_TYPING_PHRASES.topQueries,
      icon: Icons.search,
      permission: "analytics.view",
    },
    {
      id: "backlinks",
      intent: "seo_count",
      label: copy.backlinks,
      query: ASSISTANT_TYPING_PHRASES.backlinks,
      icon: Icons.link,
      permission: "seo_activities.view",
    },
    {
      id: "technicalWork",
      intent: "seo_count",
      label: copy.technicalWork,
      query: ASSISTANT_TYPING_PHRASES.technicalWork,
      icon: Icons.wrench,
      permission: "seo_activities.view",
    },
    {
      id: "leadsLastMonth",
      intent: "leads_count",
      label: copy.leadsLastMonth,
      query: ASSISTANT_TYPING_PHRASES.leadsLastMonth,
      icon: Icons.calendar,
      permission: "leads.view",
    },
  ];
}

export function filterAssistantSuggestions(
  items: TAssistantSuggestion[],
  canViewLeads: boolean,
  canViewAnalytics: boolean,
  canViewSeo: boolean,
): TAssistantSuggestion[] {
  return items.filter((item) => {
    if (item.permission === "leads.view") return canViewLeads;
    if (item.permission === "analytics.view") return canViewAnalytics;
    return canViewSeo;
  });
}
