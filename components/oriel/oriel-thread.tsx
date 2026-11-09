"use client";

import { useEffect, useRef } from "react";

import { OrielAssistantMessage, OrielUserMessage } from "@/components/oriel/oriel-message";
import { OrielSuggestions, type TOrielSuggestion } from "@/components/oriel/oriel-suggestions";
import type { TAssistantThreadMessage } from "@/types/assistant.types";
import { Icons } from "@/lib/frontend/icons/app-icons";

type TOrielThreadProps = {
  messages: TAssistantThreadMessage[];
  pendingQuery: string | null;
  /** Answer text streamed so far; the thinking label shows until the first token. */
  pendingText?: string | null;
  isLoading: boolean;
  isBusy: boolean;
  suggestions: TOrielSuggestion[];
  labels: { you: string; assistant: string; thinking: string; emptyTitle: string; emptyBody: string };
  onPick: (query: string) => void;
};

/** Scrollable message area. Shows starter questions while the conversation is empty. */
export function OrielThread({
  messages,
  pendingQuery,
  pendingText,
  isLoading,
  isBusy,
  suggestions,
  labels,
  onPick,
}: TOrielThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0 && !pendingQuery && !isLoading;

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, pendingQuery, isBusy]);

  if (isEmpty) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
        <span className="bg-brand/10 text-brand flex size-12 items-center justify-center rounded-xl">
          <Icons.sparkles className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="type-title text-text-primary">{labels.emptyTitle}</h2>
          <p className="type-body text-text-secondary max-w-md">{labels.emptyBody}</p>
        </div>
        <OrielSuggestions suggestions={suggestions} disabled={isBusy} onPick={onPick} />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="themed-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5" aria-live="polite">
      {isLoading && messages.length === 0 ? <p className="type-caption text-text-muted">…</p> : null}

      {messages.map((message) => (
        <div key={message.id} className="flex flex-col gap-4">
          <OrielUserMessage label={labels.you} text={message.query} />
          {message.answer ? <OrielAssistantMessage label={labels.assistant} text={message.answer} /> : null}
        </div>
      ))}

      {pendingQuery ? (
        <div className="flex flex-col gap-4">
          <OrielUserMessage label={labels.you} text={pendingQuery} />
          <OrielAssistantMessage label={labels.assistant} text={pendingText || labels.thinking} />
        </div>
      ) : null}
    </div>
  );
}
