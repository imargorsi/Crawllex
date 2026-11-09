"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";
import { glassPanelSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

export type TOrielSuggestion = { id: string; label: string; query: string };

/** Starter questions. Glass chips with a brand arrow, so they read as actions. */
export function OrielSuggestions({
  suggestions,
  disabled,
  onPick,
}: {
  suggestions: TOrielSuggestion[];
  disabled: boolean;
  onPick: (query: string) => void;
}) {
  return (
    <ul className="flex flex-wrap justify-center gap-2.5">
      {suggestions.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(item.query)}
            className={cn(
              glassPanelSurfaceClass,
              "type-caption group inline-flex items-center gap-2 rounded-full px-4 py-2 text-text-secondary transition-all hover:-translate-y-px hover:text-text-primary disabled:opacity-50",
            )}
          >
            <Icons.sparkles className="size-3.5 text-brand transition-transform group-hover:scale-110" aria-hidden />
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
