"use client";

import { useTranslation } from "react-i18next";

import type { TAppIconComponent } from "@/components/ui/app-icon";
import { clientNeedsProjectTypeOther } from "@/lib/clients/intake-constants";
import { Icons } from "@/lib/frontend/icons/app-icons";
import {
  INTAKE_BUILD_TYPE_ICONS,
  INTAKE_INTEGRATION_ICONS,
  INTAKE_MOBILE_PLATFORM_ICONS,
  INTAKE_WEB_APP_TYPE_ICONS,
  INTAKE_WEBSITE_FOCUS_ICONS,
} from "@/lib/frontend/clients/intake-option-icons";
import { elevatedCardMutedClass, intakeChoiceSelectedClass, detailIconWellOutlineClass } from "@/lib/frontend/layout/dashboard-chrome";
import type { TPublicClientView } from "@/types/client.types";
import { cn } from "@/lib/utils";

export type TClientIntakeReadChip = {
  key: string;
  label: string;
  icon?: TAppIconComponent;
};

type TClientIntakeReadChipsProps = {
  items: TClientIntakeReadChip[];
  emptyLabel: string;
  layout?: "wrap" | "grid";
};

export function useClientIntakeReadChips(client: TPublicClientView) {
  const { t: tForm } = useTranslation("translation", { keyPrefix: "modules.clients.createForm" });

  const projectTypeItems: TClientIntakeReadChip[] = client.projectTypes.map((type) => ({
    key: type,
    label: tForm(`projectTypes.${type}`),
    icon: INTAKE_BUILD_TYPE_ICONS[type],
  }));
  if (clientNeedsProjectTypeOther(client.projectTypes) && client.projectTypeOther) {
    projectTypeItems.push({ key: "project-type-other", label: client.projectTypeOther, icon: Icons.text });
  }

  const websiteFocusItems: TClientIntakeReadChip[] = client.websiteFocus.map((value) => ({
    key: value,
    label: tForm(`websiteFocus.${value}`),
    icon: INTAKE_WEBSITE_FOCUS_ICONS[value],
  }));

  const mobileItems: TClientIntakeReadChip[] = client.mobilePlatforms.map((value) => ({
    key: value,
    label: tForm(`mobilePlatforms.${value}`),
    icon: INTAKE_MOBILE_PLATFORM_ICONS[value],
  }));

  const webAppItems: TClientIntakeReadChip[] = client.webAppTypes.map((type) => ({
    key: type,
    label: tForm(`webAppTypes.${type}`),
    icon: INTAKE_WEB_APP_TYPE_ICONS[type],
  }));
  if (client.webAppTypeOther) {
    webAppItems.push({ key: "web-app-other", label: client.webAppTypeOther, icon: Icons.text });
  }

  const integrationItems: TClientIntakeReadChip[] = client.integrations.map((value) => ({
    key: value,
    label: tForm(`integrations.${value}`),
    icon: INTAKE_INTEGRATION_ICONS[value],
  }));
  if (client.integrationOther) {
    integrationItems.push({ key: "integration-other", label: client.integrationOther, icon: Icons.text });
  }

  return { projectTypeItems, websiteFocusItems, mobileItems, webAppItems, integrationItems };
}

export function ClientIntakeReadChips({
  items,
  emptyLabel,
  layout = "wrap",
}: TClientIntakeReadChipsProps) {
  if (items.length === 0) {
    return <p className={cn("type-body", elevatedCardMutedClass)}>{emptyLabel}</p>;
  }

  const isGrid = layout === "grid";

  return (
    <ul
      className={cn(
        isGrid ? "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" : "flex flex-wrap items-center gap-3",
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li
            key={item.key}
            className={cn(
              "inline-flex items-center",
              isGrid
                ? "min-h-24 w-full flex-col justify-center gap-2.5 rounded-2xl px-3 py-4 text-center"
                : "min-h-12 gap-2.5 rounded-full px-5 py-2.5 type-label leading-none",
              intakeChoiceSelectedClass,
            )}
          >
            {Icon ? (
              isGrid ? (
                <span className={cn(detailIconWellOutlineClass, "size-8")} aria-hidden>
                  <Icon className="size-4" />
                </span>
              ) : (
                <Icon className="size-4 shrink-0" aria-hidden />
              )
            ) : null}
            <span className={cn(isGrid ? "type-label leading-snug" : null)}>{item.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
