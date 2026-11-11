"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { PageBackdrop } from "@/components/ui/page-backdrop";
import { Button } from "@/components/ui/button";
import { LensOverview, formatWhen, type TLensNavigate, type TLensTab } from "@/components/lens/lens-overview";
import { LensHistory } from "@/components/lens/lens-history";
import { LensIssues, RULE_FILTERS, SEVERITY_FILTERS, SORT_FILTERS, TYPE_FILTERS, type TRuleTab, type TSeverityFilter, type TSortFilter, type TTypeFilter } from "@/components/lens/lens-issues";
import { LensPages } from "@/components/lens/lens-pages";
import { LensUptime } from "@/components/lens/lens-uptime";
import { LensNavBar } from "@/components/lens/lens-ui";
import { LensPageSheet } from "@/components/lens/lens-page-sheet";
import { useLensDashboard } from "@/features/lens/use-lens-dashboard";
import { useQueryParams } from "@/hooks/use-query-params.hook";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";


type TLensView = TLensTab | "pages" | "history";
const VIEWS: TLensView[] = ["overview", "seo", "pages", "uptime", "history"];

/** Keep a query value only if it is one of the allowed values; anything else falls back to the default. */
function pick<T extends string>(value: string | string[] | undefined, allowed: T[], fallback: T): T {
  return typeof value === "string" && (allowed as string[]).includes(value) ? (value as T) : fallback;
}

/**
 * Lens dashboard: header, top nav, and the views. The view and every filter live in the URL
 * (?view, ?type, ?severity, ?rule), so a shared link opens the same screen. Defaults are not written.
 * Demo data only.
 */
export function LensSection() {
  const { t, i18n } = useTranslation("translation", { keyPrefix: "lens" });
  const { data } = useLensDashboard();
  const locale = i18n.language;
  const router = useRouter();
  const { queryParams, setQueryParams, deleteQueryParams } = useQueryParams();

  const view = pick<TLensView>(queryParams.view, VIEWS, "overview");
  const filters = {
    type: pick<TTypeFilter>(queryParams.type, TYPE_FILTERS, "all"),
    severity: pick<TSeverityFilter>(queryParams.severity, SEVERITY_FILTERS, "all"),
    rule: pick<TRuleTab>(queryParams.rule, RULE_FILTERS, "all"),
    sort: pick<TSortFilter>(queryParams.sort, SORT_FILTERS, "severity"),
  };
  const issueParam = typeof queryParams.issue === "string" ? queryParams.issue : null;
  const pageParam = typeof queryParams.page === "string" ? data.pages.find((p) => p.url === queryParams.page) ?? null : null;

  /** Switch view. Filters and pages options are kept only for their own view, so other views get a clean URL. */
  const navigate = (next: TLensView, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    if (next !== "overview") params.set("view", next);
    if (next === "seo" || next === "pages") {
      Object.entries(extra).forEach(([key, value]) => {
        if (value !== "all") params.set(key, value);
      });
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const go: TLensNavigate = (next, nextSub) => {
    if (next === "seo") {
      if (nextSub === "history") return navigate("history");
      if (nextSub === "pages") return navigate("pages");
      return navigate("seo", { type: nextSub === "onpage" || nextSub === "technical" ? nextSub : "all" });
    }
    if (next === "overview" || next === "uptime") return navigate(next);
    navigate("pages");
  };

  /** Filter change: write the value, or remove the parameter when it is back to the default. */
  const onFilterChange = (key: "type" | "severity" | "rule" | "sort", value: string) => {
    if (value === "all") deleteQueryParams([key]);
    else setQueryParams({ [key]: value });
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
          <LensNavBar<TLensTab | "pages">
            label={t("seoTitle")}
            value={view === "history" ? null : view}
            onChange={(id) => navigate(id)}
            items={[
              { id: "overview", label: t("tabOverview"), icon: Icons.dashboard },
              { id: "seo", label: t("tabSeo"), icon: Icons.search, count: data.issues.filter((i) => i.status === "open").length },
              { id: "pages", label: t("pagesTitle"), icon: Icons.grid, count: data.seo.checked },
              { id: "uptime", label: t("tabUptime"), icon: Icons.analytics },
            ]}
          />
          <Button variant="outlined" size="lg" onClick={() => navigate("history")} className={cn("h-11 rounded-full", view === "history" && "border-brand/60 bg-brand/15")}>
            <Icons.clock aria-hidden />
            {t("viewHistory")}
          </Button>
        </div>
      </div>

      {view === "overview" ? <LensOverview data={data} t={t} locale={locale} go={go} /> : null}
      {view === "seo" ? (
        <LensIssues data={data} t={t} locale={locale} filters={filters} onFilterChange={onFilterChange} onNavigate={navigate} />
      ) : null}
      {view === "pages" ? (
        <LensPages
          data={data}
          t={t}
          locale={locale}
          issueId={issueParam}
          onIssueChange={(value) => (value === "all" ? deleteQueryParams(["issue"]) : setQueryParams({ issue: value }))}
          onOpenPage={(url) => setQueryParams({ page: url })}
        />
      ) : null}
      {view === "pages" && pageParam ? (
        <LensPageSheet
          page={pageParam}
          data={data}
          t={t}
          locale={locale}
          onClose={() => deleteQueryParams(["page"])}
          onNavigate={navigate}
        />
      ) : null}
      {view === "history" ? <LensHistory data={data} t={t} locale={locale} /> : null}
      {view === "uptime" ? <LensUptime data={data} t={t} locale={locale} /> : null}
      </div>
    </div>
  );
}
