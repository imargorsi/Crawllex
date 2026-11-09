"use client";

import { AssistantMessage } from "@/components/oriel/oriel-answer";
import { glassPanelSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";

/** Shared frame for one chat message: sender label, then the bubble. */
function MessageFrame({ label, align, children }: { label: string; align: "start" | "end"; children: React.ReactNode }) {
  return (
    <div className={align === "end" ? "flex flex-col items-end gap-1.5" : "flex flex-col items-start gap-1.5"}>
      <span className="type-caption font-semibold tracking-wide text-text-muted uppercase">{label}</span>
      {children}
    </div>
  );
}

export function OrielUserMessage({ label, text }: { label: string; text: string }) {
  return (
    <MessageFrame label={label} align="end">
      <div className="bg-brand/10 border-brand/30 type-body text-text-primary max-w-[85%] rounded-xl border px-4 py-2.5 whitespace-pre-wrap">
        {text}
      </div>
    </MessageFrame>
  );
}

export function OrielAssistantMessage({ label, text }: { label: string; text: string }) {
  return (
    <MessageFrame label={label} align="start">
      <div className={`${glassPanelSurfaceClass} w-full max-w-[92%] rounded-xl px-4 py-3`}>
        <AssistantMessage message={text} />
      </div>
    </MessageFrame>
  );
}
