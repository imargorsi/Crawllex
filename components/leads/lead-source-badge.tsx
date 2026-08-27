"use client";

import { useTranslation } from "react-i18next";

import { WordpressIntegrationLogo } from "@/components/integrations/wordpress-integration-logo";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { leadSourceGroup } from "@/lib/frontend/leads/origin-display";
import { ACCOUNT_SOURCE_CHIP_CLASS } from "@/lib/frontend/users/account-source-display";
import { cn } from "@/lib/utils";
import type { TLeadOrigin } from "@/types/lead.types";

type TLeadSourceBadgeProps = {
  origin: TLeadOrigin;
  className?: string;
};

const CHIP_CLASS = {
  wordpress: ACCOUNT_SOURCE_CHIP_CLASS.google,
  others: ACCOUNT_SOURCE_CHIP_CLASS.self_register,
} as const;

/** Compact source chip — Title Case labels, not StatusChip uppercase. */
export function LeadSourceBadge({ origin, className }: TLeadSourceBadgeProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.leads.source" });
  const group = leadSourceGroup(origin);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 type-caption",
        CHIP_CLASS[group],
        className,
      )}
    >
      {group === "wordpress" ? (
        <WordpressIntegrationLogo size={14} className="shrink-0" />
      ) : (
        <Icons.grid className="size-3.5 shrink-0" aria-hidden />
      )}
      <span>{t(group)}</span>
    </span>
  );
}
