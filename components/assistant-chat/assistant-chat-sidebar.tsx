"use client";

import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { TAssistantThreadSummary } from "@/types/assistant.types";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

type TAssistantChatSidebarProps = {
  threads: TAssistantThreadSummary[];
  activeThreadId: string | null;
  isLoading: boolean;
  onNewChat: () => void;
  onSelect: (threadId: string) => void;
};

function formatThreadDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AssistantChatSidebar({
  threads,
  activeThreadId,
  isLoading,
  onNewChat,
  onSelect,
}: TAssistantChatSidebarProps) {
  const { t } = useTranslation("translation", { keyPrefix: "home.chat" });

  return (
    <aside
      aria-label={t("conversations")}
      className="border-border/40 flex min-h-0 w-full flex-col gap-3 border-b pb-3 xl:w-64 xl:shrink-0 xl:border-e xl:border-b-0 xl:pe-3 xl:pb-0"
    >
      <Button type="button" variant="outlined" size="md" onClick={onNewChat} className="w-full justify-start">
        <Icons.add className="size-4" aria-hidden />
        {t("newChat")}
      </Button>

      <p className="type-caption text-text-muted font-semibold tracking-wide uppercase">{t("conversations")}</p>

      <ul className="themed-scrollbar flex max-h-56 min-h-0 flex-col gap-1 overflow-y-auto xl:max-h-none xl:flex-1">
        {threads.length === 0 && !isLoading ? (
          <li className="type-caption text-text-muted">{t("noConversations")}</li>
        ) : null}
        {threads.map((thread) => {
          const active = thread.threadId === activeThreadId;
          return (
            <li key={thread.threadId}>
              <button
                type="button"
                onClick={() => onSelect(thread.threadId)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full min-w-0 flex-col gap-0.5 rounded-lg px-3 py-2 text-start transition-colors",
                  active
                    ? "bg-bg-hover/60 text-text-primary"
                    : "text-text-secondary hover:bg-bg-hover/40 hover:text-text-primary"
                )}
              >
                <span className="type-body truncate">{thread.title}</span>
                <span className="type-caption text-text-muted">
                  {formatThreadDate(thread.updatedAt)} · {t("messageCount", { count: thread.messageCount })}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
