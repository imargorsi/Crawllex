"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { PageBackdrop } from "@/components/ui/page-backdrop";
import { Button } from "@/components/ui/button";
import { LensOverview, formatWhen, type TLensNavigate, type TLensTab } from "@/components/lens/lens-overview";
import { LensSeoHealth, type TSeoSub, type TTypePreset } from "@/components/lens/lens-seo-health";
import { LensUptime } from "@/components/lens/lens-uptime";
import { LensTabs } from "@/components/lens/lens-ui";
import { useLensDashboard } from "@/features/lens/use-lens-dashboard";
import { Icons } from "@/lib/frontend/icons/app-icons";


/** Lens dashboard: header, three tabs (Overview, SEO health, Uptime monitoring). Phase 1 renders demo data only. */
export function LensSection() {
  const { t, i18n } = useTranslation("translation", { keyPrefix: "lens" });
  const { data } = useLensDashboard();
  const locale = i18n.language;
  const [tab, setTab] = useState<TLensTab>("overview");
  const [sub, setSub] = useState<TSeoSub>("all");
  const [presetType, setPresetType] = useState<TTypePreset>("all");

  const go: TLensNavigate = (next, nextSub) => {
    setTab(next);
    if (next !== "seo") return;
    if (nextSub === "pages" || nextSub === "history") {
      setSub(nextSub);
      return;
    }
    setSub("all");
    setPresetType(nextSub === "onpage" || nextSub === "technical" ? nextSub : "all");
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
          <LensTabs<TLensTab>
            label={t("seoTitle")}
            value={tab}
            onChange={setTab}
            items={[
              { id: "overview", label: t("tabOverview") },
              { id: "seo", label: t("tabSeo") },
              { id: "uptime", label: t("tabUptime") },
            ]}
          />
          <Button variant="outlined" size="lg" onClick={() => go("seo", "history")} className="h-11 rounded-full">
            <Icons.clock aria-hidden />
            {t("viewHistory")}
          </Button>
        </div>
      </div>

      {tab === "overview" ? <LensOverview data={data} t={t} locale={locale} go={go} /> : null}

      {tab === "seo" ? (
        <div className="flex flex-col gap-4">
          <LensTabs<TSeoSub>
            label={t("tabSeo")}
            value={sub}
            onChange={setSub}
            items={[
              { id: "all", label: t("seoAllIssues") },
              { id: "pages", label: t("pagesTitle") },
            ]}
          />
          <LensSeoHealth data={data} t={t} locale={locale} sub={sub} presetType={presetType} />
        </div>
      ) : null}

      {tab === "uptime" ? <LensUptime data={data} t={t} locale={locale} /> : null}
      </div>
    </div>
  );
}
