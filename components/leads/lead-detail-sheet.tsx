"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useTranslation } from "react-i18next";

import { LeadSourceBadge } from "@/components/leads/lead-source-badge";
import {
  DetailFieldRow,
  DetailSectionHeading,
  detailSectionClass,
} from "@/components/ui/detail-field-row";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  detailBodyClass,
  detailHeroRowClass,
  detailIconWellOutlineClass,
  typeIconTextClass,
  typeMetaRowClass,
  typeStackIdentityClass,
} from "@/lib/frontend/layout/dashboard-chrome";
import { leadExtrasForDisplay } from "@/lib/leads/extras.utils";
import { formatLeadDisplayName } from "@/lib/leads/serialize-lead";
import { cn } from "@/lib/utils";
import type { TLeadDto } from "@/types/lead.types";

type TLeadDetailSheetProps = {
  lead: TLeadDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatLeadDate(isoDate: string, locale: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "—";
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function LeadDetailSheet({ lead, open, onOpenChange }: TLeadDetailSheetProps) {
  const { t, i18n } = useTranslation("translation", { keyPrefix: "modules.leads.detail" });
  const extrasEntries = lead ? leadExtrasForDisplay(lead, t("services")) : [];
  const displayName = lead
    ? formatLeadDisplayName(lead.firstName, lead.lastName) || t("unnamed")
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(100%,28rem)] sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("lead")}</SheetDescription>
        </SheetHeader>

        {lead ? (
          <div className={detailBodyClass}>
            <section>
              <div className={detailHeroRowClass}>
                <span className={cn(detailIconWellOutlineClass, "size-12 shrink-0")} aria-hidden>
                  <Icons.user className="size-5" />
                </span>
                <div className={cn("min-w-0 flex-1", typeStackIdentityClass)}>
                  <p className="truncate type-title leading-snug text-text-primary">{displayName}</p>
                  <div className={typeMetaRowClass}>
                    <span className={cn(typeIconTextClass, "type-caption text-text-muted")}>
                      <Icons.mail className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{lead.email}</span>
                    </span>
                    <span className={cn(typeIconTextClass, "type-caption text-text-muted")}>
                      <Icons.call className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{lead.phone}</span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className={detailSectionClass}>
              <DetailSectionHeading title={t("leadTitle")} description={t("leadSectionLead")} />
              <div>
                <DetailFieldRow icon={Icons.calendar} label={t("leadDate")}>
                  {formatLeadDate(lead.leadDate, i18n.language)}
                </DetailFieldRow>
                <DetailFieldRow icon={Icons.building} label={t("source")}>
                  <LeadSourceBadge origin={lead.origin} />
                </DetailFieldRow>
                <DetailFieldRow icon={Icons.megaphone} label={t("message")}>
                  {lead.message.trim() || "—"}
                </DetailFieldRow>
              </div>
            </section>

            {extrasEntries.length > 0 ? (
              <section className={detailSectionClass}>
                <DetailSectionHeading title={t("extrasTitle")} description={t("extrasLead")} />
                <div>
                  {extrasEntries.map(([key, value]) => (
                    <DetailFieldRow key={key} icon={Icons.file} label={key}>
                      {value.trim() || "—"}
                    </DetailFieldRow>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
