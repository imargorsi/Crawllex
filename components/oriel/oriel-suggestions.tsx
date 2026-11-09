"use client";

import { glassPanelSurfaceClass } from "@/lib/frontend/layout/dashboard-chrome";

export type TOrielSuggestion = { id: string; label: string; query: string };

/** Starter questions shown on an empty conversation. */
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
    <ul className="flex flex-wrap justify-center gap-2">
      {suggestions.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(item.query)}
            className={`${glassPanelSurfaceClass} type-caption text-text-secondary hover:text-text-primary rounded-full px-3.5 py-2 transition-colors disabled:opacity-50`}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
