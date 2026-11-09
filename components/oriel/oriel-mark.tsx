"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

type TOrielMarkProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE: Record<NonNullable<TOrielMarkProps["size"]>, { well: string; icon: string }> = {
  sm: { well: "size-7 rounded-lg", icon: "size-3.5" },
  md: { well: "size-9 rounded-xl", icon: "size-4.5" },
  lg: { well: "size-14 rounded-2xl", icon: "size-7" },
};

/**
 * Oriel's mark: the brand gradient with a soft glow. Used wherever Oriel speaks (headers, answers,
 * the dashboard shortcut), so the assistant reads as part of Crawllex.
 */
export function OrielMark({ size = "md", className }: TOrielMarkProps) {
  const current = SIZE[size];
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center text-white",
        current.well,
        className,
      )}
      style={{
        background: "var(--gradient-primary)",
        boxShadow: "0 0 24px -6px var(--glow-brand), inset 0 1px 0 rgba(255,255,255,0.25)",
      }}
    >
      <Icons.sparkles className={current.icon} />
    </span>
  );
}
