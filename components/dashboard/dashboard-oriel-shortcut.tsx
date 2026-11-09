"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { Button } from "@/components/ui/button";
import { useAssistantThreadsQuery } from "@/features/assistant/assistant.api";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { buildAssistantSuggestions, filterAssistantSuggestions } from "@/lib/frontend/assistant/suggestions";
import { setOrielHandoff } from "@/lib/frontend/oriel/handoff";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { glassPanelSurfaceClass, typeStackMdClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

type TDashboardOrielShortcutProps = {
  projectId: string;
  canViewLeads: boolean;
  canViewAnalytics: boolean;
  canViewSeo: boolean;
  className?: string;
};

const RECENT_CHAT_LIMIT = 5;
const SUGGESTION_LIMIT = 4;

function firstNameOf(name: string | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? "";
}

/**
 * Dashboard entry point to Oriel. It does not answer here: every question, recent chat and
 * suggestion opens the Oriel page, which runs the conversation.
 */
export function DashboardOrielShortcut({
  projectId,
  canViewLeads,
  canViewAnalytics,
  canViewSeo,
  className,
}: TDashboardOrielShortcutProps) {
  const { t } = useTranslation("translation", { keyPrefix: "home.assistant" });
  const { t: tOriel } = useTranslation("translation", { keyPrefix: "oriel" });
  const router = useRouter();
  const { data: authUser } = useAuthUserQuery();
  const threadsQuery = useAssistantThreadsQuery(projectId);
  const [draft, setDraft] = useState("");

  const firstName = firstNameOf(authUser?.name);
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
      ).slice(0, SUGGESTION_LIMIT),
    [canViewAnalytics, canViewLeads, canViewSeo, t],
  );

  const recentChats = (threadsQuery.data?.items ?? []).slice(0, RECENT_CHAT_LIMIT);

  function openOriel(handoff: { threadId?: string; query?: string } = {}) {
    setOrielHandoff(handoff);
    router.push("/oriel");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const query = draft.trim();
    if (!query) return;
    openOriel({ query });
  }

  return (
    <section
      aria-labelledby="dashboard-oriel-title"
      className={cn(glassPanelSurfaceClass, "flex w-full min-w-0 flex-col gap-5 rounded-2xl p-5 sm:p-6", className)}
    >
      <header className="flex items-start justify-between gap-3">
        <div className={cn(typeStackMdClass, "min-w-0")}>
          <Heading id="dashboard-oriel-title" SmallTitle className="leading-tight">
            {greeting}
          </Heading>
          <Paragraph moreSmaller className="leading-snug text-text-secondary">
            {tOriel("subtitle")}
          </Paragraph>
        </div>
        <Button type="button" variant="outlined" size="sm" onClick={() => openOriel()} className="shrink-0">
          {tOriel("openButton")}
          <Icons.arrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
        </Button>
      </header>

      <form onSubmit={onSubmit} className="border-text-primary/15 flex items-center gap-2 rounded-xl border p-1.5 ps-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={tOriel("placeholder")}
          aria-label={tOriel("placeholder")}
          maxLength={500}
          className="type-body text-text-primary placeholder:text-text-placeholder h-9 min-w-0 flex-1 bg-transparent outline-none"
        />
        <Button type="submit" variant="primary" size="icon-sm" disabled={!draft.trim()} aria-label={tOriel("send")}>
          <Icons.arrowRight className="size-4 rtl:rotate-180" aria-hidden />
        </Button>
      </form>

      {suggestions.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={t("suggestionsLabel")}>
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openOriel({ query: item.query })}
                className="border-text-primary/15 type-caption text-text-secondary hover:border-text-primary/35 hover:text-text-primary rounded-full border px-3 py-1.5 transition-colors"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <p className="type-caption text-text-muted font-semibold tracking-wide uppercase">{tOriel("recentChats")}</p>
        {threadsQuery.isLoading ? null : recentChats.length === 0 ? (
          <p className="type-caption text-text-muted">{tOriel("noConversations")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5" aria-label={tOriel("recentChats")}>
            {recentChats.map((chat) => (
              <li key={chat.threadId}>
                <button
                  type="button"
                  onClick={() => openOriel({ threadId: chat.threadId })}
                  className="border-text-primary/10 hover:border-text-primary/30 hover:bg-text-primary/[0.04] flex w-full min-w-0 items-center gap-3 rounded-lg border px-3 py-2 text-start transition-colors"
                >
                  <Icons.message className="text-text-muted size-4 shrink-0" aria-hidden />
                  <span className="type-caption text-text-primary min-w-0 flex-1 truncate">{chat.title}</span>
                  <Icons.arrowRight className="text-text-muted size-3.5 shrink-0 rtl:rotate-180" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
