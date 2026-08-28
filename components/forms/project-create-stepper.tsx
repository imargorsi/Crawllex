"use client";

import { cn } from "@/lib/utils";

type ProjectCreateStepperProps = {
  labels: string[];
  current: number;
  ariaLabel?: string;
};

export function ProjectCreateStepper({
  labels,
  current,
  ariaLabel = "Project Form Steps",
}: ProjectCreateStepperProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ol className="relative flex list-none items-start justify-between gap-2 p-0">
        <div
          className="pointer-events-none absolute left-4 right-4 top-4 h-px bg-border sm:top-4.5"
          aria-hidden
        />
        {labels.map((label, index) => {
          const isActive = index === current;
          const isDone = index < current;
          const stepNumber = index + 1;

          return (
            <li
              key={label}
              className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-2"
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full type-caption-xs font-semibold sm:size-9",
                  isActive
                    ? "bg-brand text-text-on-brand"
                    : isDone
                      ? "border border-border bg-bg-hover text-text-secondary"
                      : "border border-border bg-bg-hover text-text-muted",
                )}
                aria-hidden
              >
                {stepNumber}
              </span>
              <span
                className={cn(
                  "type-caption-xs text-center font-semibold leading-tight",
                  isActive ? "text-text-primary" : isDone ? "text-text-secondary" : "text-text-muted",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
