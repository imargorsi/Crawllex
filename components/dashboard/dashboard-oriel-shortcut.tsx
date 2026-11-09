"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { useAssistantThreadsQuery } from "@/features/assistant/assistant.api";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { buildAssistantSuggestions, filterAssistantSuggestions } from "@/lib/frontend/assistant/suggestions";
import { OrielMark } from "@/components/oriel/oriel-mark";
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

function formatChatTime(iso: string): string {
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
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
      className={cn(glassPanelSurfaceClass, "relative flex w-full min-w-0 flex-col gap-5 overflow-hidden rounded-2xl p-5 sm:p-6", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -end-24 size-64 rounded-full blur-3xl"
        style={{ background: "var(--glow-brand)", opacity: 0.45 }}
      />

      <header className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <OrielMark size="md" />
          <div className={cn(typeStackMdClass, "min-w-0")}>
            <Heading id="dashboard-oriel-title" SmallTitle className="leading-tight">
              {greeting}
            </Heading>
            <Paragraph moreSmaller className="leading-snug text-text-secondary">
              {tOriel("subtitle")}
            </Paragraph>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openOriel()}
          className="type-caption shrink-0 rounded-full px-3.5 py-1.5 font-semibold text-white transition-transform hover:-translate-y-px"
          style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 20px -10px var(--glow-brand)" }}
        >
          {tOriel("openButton")}
        </button>
      </header>

      <form
        onSubmit={onSubmit}
        className="relative flex items-center gap-2 rounded-2xl border border-text-primary/15 bg-text-primary/[0.03] p-1.5 ps-4 transition-shadow focus-within:border-brand/60 focus-within:shadow-[0_0_24px_-8px_var(--glow-brand)]"
      >
        <Icons.sparkles className="size-4 shrink-0 text-brand" aria-hidden />
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={tOriel("placeholder")}
          aria-label={tOriel("placeholder")}
          maxLength={500}
          className="type-body text-text-primary placeholder:text-text-placeholder h-10 min-w-0 flex-1 bg-transparent outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label={tOriel("send")}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Icons.arrowRight className="size-4 rtl:rotate-180" aria-hidden />
        </button>
      </form>

      {suggestions.length > 0 ? (
        <ul className="relative flex flex-wrap gap-2" aria-label={t("suggestionsLabel")}>
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openOriel({ query: item.query })}
                className="type-caption inline-flex items-center gap-1.5 rounded-full border border-text-primary/12 bg-text-primary/[0.03] px-3 py-1.5 text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary"
              >
                <Icons.sparkles className="size-3 text-brand" aria-hidden />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative flex flex-col gap-2.5">
        <p className="type-caption font-semibold tracking-wide text-text-muted uppercase">{tOriel("recentChats")}</p>
        {threadsQuery.isLoading ? null : recentChats.length === 0 ? (
          <p className="type-caption text-text-muted">{tOriel("noConversations")}</p>
        ) : (
          <ul className="flex flex-col gap-2" aria-label={tOriel("recentChats")}>
            {recentChats.map((chat) => (
              <li key={chat.threadId}>
                <button
                  type="button"
                  onClick={() => openOriel({ threadId: chat.threadId })}
                  className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-text-primary/10 bg-text-primary/[0.02] px-3.5 py-2.5 text-start transition-all hover:border-brand/40 hover:bg-text-primary/[0.05]"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/12 text-brand">
                    <Icons.message className="size-3.5" aria-hidden />
                  </span>
                  <span className="type-body min-w-0 flex-1 truncate text-text-primary">{chat.title}</span>
                  <span className="type-caption shrink-0 text-text-muted">{formatChatTime(chat.updatedAt)}</span>
                  <Icons.arrowRight className="size-3.5 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
