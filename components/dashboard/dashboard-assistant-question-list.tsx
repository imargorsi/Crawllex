"use client";

import type { TAppIconComponent } from "@/components/ui/app-icon";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

export type TAssistantQuestionRow = {
  id: string;
  label: string;
  query: string;
  icon: TAppIconComponent;
};

type TDashboardAssistantQuestionListProps = {
  title: string;
  items: TAssistantQuestionRow[];
  disabled?: boolean;
  onSelect: (query: string) => void;
};

export function DashboardAssistantQuestionList({
  title,
  items,
  disabled = false,
  onSelect,
}: TDashboardAssistantQuestionListProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex shrink-0 flex-col gap-2.5">
      <p className="type-caption text-text-muted">{title}</p>
      <div className="flex flex-col gap-2.5" role="list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="listitem"
              disabled={disabled}
              onClick={() => onSelect(item.query)}
              className={cn(
                "flex min-h-10 w-full items-center gap-2.5 rounded-xl border border-border/40 bg-transparent px-2.5 py-2.5 text-start",
                "transition-colors hover:border-border hover:bg-bg-hover/40",
                "disabled:opacity-50 dark:border-text-primary/20 dark:hover:border-text-primary/30",
              )}
            >
              <Icon className="size-4 shrink-0 text-text-muted" aria-hidden />
              <span className="min-w-0 flex-1 truncate type-caption text-text-primary">
                {item.label}
              </span>
              <Icons.arrowRight
                className="size-3.5 shrink-0 text-text-muted rtl:rotate-180"
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
