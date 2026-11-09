"use client";

import { glassPanelSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/frontend/icons/app-icons";

type TOrielComposerProps = {
  isBusy: boolean;
  placeholder: string;
  sendLabel: string;
  sendingLabel: string;
  onSend: (query: string) => void;
};

/** Question box at the bottom of the chat panel. Enter sends, Shift+Enter adds a line. */
export function OrielComposer({ isBusy, placeholder, sendLabel, sendingLabel, onSend }: TOrielComposerProps) {
  const [draft, setDraft] = useState("");

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const query = draft.trim();
    if (!query || isBusy) return;
    setDraft("");
    onSend(query);
  }

  return (
    <form onSubmit={submit} className={`${glassPanelSurfaceClass} flex items-end gap-2 rounded-2xl p-2 ps-4`}>
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
        className="type-body text-text-primary placeholder:text-text-placeholder max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 outline-none disabled:opacity-50"
      />
      <Button type="submit" variant="primary" size="icon-sm" disabled={isBusy || !draft.trim()} aria-label={isBusy ? sendingLabel : sendLabel}>
        {isBusy ? <Icons.loading className="size-4 animate-spin" aria-hidden /> : <Icons.arrowRight className="size-4 rtl:rotate-180" aria-hidden />}
      </Button>
    </form>
  );
}
