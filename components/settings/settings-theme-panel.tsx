"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useFontPack } from "@/components/providers/font-pack-provider";
import { useThemePack } from "@/components/providers/theme-pack-provider";
import { useUpdateUserPreferencesMutation } from "@/features/preferences/preferences.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { notify } from "@/lib/frontend/feedback/notify";
import {
  detailIconWellClass,
  elevatedCardSurfaceClass,
  settingsInsetDividerClass,
  typeStackMdClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { FONT_PACKS, type TFontPackId } from "@/lib/frontend/theme/font-packs";
import { THEME_PACKS, type TThemePackId } from "@/lib/frontend/theme/theme-packs";
import { cn } from "@/lib/utils";

export function SettingsThemePanel() {
  const { t: tTheme } = useTranslation("translation", { keyPrefix: "settings.themePacks" });
  const { t: tFont } = useTranslation("translation", { keyPrefix: "settings.fontPacks" });
  const { themePack } = useThemePack();
  const { fontPack } = useFontPack();
  const updatePreferences = useUpdateUserPreferencesMutation();
  const isBusy = updatePreferences.isPending;

  function handleThemeSelect(packId: TThemePackId) {
    if (isBusy || packId === themePack) return;
    updatePreferences.mutate(
      { theme_pack: packId },
      {
        onError: (error) => {
          notify.error(ApiError.messageFrom(error, tTheme("saveErrorFallback")));
        },
      },
    );
  }

  function handleFontSelect(packId: TFontPackId) {
    if (isBusy || packId === fontPack) return;
    updatePreferences.mutate(
      { font_pack: packId },
      {
        onError: (error) => {
          notify.error(ApiError.messageFrom(error, tFont("saveErrorFallback")));
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PreferenceSection title={tTheme("sectionTitle")} lead={tTheme("lead")}>
        <div className="grid grid-cols-2 gap-3">
          {THEME_PACKS.map((pack) => (
            <ThemePackCard
              key={pack.id}
              packId={pack.id}
              title={tTheme(pack.nameKey)}
              description={tTheme(pack.descriptionKey)}
              swatches={pack.swatches}
              isSelected={themePack === pack.id}
              selectedLabel={tTheme("selected")}
              disabled={isBusy}
              onSelect={() => handleThemeSelect(pack.id)}
            />
          ))}
        </div>
      </PreferenceSection>

      <div className={settingsInsetDividerClass} aria-hidden />

      <PreferenceSection title={tFont("sectionTitle")} lead={tFont("lead")}>
        <div className="grid grid-cols-2 gap-3">
          {FONT_PACKS.map((pack) => (
            <FontPackCard
              key={pack.id}
              packId={pack.id}
              title={tFont(pack.nameKey)}
              description={tFont(pack.descriptionKey)}
              cssVariable={pack.cssVariable}
              isSelected={fontPack === pack.id}
              selectedLabel={tFont("selected")}
              disabled={isBusy}
              onSelect={() => handleFontSelect(pack.id)}
            />
          ))}
        </div>
      </PreferenceSection>
    </div>
  );
}

function PreferenceSection({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className={typeStackMdClass}>
        <h3 className="type-title text-text-primary">{title}</h3>
        <p className="max-w-2xl type-body text-text-muted">{lead}</p>
      </div>
      {children}
    </section>
  );
}

const preferenceCardClass = cn(
  "flex h-full min-w-0 w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-start sm:gap-4 sm:px-5 sm:py-4",
  "transition-[border-color,background-color,box-shadow,opacity] duration-200",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-border)",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card",
  "disabled:pointer-events-none disabled:opacity-60",
);

function preferenceCardStateClass(isSelected: boolean) {
  return isSelected
    ? "border border-brand/55 bg-bg-selected/50 text-text-primary shadow-sm backdrop-blur-md backdrop-saturate-125"
    : elevatedCardSurfaceClass;
}

function PreferenceCardWell({ children }: { children: ReactNode }) {
  return (
    <span className={cn(detailIconWellClass, "size-12")} aria-hidden>
      {children}
    </span>
  );
}

function ThemePackCard({
  packId,
  title,
  description,
  swatches,
  isSelected,
  selectedLabel,
  disabled,
  onSelect,
}: {
  packId: TThemePackId;
  title: string;
  description: string;
  swatches: readonly [string, string, string];
  isSelected: boolean;
  selectedLabel: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={isSelected ? `${title}. ${selectedLabel}` : title}
      data-theme-pack={packId}
      className={cn(preferenceCardClass, preferenceCardStateClass(isSelected))}
    >
      <PreferenceCardWell>
        <span className="flex items-center">
          {swatches.map((hex, index) => (
            <span
              key={hex}
              className={cn(
                "size-4 rounded-full border border-border/50 dark:border-text-primary/25",
                index > 0 && "-ms-1.5",
              )}
              style={{ backgroundColor: hex, zIndex: swatches.length - index }}
            />
          ))}
        </span>
      </PreferenceCardWell>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="type-body-strong text-text-primary">{title}</p>
        <p className="type-body leading-snug text-text-muted">{description}</p>
      </div>
      {isSelected ? (
        <Icons.checkCircle className="size-5 shrink-0 text-brand" aria-hidden />
      ) : null}
    </button>
  );
}

function FontPackCard({
  packId,
  title,
  description,
  cssVariable,
  isSelected,
  selectedLabel,
  disabled,
  onSelect,
}: {
  packId: TFontPackId;
  title: string;
  description: string;
  cssVariable: string;
  isSelected: boolean;
  selectedLabel: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={isSelected ? `${title}. ${selectedLabel}` : title}
      data-font-pack={packId}
      className={cn(preferenceCardClass, preferenceCardStateClass(isSelected))}
    >
      <PreferenceCardWell>
        <span
          className="type-title leading-none text-text-primary"
          style={{ fontFamily: `var(${cssVariable})` }}
        >
          Aa
        </span>
      </PreferenceCardWell>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          className="type-body-strong text-text-primary"
          style={{ fontFamily: `var(${cssVariable})` }}
        >
          {title}
        </p>
        <p className="type-body leading-snug text-text-muted">{description}</p>
      </div>
      {isSelected ? (
        <Icons.checkCircle className="size-5 shrink-0 text-brand" aria-hidden />
      ) : null}
    </button>
  );
}
