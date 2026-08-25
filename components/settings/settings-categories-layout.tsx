"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { TSettingsCategory, TSettingsCategoryId } from "@/lib/frontend/settings/categories";
import {
  elevatedCardSurfaceClass,
  settingsInsetDividerClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

type TSettingsCategoriesLayoutProps = {
  categories: readonly TSettingsCategory[];
  renderPanel: (categoryId: TSettingsCategoryId) => ReactNode;
};

/**
 * Single settings shell — full-height category rail + detail pane side by side.
 */
export function SettingsCategoriesLayout({
  categories,
  renderPanel,
}: TSettingsCategoriesLayoutProps) {
  const { t } = useTranslation("translation", { keyPrefix: "settings" });
  const [selectedCategoryId, setSelectedCategoryId] = useState<TSettingsCategoryId | null>(null);

  const activeCategoryId =
    selectedCategoryId && categories.some((category) => category.id === selectedCategoryId)
      ? selectedCategoryId
      : (categories[0]?.id ?? null);

  const activeCategory = categories.find((category) => category.id === activeCategoryId) ?? null;

  if (!activeCategory) return null;

  const ActiveIcon = activeCategory.icon;

  return (
    <div
      className={cn(
        elevatedCardSurfaceClass,
        "flex min-h-112 min-w-0 overflow-hidden rounded-xl",
      )}
    >
      <aside
        className={cn(
          "flex w-48 shrink-0 flex-col border-e border-border/45 p-3",
          "bg-bg-card/30 sm:w-52 sm:p-3.5 dark:border-text-primary/15 dark:bg-text-primary/3",
        )}
      >
        <nav className="flex flex-col" aria-label={t("categoriesHeading")}>
          {categories.map((category, index) => {
            const isActive = category.id === activeCategoryId;
            const Icon = category.icon;

            return (
              <div key={category.id} className="flex flex-col">
                {index > 0 ? (
                  <div className={cn(settingsInsetDividerClass, "my-1.5")} aria-hidden />
                ) : null}
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start type-label transition-colors",
                    isActive
                      ? "bg-bg-selected text-text-primary shadow-sm"
                      : "text-text-secondary hover:bg-bg-hover/55 hover:text-text-primary",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "text-brand" : "text-text-muted",
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{t(`categories.${category.labelKey}`)}</span>
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-col gap-3 px-4 pt-3 sm:px-5 sm:pt-3.5">
          <div className="flex items-center gap-2">
            <ActiveIcon className="size-4 shrink-0 text-brand" aria-hidden />
            <h2 className="type-title text-text-primary">
              {t(`categories.${activeCategory.labelKey}`)}
            </h2>
          </div>
          <div className={settingsInsetDividerClass} aria-hidden />
        </header>

        <div className="min-w-0 flex-1 px-4 py-4 sm:px-5 sm:py-5">
          {renderPanel(activeCategory.id)}
        </div>
      </div>
    </div>
  );
}
