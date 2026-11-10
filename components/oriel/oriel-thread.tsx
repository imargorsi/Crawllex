"use client";

import { useEffect, useRef } from "react";

import { OrielAssistantMessage, OrielUserMessage } from "@/components/oriel/oriel-message";
import { OrielMark } from "@/components/oriel/oriel-mark";
import { OrielSuggestions, type TOrielSuggestion } from "@/components/oriel/oriel-suggestions";
import type { TAssistantThreadMessage } from "@/types/assistant.types";

type TOrielThreadProps = {
  messages: TAssistantThreadMessage[];
  pendingQuery: string | null;
  /** Answer text streamed so far; the thinking label shows until the first token. */
  pendingText?: string | null;
  isLoading: boolean;
  isBusy: boolean;
  suggestions: TOrielSuggestion[];
  labels: { you: string; assistant: string; thinking: string; emptyTitle: string; emptyBody: string; emptyHint: string };
  onPick: (query: string) => void;
};

/** Message column (centered, readable width). Empty state is a hero with the Oriel mark and starter questions. */
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
  }, [messages.length, pendingQuery, pendingText, isBusy]);

  if (isEmpty) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-6 py-10 text-center">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "var(--glow-brand)", opacity: 0.35 }} />
        <div className="relative">
          <OrielMark size="lg" />
        </div>
        <div className="relative flex max-w-md flex-col gap-2">
          <h2 className="type-title text-text-primary">{labels.emptyTitle}</h2>
          <p className="type-body text-text-secondary">{labels.emptyBody}</p>
          <p className="type-caption text-text-muted">{labels.emptyHint}</p>
        </div>
        <div className="relative">
          <OrielSuggestions suggestions={suggestions} disabled={isBusy} onPick={onPick} />
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="themed-scrollbar flex min-h-0 flex-1 overflow-y-auto px-6 py-6" aria-live="polite">
      <div className="flex w-full min-w-0 flex-col gap-7">
        {isLoading && messages.length === 0 ? <p className="type-caption text-text-muted">…</p> : null}

        {messages.map((message) => (
          <div key={message.id} className="flex flex-col gap-5">
            <OrielUserMessage label={labels.you} text={message.query} />
            {message.answer ? <OrielAssistantMessage label={labels.assistant} text={message.answer} /> : null}
          </div>
        ))}

        {pendingQuery ? (
          <div className="flex flex-col gap-5">
            <OrielUserMessage label={labels.you} text={pendingQuery} />
            <OrielAssistantMessage label={labels.assistant} text={pendingText || labels.thinking} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
