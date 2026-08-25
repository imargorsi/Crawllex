"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { AssistantNeonOutline } from "@/components/dashboard/assistant-neon-outline";
import { DashboardAssistantAnswer } from "@/components/dashboard/dashboard-assistant-answer";
import { DashboardAssistantGreeting } from "@/components/dashboard/dashboard-assistant-greeting";
import {
  DashboardAssistantQuestionList,
  type TAssistantQuestionRow,
} from "@/components/dashboard/dashboard-assistant-question-list";
import { Button } from "@/components/ui/button";
import {
  useAssistantHistoryQuery,
  useAssistantQueryMutation,
} from "@/features/assistant/assistant.api";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { useTypingPlaceholder } from "@/hooks/use-typing-placeholder.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import {
  assistantTypingPhrases,
  buildAssistantSuggestions,
  filterAssistantSuggestions,
} from "@/lib/frontend/assistant/suggestions";
import { notify } from "@/lib/frontend/feedback/notify";
import {
  formFieldControlClass,
  glassPanelSurfaceClass,
  toolbarFilterChipClass,
  typeStackMdClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";
import type { TAssistantQueryResult } from "@/types/assistant.types";

type TDashboardAssistantPanelProps = {
  projectId: string;
  canViewLeads: boolean;
  canViewAnalytics: boolean;
  canViewSeo: boolean;
  className?: string;
  compact?: boolean;
};

function firstNameFromDisplayName(name: string | undefined): string {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

export function DashboardAssistantPanel({
  projectId,
  canViewLeads,
  canViewAnalytics,
  canViewSeo,
  className,
  compact = false,
}: TDashboardAssistantPanelProps) {
  const { t } = useTranslation("translation", { keyPrefix: "home.assistant" });
  const { data: authUser } = useAuthUserQuery();
  const [draft, setDraft] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [answer, setAnswer] = useState<TAssistantQueryResult | null>(null);

  const historyQuery = useAssistantHistoryQuery(projectId);
  const queryMutation = useAssistantQueryMutation(projectId);
  const isBusy = queryMutation.isPending;

  const firstName = firstNameFromDisplayName(authUser?.name);
  const greeting = firstName ? t("greeting", { name: firstName }) : t("greetingFallback");

  const suggestions = useMemo(
    () =>
      filterAssistantSuggestions(
        buildAssistantSuggestions({
          leadsThisMonth: t("suggestions.leadsThisMonth"),
          leadsLastMonth: t("suggestions.leadsLastMonth"),
          analyticsOverview: t("suggestions.analyticsOverview"),
          topPages: t("suggestions.topPages"),
          topQueries: t("suggestions.topQueries"),
          blogs: t("suggestions.blogs"),
          backlinks: t("suggestions.backlinks"),
          technicalWork: t("suggestions.technicalWork"),
        }),
        canViewLeads,
        canViewAnalytics,
        canViewSeo,
      ),
    [canViewAnalytics, canViewLeads, canViewSeo, t],
  );

  const visibleCount = compact ? 4 : 5;
  const chips = suggestions.slice(0, visibleCount);
  const popularRows: TAssistantQuestionRow[] = chips.map((item) => ({
    id: item.id,
    label: item.query,
    query: item.query,
    icon: item.icon,
  }));

  const historyItems = (historyQuery.data?.items ?? answer?.history ?? []).slice(
    0,
    compact ? 3 : 5,
  );
  const recentRows: TAssistantQuestionRow[] = historyItems.map((item) => ({
    id: item.id,
    label: item.query,
    query: item.query,
    icon: Icons.clock,
  }));

  const typingPhrases = useMemo(
    () => assistantTypingPhrases(canViewLeads, canViewAnalytics, canViewSeo, t("placeholder")),
    [canViewAnalytics, canViewLeads, canViewSeo, t],
  );

  const typingEnabled = !draft && !isFocused && !isBusy;
  const typingPlaceholder = useTypingPlaceholder({
    phrases: typingPhrases,
    enabled: typingEnabled,
  });

  async function runQuery(query: string) {
    const trimmed = query.trim();
    if (!trimmed || isBusy) return;

    setDraft(trimmed);
    try {
      const result = await queryMutation.mutateAsync({ query: trimmed });
      setAnswer(result);
    } catch (error) {
      notify.error(ApiError.messageFrom(error, t("queryError")));
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void runQuery(draft);
  }

  return (
    <section
      className={cn(
        glassPanelSurfaceClass,
        "relative flex w-full min-w-0 flex-col overflow-visible border-0 shadow-none",
        "motion-reduce:border motion-reduce:border-border/50 dark:motion-reduce:border-text-primary/30",
        compact ? "rounded-2xl p-4 sm:p-5" : "rounded-3xl p-6 sm:p-7",
        className,
      )}
      aria-labelledby="dashboard-assistant-title"
    >
      <AssistantNeonOutline radius={compact ? 16 : 24} />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-5">
        <DashboardAssistantGreeting greeting={greeting} compact={compact} />

        {!answer && chips.length > 0 ? (
          <div
            className="flex shrink-0 flex-wrap gap-2"
            role="list"
            aria-label={t("suggestionsLabel")}
          >
            {chips.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  disabled={isBusy}
                  onClick={() => void runQuery(item.query)}
                  className={cn(
                    toolbarFilterChipClass,
                    "border border-border/50 bg-transparent text-text-secondary",
                    "hover:border-border hover:bg-bg-hover/40 hover:text-text-primary",
                    "disabled:opacity-50 dark:border-text-primary/20",
                  )}
                >
                  <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="shrink-0">
          <div
            className={cn(
              formFieldControlClass,
              "flex items-center gap-1.5 rounded-xl bg-transparent p-1.5 ps-3",
              "focus-within:border-border/50 focus-within:ring-0 dark:focus-within:border-text-primary/18",
            )}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                typingEnabled ? typingPlaceholder || t("placeholder") : t("placeholder")
              }
              aria-label={t("inputLabel")}
              disabled={isBusy}
              className={cn(
                "min-w-0 flex-1 bg-transparent type-body text-text-primary outline-none",
                "placeholder:text-text-placeholder disabled:cursor-not-allowed disabled:opacity-50",
                compact ? "h-9" : "h-10",
              )}
            />
            <Button
              type="submit"
              variant="primary"
              size="icon-sm"
              disabled={isBusy || !draft.trim()}
              aria-label={isBusy ? t("asking") : t("submit")}
              className="rounded-lg"
            >
              {isBusy ? (
                <Icons.loading className="size-4 animate-spin" aria-hidden />
              ) : (
                <Icons.arrowRight className="size-4 rtl:rotate-180" aria-hidden />
              )}
            </Button>
          </div>
        </form>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto" aria-live="polite">
          {answer ? (
            <DashboardAssistantAnswer answer={answer} />
          ) : historyQuery.isLoading ? (
            <p className="type-caption text-text-muted">{t("historyLoading")}</p>
          ) : (
            <DashboardAssistantQuestionList
              title={recentRows.length > 0 ? t("historyLabel") : t("popularTitle")}
              items={recentRows.length > 0 ? recentRows : popularRows}
              disabled={isBusy}
              onSelect={(query) => void runQuery(query)}
            />
          )}
        </div>

        {!answer ? (
          <div
            className={cn(
              "relative mt-auto flex shrink-0 items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3.5",
              "bg-status-pending/10 dark:bg-status-pending/15",
            )}
          >
            <span
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full"
              style={{
                color: "var(--status-pending)",
                background: "color-mix(in srgb, var(--status-pending) 22%, transparent)",
                boxShadow:
                  "0 0 18px color-mix(in srgb, var(--status-pending) 42%, transparent)",
              }}
              aria-hidden
            >
              <Icons.bulb className="size-5" />
            </span>
            <div className={cn(typeStackMdClass, "min-w-0")}>
              <p className="type-body-strong text-text-primary">{t("tipTitle")}</p>
              <p className="type-body leading-snug text-text-secondary">{t("tipBody")}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
