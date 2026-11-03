"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { AssistantChatSidebar } from "@/components/assistant-chat/assistant-chat-sidebar";
import { AssistantChatThread } from "@/components/assistant-chat/assistant-chat-thread";
import {
  assistantKeys,
  useAssistantQueryMutation,
  useAssistantThreadQuery,
  useAssistantThreadsQuery,
} from "@/features/assistant/assistant.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { buildAssistantSuggestions, filterAssistantSuggestions } from "@/lib/frontend/assistant/suggestions";
import { notify } from "@/lib/frontend/feedback/notify";
import type { TAssistantThreadDto } from "@/types/assistant.types";

type TAssistantChatProps = {
  projectId: string;
  canViewLeads: boolean;
  canViewAnalytics: boolean;
  canViewSeo: boolean;
  className?: string;
};

export function AssistantChat({
  projectId,
  canViewLeads,
  canViewAnalytics,
  canViewSeo,
  className,
}: TAssistantChatProps) {
  const { t } = useTranslation("translation", { keyPrefix: "home" });
  const queryClient = useQueryClient();

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);

  const threadsQuery = useAssistantThreadsQuery(projectId);
  const threadQuery = useAssistantThreadQuery(projectId, activeThreadId);
  const queryMutation = useAssistantQueryMutation(projectId);

  const suggestions = useMemo(
    () =>
      filterAssistantSuggestions(
        buildAssistantSuggestions({
          leadsThisMonth: t("assistant.suggestions.leadsThisMonth"),
          leadsLastMonth: t("assistant.suggestions.leadsLastMonth"),
          analyticsOverview: t("assistant.suggestions.analyticsOverview"),
          topPages: t("assistant.suggestions.topPages"),
          topQueries: t("assistant.suggestions.topQueries"),
          blogs: t("assistant.suggestions.blogs"),
          backlinks: t("assistant.suggestions.backlinks"),
          technicalWork: t("assistant.suggestions.technicalWork"),
        }),
        canViewLeads,
        canViewAnalytics,
        canViewSeo
      ).slice(0, 4),
    [canViewAnalytics, canViewLeads, canViewSeo, t]
  );

  async function send(query: string) {
    if (queryMutation.isPending) return;
    setPendingQuery(query);
    try {
      const result = await queryMutation.mutateAsync({
        query,
        threadId: activeThreadId ?? undefined,
      });
      // Show the reply at once; the thread query refetches in the background.
      queryClient.setQueryData<TAssistantThreadDto>(assistantKeys.thread(projectId, result.threadId), (previous) => ({
        threadId: result.threadId,
        messages: [
          ...(previous?.messages ?? []),
          {
            id: `local-${Date.now()}`,
            query,
            answer: result.message,
            intent: result.intent,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setActiveThreadId(result.threadId);
    } catch (error) {
      notify.error(ApiError.messageFrom(error, t("chat.sendError")));
    } finally {
      setPendingQuery(null);
    }
  }

  function selectThread(threadId: string) {
    if (queryMutation.isPending) return;
    setActiveThreadId(threadId);
  }

  function newChat() {
    if (queryMutation.isPending) return;
    setActiveThreadId(null);
  }

  const messages = activeThreadId ? (threadQuery.data?.messages ?? []) : [];

  return (
    <div
      className={
        className ??
        "border-border/40 bg-bg-card/25 flex min-h-0 w-full min-w-0 flex-col gap-4 rounded-3xl border p-4 sm:p-5 xl:h-full xl:flex-row xl:gap-4"
      }
    >
      <AssistantChatSidebar
        threads={threadsQuery.data?.items ?? []}
        activeThreadId={activeThreadId}
        isLoading={threadsQuery.isLoading}
        onNewChat={newChat}
        onSelect={selectThread}
      />
      <AssistantChatThread
        messages={messages}
        pendingQuery={pendingQuery}
        isBusy={queryMutation.isPending}
        isLoading={Boolean(activeThreadId) && threadQuery.isLoading}
        suggestions={suggestions.map((item) => ({ id: item.id, label: item.label, query: item.query }))}
        onSend={send}
      />
    </div>
  );
}
