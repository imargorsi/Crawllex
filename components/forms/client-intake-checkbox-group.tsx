"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type TClientIntakeCheckboxGroupProps<T extends string> = {
  legend: string;
  error?: string;
  options: readonly T[];
  selected: readonly T[];
  labels: Record<T, string>;
  onToggle: (value: T) => void;
  namePrefix: string;
};

export function ClientIntakeCheckboxGroup<T extends string>({
  legend,
  error,
  options,
  selected,
  labels,
  onToggle,
  namePrefix,
}: TClientIntakeCheckboxGroupProps<T>) {
  return (
    <fieldset className="space-y-2">
      <legend className="type-caption text-text-secondary">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = selected.includes(option);
          const inputId = `${namePrefix}-${option}`;

          return (
            <label
              key={option}
              htmlFor={inputId}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                checked
                  ? "border-[color-mix(in_srgb,var(--brand)_55%,var(--border))] bg-bg-selected"
                  : "border-border bg-bg-input hover:bg-bg-hover",
              )}
            >
              <Checkbox
                id={inputId}
                checked={checked}
                onChange={() => onToggle(option)}
                className="shrink-0"
              />
              <span className="type-body-strong text-text-primary">{labels[option]}</span>
            </label>
          );
        })}
      </div>
      {error ? <p className="type-caption text-status-rejected">{error}</p> : null}
    </fieldset>
  );
}
