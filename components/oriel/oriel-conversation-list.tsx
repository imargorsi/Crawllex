"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";
import type { TAssistantThreadSummary } from "@/types/assistant.types";

type TOrielConversationListProps = {
  threads: TAssistantThreadSummary[];
  activeThreadId: string | null;
  isLoading: boolean;
  labels: {
    empty: string;
    today: string;
    earlier: string;
    deleteLabel: (title: string) => string;
    messageCount: (count: number) => string;
  };
  disabled: boolean;
  onSelect: (threadId: string) => void;
  onDelete: (threadId: string) => void;
};

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const sameDay = startOfDay(date) === startOfDay(new Date());
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Conversations grouped as Today and Earlier. Each row opens the chat; the bin deletes that chat. */
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
    return <p className="type-caption px-3 py-6 text-center text-text-muted">{labels.empty}</p>;
  }

  const today = startOfDay(new Date());
  const todayItems = threads.filter((thread) => startOfDay(new Date(thread.updatedAt)) === today);
  const earlierItems = threads.filter((thread) => startOfDay(new Date(thread.updatedAt)) !== today);

  const renderGroup = (title: string, items: TAssistantThreadSummary[]) =>
    items.length === 0 ? null : (
      <section className="flex flex-col gap-1">
        <h3 className="type-caption px-3 pt-2 pb-1 font-semibold tracking-wide text-text-muted">{title}</h3>
        <ul className="flex flex-col gap-0.5">
          {items.map((thread) => {
            const active = thread.threadId === activeThreadId;
            return (
              <li
                key={thread.threadId}
                className={cn(
                  "group relative flex items-stretch rounded-xl transition-colors",
                  active ? "bg-text-primary/[0.07]" : "hover:bg-text-primary/[0.04]",
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-y-2 start-0 w-0.5 rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => onSelect(thread.threadId)}
                  disabled={disabled}
                  aria-current={active ? "true" : undefined}
                  className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2.5 text-start disabled:opacity-50"
                >
                  <span className={cn("type-body truncate", active ? "text-text-primary font-medium" : "text-text-secondary")}>
                    {thread.title}
                  </span>
                  <span className="type-caption text-text-muted">
                    {formatTime(thread.updatedAt)} · {labels.messageCount(thread.messageCount)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(thread.threadId)}
                  disabled={disabled}
                  aria-label={labels.deleteLabel(thread.title)}
                  className="text-text-muted hover:text-destructive my-2 mr-1 flex size-8 shrink-0 items-center justify-center self-center rounded-lg opacity-100 transition-all disabled:opacity-40 xl:opacity-0 xl:group-hover:opacity-100 xl:focus-visible:opacity-100"
                >
                  <Icons.delete className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <div className="themed-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      {renderGroup(labels.today, todayItems)}
      {renderGroup(labels.earlier, earlierItems)}
    </div>
  );
}
