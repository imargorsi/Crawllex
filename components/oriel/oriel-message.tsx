"use client";

import { AssistantMessage } from "@/components/oriel/oriel-answer";
import { OrielMark } from "@/components/oriel/oriel-mark";
import { glassPanelSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

/** Sender label above a message, aligned to the side of the sender. */
function SenderLabel({ label, align }: { label: string; align: "start" | "end" }) {
  return (
    <span
      className={cn(
        "type-caption font-semibold text-text-muted",
        align === "end" ? "text-end" : "text-start",
      )}
    >
      {label}
    </span>
  );
}

export function OrielUserMessage({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <SenderLabel label={label} align="end" />
      <div
        className="type-body max-w-[70%] rounded-2xl rounded-tr-md px-4 py-2.5 whitespace-pre-wrap text-text-primary"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--brand) 22%, transparent), color-mix(in srgb, var(--brand) 12%, transparent))",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--brand) 30%, transparent)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function OrielAssistantMessage({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <OrielMark size="sm" className="mt-5" />
      <div className="flex min-w-0 max-w-[min(100%,56rem)] flex-col gap-1.5">
        <SenderLabel label={label} align="start" />
        <div className={cn(glassPanelSurfaceClass, "rounded-2xl rounded-tl-md px-5 py-4")}>
          <AssistantMessage message={text} />
        </div>
      </div>
    </div>
  );
}
