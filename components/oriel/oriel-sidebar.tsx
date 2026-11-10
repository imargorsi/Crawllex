"use client";

import { OrielConversationList } from "@/components/oriel/oriel-conversation-list";
import { OrielMark } from "@/components/oriel/oriel-mark";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { glassPanelSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";
import type { TAssistantThreadSummary } from "@/types/assistant.types";

type TOrielSidebarProps = {
  threads: TAssistantThreadSummary[];
  activeThreadId: string | null;
  isLoading: boolean;
  disabled: boolean;
  labels: {
    title: string;
    newChat: string;
    deleteAll: string;
    empty: string;
    today: string;
    earlier: string;
    deleteLabel: (title: string) => string;
    messageCount: (count: number) => string;
  };
  onNewChat: () => void;
  onSelect: (threadId: string) => void;
  onDelete: (threadId: string) => void;
  onDeleteAll: () => void;
};

/**
 * Left column: brand header with a New chat action, the conversation list, and Delete all.
 * Glass surface, no hard dividers between the list and the footer.
 */
export function OrielSidebar({
  threads,
  activeThreadId,
  isLoading,
  disabled,
  labels,
  onNewChat,
  onSelect,
  onDelete,
  onDeleteAll,
}: TOrielSidebarProps) {
  return (
    <aside className={cn(glassPanelSurfaceClass, "flex min-h-0 w-full flex-col overflow-hidden rounded-2xl xl:w-72 xl:shrink-0")}>
      <header className="flex flex-col gap-3 p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <OrielMark size="sm" />
          <h2 className="type-body-strong text-text-primary">{labels.title}</h2>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          disabled={disabled}
          className="group flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-px active:translate-y-0 disabled:opacity-50"
          style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 24px -10px var(--glow-brand)" }}
        >
          <Icons.add className="size-4" aria-hidden />
          {labels.newChat}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-2">
        <OrielConversationList
          threads={threads}
          activeThreadId={activeThreadId}
          isLoading={isLoading}
          labels={{
            empty: labels.empty,
            today: labels.today,
            earlier: labels.earlier,
            deleteLabel: labels.deleteLabel,
            messageCount: labels.messageCount,
          }}
          disabled={disabled}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </div>

      <footer className="p-3 pt-2">
        <button
          type="button"
          onClick={onDeleteAll}
          disabled={disabled || threads.length === 0}
          className="type-caption flex w-full items-center justify-center gap-1.5 rounded-lg py-2 font-medium text-text-muted transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
        >
          <Icons.delete className="size-3.5" aria-hidden />
          {labels.deleteAll}
        </button>
      </footer>
    </aside>
  );
}
