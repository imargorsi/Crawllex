"use client";

import { cn } from "@/lib/utils";

type TSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
};

/** Plain switch: outlined track, no fill background. Brand colour only marks the on state. */
export function Switch({ checked, onCheckedChange, disabled = false, ariaLabel, className }: TSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ease-out",
        "focus-visible:ring-2 focus-visible:ring-accent-border focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-brand" : "border-border",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute start-0.5 size-4 rounded-full transition-transform duration-200 ease-out",
          checked ? "translate-x-5 rtl:-translate-x-5 bg-brand" : "translate-x-0 bg-text-muted",
        )}
      />
    </button>
  );
}
