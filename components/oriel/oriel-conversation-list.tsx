"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";
import type { TAssistantThreadSummary } from "@/types/assistant.types";

type TOrielConversationListProps = {
  threads: TAssistantThreadSummary[];
  activeThreadId: string | null;
  isLoading: boolean;
  labels: { empty: string; deleteLabel: (title: string) => string; messageCount: (count: number) => string };
  disabled: boolean;
  onSelect: (threadId: string) => void;
  onDelete: (threadId: string) => void;
};

function formatThreadDate(iso: string): string {
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Recent conversations. Each row selects the chat; the bin button deletes that one chat. */
export function OrielConversationList({
  threads,
  activeThreadId,
  isLoading,
  labels,
  disabled,
  onSelect,
  onDelete,
}: TOrielConversationListProps) {
  if (threads.length === 0 && !isLoading) {
    return <p className="type-caption text-text-muted px-3 py-2">{labels.empty}</p>;
  }

  return (
    <ul className="themed-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
      {threads.map((thread) => {
        const active = thread.threadId === activeThreadId;
        return (
          <li
            key={thread.threadId}
            className={cn(
              "group flex items-stretch gap-1 rounded-lg border transition-colors",
              active ? "border-brand/50 bg-brand/10" : "border-transparent hover:border-text-primary/15 hover:bg-text-primary/[0.04]",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(thread.threadId)}
              disabled={disabled}
              aria-current={active ? "true" : undefined}
              className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2 text-start disabled:opacity-50"
            >
              <span className="type-body text-text-primary truncate">{thread.title}</span>
              <span className="type-caption text-text-muted">
                {formatThreadDate(thread.updatedAt)} · {labels.messageCount(thread.messageCount)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(thread.threadId)}
              disabled={disabled}
              aria-label={labels.deleteLabel(thread.title)}
              className="text-text-muted hover:text-destructive flex w-9 shrink-0 items-center justify-center rounded-lg opacity-100 transition-colors disabled:opacity-40 xl:opacity-0 xl:group-hover:opacity-100 xl:focus-visible:opacity-100"
            >
              <Icons.delete className="size-4" aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
