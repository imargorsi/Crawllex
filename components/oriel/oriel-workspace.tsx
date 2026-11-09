"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

import { OrielComposer } from "@/components/oriel/oriel-composer";
import { OrielSidebar } from "@/components/oriel/oriel-sidebar";
import { OrielThread } from "@/components/oriel/oriel-thread";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import {
  assistantKeys,
  useAssistantQueryMutation,
  useAssistantThreadQuery,
  useAssistantThreadsQuery,
  useDeleteAllAssistantThreadsMutation,
  useDeleteAssistantThreadMutation,
} from "@/features/assistant/assistant.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { buildAssistantSuggestions, filterAssistantSuggestions } from "@/lib/frontend/assistant/suggestions";
import { notify } from "@/lib/frontend/feedback/notify";
import { clearOrielHandoff, peekOrielHandoff } from "@/lib/frontend/oriel/handoff";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { buttonVariants } from "@/components/ui/button";
import { glassPanelSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";
import type { TAssistantThreadDto } from "@/types/assistant.types";

type TOrielWorkspaceProps = {
  projectId: string;
  canViewLeads: boolean;
  canViewAnalytics: boolean;
  canViewSeo: boolean;
};

/** Pending delete request. Null when no confirm dialog is open. */
type TDeleteRequest = { kind: "one"; threadId: string; title: string } | { kind: "all" } | null;

/**
 * Oriel workspace: conversation sidebar on the left, the active chat on the right.
 * Owns the data flow only. Presentation lives in the child components.
 */
export function OrielWorkspace({
  projectId,
  canViewLeads,
  canViewAnalytics,
  canViewSeo,
}: TOrielWorkspaceProps) {
  const { t } = useTranslation("translation", { keyPrefix: "oriel" });
  const { t: tHome } = useTranslation("translation", { keyPrefix: "home" });
  const queryClient = useQueryClient();
  const arrivalHandled = useRef(false);

  // Arrival from the dashboard shortcut: a conversation to open, or a question to ask (see handoff.ts).
  // The workspace only renders on the client, so reading sessionStorage here is safe.
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => peekOrielHandoff().threadId ?? null);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<TDeleteRequest>(null);

  const threadsQuery = useAssistantThreadsQuery(projectId);
  const threadQuery = useAssistantThreadQuery(projectId, activeThreadId);
  const queryMutation = useAssistantQueryMutation(projectId);
  const deleteOneMutation = useDeleteAssistantThreadMutation(projectId);
  const deleteAllMutation = useDeleteAllAssistantThreadsMutation(projectId);

  const isBusy = queryMutation.isPending || deleteOneMutation.isPending || deleteAllMutation.isPending;
  const threads = threadsQuery.data?.items ?? [];
  const activeThread = threads.find((thread) => thread.threadId === activeThreadId) ?? null;
  const messages = activeThreadId ? (threadQuery.data?.messages ?? []) : [];

  const suggestions = useMemo(
    () =>
      filterAssistantSuggestions(
        buildAssistantSuggestions({
          leadsThisMonth: tHome("assistant.suggestions.leadsThisMonth"),
          leadsLastMonth: tHome("assistant.suggestions.leadsLastMonth"),
          analyticsOverview: tHome("assistant.suggestions.analyticsOverview"),
          topPages: tHome("assistant.suggestions.topPages"),
          topQueries: tHome("assistant.suggestions.topQueries"),
          blogs: tHome("assistant.suggestions.blogs"),
          backlinks: tHome("assistant.suggestions.backlinks"),
          technicalWork: tHome("assistant.suggestions.technicalWork"),
        }),
        canViewLeads,
        canViewAnalytics,
        canViewSeo,
      )
        .slice(0, 4)
        .map((item) => ({ id: item.id, label: item.label, query: item.query })),
    [canViewAnalytics, canViewLeads, canViewSeo, tHome],
  );

  // Arrival from the dashboard. Params are read on every change, not only at mount, because the
  // first render can happen before the URL is available. Each value is handled once.
  // Runs once on arrival: clears the hand-off and asks the pending question, if any.
  useEffect(() => {
    if (arrivalHandled.current) return;
    arrivalHandled.current = true;
    const pending = peekOrielHandoff();
    clearOrielHandoff();
    if (pending.query) void send(pending.query);
    // Mount-only by design; send() is stable for this single call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(query: string) {
    if (isBusy) return;
    setPendingQuery(query);
    try {
      const result = await queryMutation.mutateAsync({ query, threadId: activeThreadId ?? undefined });
      // Show the reply at once; the thread query refetches in the background.
      queryClient.setQueryData<TAssistantThreadDto>(assistantKeys.thread(projectId, result.threadId), (previous) => ({
        threadId: result.threadId,
        messages: [
          ...(previous?.messages ?? []),
          { id: `local-${Date.now()}`, query, answer: result.message, intent: result.intent, createdAt: new Date().toISOString() },
        ],
      }));
      setActiveThreadId(result.threadId);
    } catch (error) {
      notify.error(ApiError.messageFrom(error, t("sendError")));
    } finally {
      setPendingQuery(null);
    }
  }

  async function confirmDelete() {
    if (!deleteRequest) return;
    try {
      if (deleteRequest.kind === "one") {
        await deleteOneMutation.mutateAsync(deleteRequest.threadId);
        if (deleteRequest.threadId === activeThreadId) setActiveThreadId(null);
      } else {
        await deleteAllMutation.mutateAsync();
        setActiveThreadId(null);
      }
      setDeleteRequest(null);
    } catch (error) {
      notify.error(ApiError.messageFrom(error, deleteRequest.kind === "one" ? t("deleteError") : t("deleteAllError")));
    }
  }

  const deletePending = deleteOneMutation.isPending || deleteAllMutation.isPending;

  return (
    <>
      <div className="grid min-h-0 w-full min-w-0 flex-1 gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <OrielSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          isLoading={threadsQuery.isLoading}
          disabled={isBusy}
          labels={{
            title: t("conversations"),
            newChat: t("newChat"),
            deleteAll: t("deleteAll"),
            empty: t("noConversations"),
            deleteLabel: (title) => `${t("deleteChat")}: ${title}`,
            messageCount: (count) => t("messageCount", { count }),
          }}
          onNewChat={() => setActiveThreadId(null)}
          onSelect={setActiveThreadId}
          onDelete={(threadId) => {
            const thread = threads.find((item) => item.threadId === threadId);
            setDeleteRequest({ kind: "one", threadId, title: thread?.title ?? "" });
          }}
          onDeleteAll={() => setDeleteRequest({ kind: "all" })}
        />

        <section className={`${glassPanelSurfaceClass} flex min-h-[60vh] min-w-0 flex-col overflow-hidden rounded-2xl xl:min-h-0`}>
          <header className="border-text-primary/15 flex items-center justify-between gap-3 border-b px-5 py-3">
            <h3 className="type-body-strong text-text-primary truncate">{activeThread?.title ?? t("newChatTitle")}</h3>
            {pendingQuery ? <Icons.loading className="text-text-muted size-4 shrink-0 animate-spin" aria-hidden /> : null}
          </header>

          <OrielThread
            messages={messages}
            pendingQuery={pendingQuery}
            isLoading={Boolean(activeThreadId) && threadQuery.isLoading}
            isBusy={isBusy}
            suggestions={suggestions}
            labels={{
              you: t("you"),
              assistant: t("assistant"),
              thinking: t("thinking"),
              emptyTitle: t("emptyTitle"),
              emptyBody: t("emptyBody"),
            }}
            onPick={send}
          />

          <footer className="border-text-primary/15 border-t p-3">
            <OrielComposer
              isBusy={isBusy}
              placeholder={t("placeholder")}
              sendLabel={t("send")}
              sendingLabel={t("sending")}
              onSend={send}
            />
          </footer>
        </section>
      </div>

      <ConfirmDialog
        open={deleteRequest !== null}
        onOpenChange={(open) => {
          if (!open && !deletePending) setDeleteRequest(null);
        }}
        icon={Icons.delete}
        tone="destructive"
        title={deleteRequest?.kind === "all" ? t("deleteAllTitle") : t("deleteChatTitle")}
        description={deleteRequest?.kind === "all" ? t("deleteAllBody") : t("deleteChatBody")}
        action={
          <>
            <AlertDialogCancel disabled={deletePending}>{t("cancel")}</AlertDialogCancel>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "destructive", size: "md" }))}
              onClick={() => void confirmDelete()}
              disabled={deletePending}
            >
              {deletePending ? <Icons.loading className="size-4 animate-spin" aria-hidden /> : null}
              {t("confirmDelete")}
            </button>
          </>
        }
      />
    </>
  );
}
