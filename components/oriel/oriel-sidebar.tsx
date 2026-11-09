"use client";

import { Button } from "@/components/ui/button";
import { OrielConversationList } from "@/components/oriel/oriel-conversation-list";
import { Icons } from "@/lib/frontend/icons/app-icons";
import type { TAssistantThreadSummary } from "@/types/assistant.types";
import { glassPanelSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";

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
    deleteLabel: (title: string) => string;
    messageCount: (count: number) => string;
  };
  onNewChat: () => void;
  onSelect: (threadId: string) => void;
  onDelete: (threadId: string) => void;
  onDeleteAll: () => void;
};

/**
 * Left column: new chat, recent conversations, delete all.
 * Three stacked sections with their own borders so each one reads separately.
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
    <aside className={`${glassPanelSurfaceClass} flex min-h-0 w-full flex-col overflow-hidden rounded-2xl xl:w-72 xl:shrink-0`}>
      <header className="border-text-primary/15 flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="type-body-strong text-text-primary">{labels.title}</h2>
        <Button type="button" variant="outlined" size="sm" onClick={onNewChat} disabled={disabled}>
          <Icons.add className="size-4" aria-hidden />
          {labels.newChat}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
        <OrielConversationList
          threads={threads}
          activeThreadId={activeThreadId}
          isLoading={isLoading}
          labels={{ empty: labels.empty, deleteLabel: labels.deleteLabel, messageCount: labels.messageCount }}
          disabled={disabled}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </div>

      <footer className="border-text-primary/15 border-t p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-center text-destructive hover:text-destructive"
          onClick={onDeleteAll}
          disabled={disabled || threads.length === 0}
        >
          <Icons.delete className="size-4" aria-hidden />
          {labels.deleteAll}
        </Button>
      </footer>
    </aside>
  );
}
