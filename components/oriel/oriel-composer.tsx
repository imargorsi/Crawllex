"use client";

import { type FormEvent, useState } from "react";

import { Icons } from "@/lib/frontend/icons/app-icons";
import { glassPanelSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

type TOrielComposerProps = {
  isBusy: boolean;
  placeholder: string;
  sendLabel: string;
  sendingLabel: string;
  onSend: (query: string) => void;
};

/** Question box. Glass pill, brand send button. Enter sends, Shift+Enter adds a line. */
export function OrielComposer({ isBusy, placeholder, sendLabel, sendingLabel, onSend }: TOrielComposerProps) {
  const [draft, setDraft] = useState("");
  const ready = Boolean(draft.trim()) && !isBusy;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const query = draft.trim();
    if (!query || isBusy) return;
    setDraft("");
    onSend(query);
  }

  return (
    <form
      onSubmit={submit}
      className={cn(glassPanelSurfaceClass, "flex items-end gap-2 rounded-2xl p-2 ps-5 transition-shadow focus-within:shadow-[0_0_0_1px_var(--brand),0_0_24px_-8px_var(--glow-brand)]")}
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
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={isBusy}
        className="type-body text-text-primary placeholder:text-text-placeholder max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2.5 outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!ready}
        aria-label={isBusy ? sendingLabel : sendLabel}
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40"
        style={{ background: "var(--gradient-primary)", boxShadow: ready ? "0 8px 20px -8px var(--glow-brand)" : "none" }}
      >
        {isBusy ? (
          <Icons.loading className="size-4 animate-spin" aria-hidden />
        ) : (
          <Icons.arrowRight className="size-4 rtl:rotate-180" aria-hidden />
        )}
      </button>
    </form>
  );
}
