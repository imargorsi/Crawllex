"use client";

import { useTranslation } from "react-i18next";

import { useWorkspace } from "@/context/workspace-context";
import type { TDashboardWorkspace } from "@/lib/frontend/layout/workspace";
import { cn } from "@/lib/utils";

export function WorkspaceToggle() {
  const { t } = useTranslation("translation", { keyPrefix: "workspace" });
  const { workspace, canSwitchWorkspace, setWorkspace } = useWorkspace();

  if (!canSwitchWorkspace) return null;

  const options: { id: TDashboardWorkspace; label: string }[] = [
    { id: "seo", label: t("crawllex") },
    { id: "onboarding", label: t("onboarding") },
  ];

  return (
    <div
      role="tablist"
      aria-label={t("aria")}
      className="grid h-9 shrink-0 grid-cols-2 gap-0.5 rounded-full border border-border/50 bg-bg-card/20 p-0.5 dark:border-text-primary/30 dark:bg-text-primary/[0.05]"
    >
      {options.map((option) => {
        const isActive = workspace === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setWorkspace(option.id)}
            className={cn(
              "rounded-full px-2.5 type-caption font-semibold transition-colors",
              isActive
                ? "bg-brand text-text-on-brand shadow-xs"
                : "text-text-muted hover:bg-bg-hover hover:text-text-primary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
