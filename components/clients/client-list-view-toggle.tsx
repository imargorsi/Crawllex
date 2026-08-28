"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";
import { useTranslation } from "react-i18next";

import type { TClientListViewMode } from "@/lib/frontend/clients/clients-list-view.utils";
import { toolbarFilterShellClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

type TClientListViewToggleProps = {
  viewMode: TClientListViewMode;
  onViewModeChange: (mode: TClientListViewMode) => void;
  className?: string;
};

const VIEW_OPTIONS: {
  id: TClientListViewMode;
  icon: typeof Icons.grid;
  labelKey: "cards" | "table";
}[] = [
  { id: "cards", icon: Icons.grid, labelKey: "cards" },
  { id: "table", icon: Icons.list, labelKey: "table" },
];

export function ClientListViewToggle({
  viewMode,
  onViewModeChange,
  className,
}: TClientListViewToggleProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients.viewMode" });

  return (
    <div className={cn(toolbarFilterShellClass, className)} role="group" aria-label={t("ariaLabel")}>
      {VIEW_OPTIONS.map((option) => {
        const isActive = viewMode === option.id;
        const Icon = option.icon;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            aria-label={t(option.labelKey)}
            title={t(option.labelKey)}
            onClick={() => onViewModeChange(option.id)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full transition-colors",
              isActive
                ? "bg-brand text-text-on-brand"
                : "text-text-muted hover:bg-bg-hover hover:text-text-primary",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
