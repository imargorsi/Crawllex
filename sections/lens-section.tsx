"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { PageBackdrop } from "@/components/ui/page-backdrop";
import { Button } from "@/components/ui/button";
import { LensOverview, formatWhen, type TLensNavigate, type TLensTab } from "@/components/lens/lens-overview";
import { LensHistory } from "@/components/lens/lens-history";
import { LensIssues } from "@/components/lens/lens-issues";
import { LensPages } from "@/components/lens/lens-pages";
import { LensUptime } from "@/components/lens/lens-uptime";
import { LensTabs } from "@/components/lens/lens-ui";
import { useLensDashboard } from "@/features/lens/use-lens-dashboard";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";


/** Lens dashboard: header, tabs (Overview, SEO Health, Pages, Uptime Monitoring) and View History. Demo data only. */
type TLensView = TLensTab | "pages" | "history";
type TTypePreset = "all" | "onpage" | "technical";

export function LensSection() {
  const { t, i18n } = useTranslation("translation", { keyPrefix: "lens" });
  const { data } = useLensDashboard();
  const locale = i18n.language;
  const [view, setView] = useState<TLensView>("overview");
  const [typePreset, setTypePreset] = useState<TTypePreset>("all");

  const go: TLensNavigate = (next, nextSub) => {
    if (next === "seo") {
      if (nextSub === "history" || nextSub === "pages") {
        setView(nextSub === "history" ? "history" : "pages");
        return;
      }
      setView("seo");
      setTypePreset(nextSub === "onpage" || nextSub === "technical" ? nextSub : "all");
      return;
    }
    if (next === "overview" || next === "uptime") {
      setView(next);
      return;
    }
    setView("pages");
  };

  return (
    <div className="relative w-full min-w-0">
      <PageBackdrop />

      <div className="relative flex flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="type-stack-md">
          <Heading id="lens-title" pageTitle>
            {t("seoTitle")}
          </Heading>
          <Paragraph className="text-text-muted">{t("subtitle", { site: new URL(data.siteUrl).hostname })}</Paragraph>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex h-11 items-center gap-3 px-1">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand/10">
              <Icons.clock className="size-4 text-brand" aria-hidden />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-text-muted">{t("lastCheck")}</span>
              <span className="text-sm font-semibold tabular-nums text-text-primary">{formatWhen(data.lastCheckAt, locale)}</span>
            </div>
          </div>
          <span className="inline-flex">
            <Button variant="primary" size="lg" className="h-11">
              <Icons.rocket aria-hidden />
              {t("startCheck")}
            </Button>
          </span>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <LensTabs<TLensTab | "pages">
            label={t("seoTitle")}
            value={view === "history" ? null : view}
            onChange={(id) => setView(id)}
            items={[
              { id: "overview", label: t("tabOverview") },
              { id: "seo", label: t("tabSeo") },
              { id: "pages", label: t("pagesTitle") },
              { id: "uptime", label: t("tabUptime") },
            ]}
          />
          <Button variant="outlined" size="lg" onClick={() => go("seo", "history")} className={cn("h-11 rounded-full", view === "history" && "border-brand/60 bg-brand/15")}>
            <Icons.clock aria-hidden />
            {t("viewHistory")}
          </Button>
        </div>
      </div>

      {view === "overview" ? <LensOverview data={data} t={t} locale={locale} go={go} /> : null}
      {view === "seo" ? <LensIssues key={typePreset} data={data} t={t} locale={locale} presetType={typePreset} /> : null}
      {view === "pages" ? <LensPages data={data} t={t} /> : null}
      {view === "history" ? <LensHistory data={data} t={t} locale={locale} /> : null}
      {view === "uptime" ? <LensUptime data={data} t={t} locale={locale} /> : null}
      </div>
    </div>
  );
}
