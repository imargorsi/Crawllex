"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { AssistantMessage } from "@/components/dashboard/dashboard-assistant-answer";
import { Button } from "@/components/ui/button";
import type { TAssistantThreadMessage } from "@/types/assistant.types";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

type TSuggestion = { id: string; label: string; query: string };

type TAssistantChatThreadProps = {
  messages: TAssistantThreadMessage[];
  pendingQuery: string | null;
  isBusy: boolean;
  isLoading: boolean;
  suggestions: TSuggestion[];
  onSend: (query: string) => void;
};

export function AssistantChatThread({
  messages,
  pendingQuery,
  isBusy,
  isLoading,
  suggestions,
  onSend,
}: TAssistantChatThreadProps) {
  const { t } = useTranslation("translation", { keyPrefix: "home.chat" });
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0 && !pendingQuery;

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, pendingQuery, isBusy]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const query = draft.trim();
    if (!query || isBusy) return;
    setDraft("");
    onSend(query);
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3" aria-labelledby="assistant-chat-title">
      <div
        ref={scrollRef}
        className="themed-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pe-1"
        aria-live="polite"
      >
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
            <Icons.sparkles className="text-brand size-8" aria-hidden />
            <div className="flex flex-col gap-1">
              <h2 id="assistant-chat-title" className="type-title text-text-primary">
                {t("emptyTitle")}
              </h2>
              <p className="type-body text-text-secondary">{t("emptyBody")}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2" role="list">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  disabled={isBusy}
                  onClick={() => onSend(item.query)}
                  className="border-border/50 type-caption text-text-secondary hover:border-border hover:text-text-primary rounded-full border px-3 py-1.5 disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {isLoading && messages.length === 0 ? <p className="type-caption text-text-muted">…</p> : null}

        {messages.map((message) => (
          <div key={message.id} className="flex flex-col gap-3">
            <UserBubble text={message.query} label={t("you")} />
            {message.answer ? (
              <AssistantBubble label={t("assistant")}>
                <AssistantMessage message={message.answer} />
              </AssistantBubble>
            ) : null}
          </div>
        ))}

        {pendingQuery ? (
          <div className="flex flex-col gap-3">
            <UserBubble text={pendingQuery} label={t("you")} />
            <AssistantBubble label={t("assistant")}>
              <p className="type-body text-text-muted">{t("thinking")}</p>
            </AssistantBubble>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={submit}
        className="border-border/50 bg-bg-card/30 flex shrink-0 items-end gap-2 rounded-2xl border p-2 ps-4"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          maxLength={500}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          disabled={isBusy}
          className="type-body text-text-primary placeholder:text-text-placeholder max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 outline-none disabled:opacity-50"
        />
        <Button
          type="submit"
          variant="primary"
          size="icon-sm"
          disabled={isBusy || !draft.trim()}
          aria-label={isBusy ? t("sending") : t("send")}
          className="rounded-lg"
        >
          {isBusy ? (
            <Icons.loading className="size-4 animate-spin" aria-hidden />
          ) : (
            <Icons.arrowRight className="size-4 rtl:rotate-180" aria-hidden />
          )}
        </Button>
      </form>
    </section>
  );
}

function UserBubble({ text, label }: { text: string; label: string }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="type-caption text-text-muted">{label}</span>
      <p className="rounded-te-sm bg-brand/10 type-body text-text-primary max-w-[85%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}

function AssistantBubble({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex max-w-[92%] flex-col gap-1")}>
      <span className="type-caption text-text-muted">{label}</span>
      <div className="rounded-ts-sm border-border/40 bg-bg-card/30 rounded-2xl border px-4 py-3">{children}</div>
    </div>
  );
}
