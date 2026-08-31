"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Heading } from "@/components/heading";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { displayDetailValue } from "@/lib/frontend/projects/project-detail-display.utils";
import {
  elevatedCardBodyClass,
  elevatedCardSurfaceClass,
  elevatedCardTitleClass,
  typeIconTextClass,
  typeMetaRowClass,
  typeStackIdentityClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";

type TClientIntakeHeroProps = {
  businessName: string;
  logoImage: string | null;
  contactPerson: string;
  pocEmail: string;
  pocContactNumber: string;
  avatarSize?: "lg" | "xl";
  endSlot?: ReactNode;
};

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="text-text-muted" aria-hidden>
        {icon}
      </span>
      <span className="truncate">{value}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          typeIconTextClass,
          "type-caption transition-colors hover:text-text-primary",
          elevatedCardBodyClass,
        )}
        aria-label={label}
      >
        {content}
      </a>
    );
  }

  return <span className={cn(typeIconTextClass, "type-caption", elevatedCardBodyClass)}>{content}</span>;
}

function telHref(value: string): string | undefined {
  const compact = value.trim().replace(/\s+/g, "");
  return compact ? `tel:${compact}` : undefined;
}

export function ClientIntakeHero({
  businessName,
  logoImage,
  contactPerson,
  pocEmail,
  pocContactNumber,
  avatarSize = "lg",
  endSlot,
}: TClientIntakeHeroProps) {
  const { t } = useTranslation("translation", { keyPrefix: "modules.clients.createForm" });
  const email = pocEmail.trim();
  const phone = pocContactNumber.trim();

  return (
    <section className={cn(elevatedCardSurfaceClass, "rounded-3xl p-4 sm:p-5")}>
      <div className="flex items-start gap-4">
        <UserAvatar name={businessName} imageUrl={logoImage} size={avatarSize} variant="logo" />
        <div className={cn("min-w-0 flex-1", typeStackIdentityClass)}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Heading sectionTitle className={cn("min-w-0 truncate", elevatedCardTitleClass)}>
              {businessName}
            </Heading>
            {endSlot ? <div className="flex shrink-0 flex-wrap items-center gap-2">{endSlot}</div> : null}
          </div>
          <div className={cn(typeMetaRowClass, "sm:flex-nowrap")}>
            <ContactItem
              icon={<Icons.user className="size-3.5 shrink-0" />}
              label={t("contactPerson")}
              value={displayDetailValue(contactPerson)}
            />
            <ContactItem
              icon={<Icons.call className="size-3.5 shrink-0" />}
              label={t("pocContactNumber")}
              value={displayDetailValue(phone)}
              href={telHref(phone)}
            />
            <ContactItem
              icon={<Icons.mail className="size-3.5 shrink-0" />}
              label={t("pocEmail")}
              value={displayDetailValue(email)}
              href={email ? `mailto:${email}` : undefined}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
