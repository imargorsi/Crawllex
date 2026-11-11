import type { TAppIconComponent } from "@/components/ui/app-icon";
import { Icons } from "@/lib/frontend/icons/app-icons";

export const SETTINGS_CATEGORY_IDS = ["theme", "integrations", "agents"] as const;

export type TSettingsCategoryId = (typeof SETTINGS_CATEGORY_IDS)[number];

export type TSettingsCategory = {
  id: TSettingsCategoryId;
  /** i18n key under `settings.categories.*` */
  labelKey: TSettingsCategoryId;
  icon: TAppIconComponent;
  /** When true, only `super_admin` sees this category. */
  requiresSuperAdmin: boolean;
  /** When true, needs `integrations.view` on the selected project (`super_admin` always qualifies). */
  requiresIntegrationsView?: boolean;
};

export const SETTINGS_CATEGORIES: readonly TSettingsCategory[] = [
  {
    id: "theme",
    labelKey: "theme",
    icon: Icons.paintBoard,
    requiresSuperAdmin: false,
  },
  {
    id: "integrations",
    labelKey: "integrations",
    icon: Icons.link,
    requiresSuperAdmin: false,
    requiresIntegrationsView: true,
  },
  {
    // AI and agent modules per project (Lens enrollment). Super admin only.
    id: "agents",
    labelKey: "agents",
    icon: Icons.settings,
    requiresSuperAdmin: true,
  },
];

export function resolveSettingsCategories(options: {
  isAdmin: boolean;
  canViewIntegrations: boolean;
}): TSettingsCategory[] {
  return SETTINGS_CATEGORIES.filter((category) => {
    if (category.requiresSuperAdmin && !options.isAdmin) return false;
    if (category.requiresIntegrationsView && !options.isAdmin && !options.canViewIntegrations) {
      return false;
    }
    return true;
  });
}
