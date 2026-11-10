"use client";

import { useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { DonutChart } from "@/components/lens/lens-charts";
import { useSelectedProject } from "@/context/selected-project-context";
import { useLensOverviewQuery, type TLensIssue, type TLensRun } from "@/features/lens/lens.api";
import { ApiError } from "@/lib/frontend/api/errors";
import { elevatedCardSurfaceClass, metricIconWellClass, typeStackMdClass } from "@/lib/frontend/layout/dashboard-chrome";
import {
  categoryOf,
  GROUP_HELP,
  groupOf,
  ONPAGE_GROUPS,
  SEO_GROUP_ORDER,
  TECHNICAL_GROUPS,
  type LensGroupId,
} from "@/lib/lens/categories";
import { explainIssue } from "@/lib/lens/seo-explain";
import { healthScore, severityCounts } from "@/lib/lens/score";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

type T = TFunction<"translation", "lens">;

/** Lens card: the Crawllex glass panel (same as Analytics and Reports). Colors come from theme tokens only. */
const CARD = cn(elevatedCardSurfaceClass, "relative overflow-hidden rounded-3xl");
type Tab = "overview" | "onpage" | "technical" | "history";
type Level = "high" | "medium" | "low";

const EXTERNAL_CODES = new Set(["broken_external_link", "external_link_changed"]);
const GLOSSARY = ["sitemap", "robots", "canonical", "noindex", "structured", "h1", "meta"] as const;

/** Score bands in plain words. Thresholds are ours (see docs/SEO-RULES.md). */
export function scoreBand(score: number): "good" | "work" | "attention" {
  if (score >= 85) return "good";
  if (score >= 60) return "work";
  return "attention";
}

/** Lens SEO report for website owners: score, most important fixes, then on-page and technical categories. Read-only. */
export function LensSection() {
  const { t } = useTranslation("translation", { keyPrefix: "lens" });
  const { selectedProject } = useSelectedProject();
  const projectId = selectedProject?.id ?? null;
  const overview = useLensOverviewQuery(projectId);
  const [tab, setTab] = useState<Tab>("overview");

  const notConnected = overview.error instanceof ApiError && overview.error.status === 503;
  const data = overview.data;
  const latestRun = data?.runs[0] ?? null;
  const seoOpen = useMemo(
    () => (data?.issues ?? []).filter((i) => i.status !== "resolved" && categoryOf(i.code) === "seo"),
    [data],
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className={`${typeStackMdClass} text-2xl font-semibold text-text-primary`}>{t("seoTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("seoSubtitle")}</p>
        </div>
        {latestRun ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/45 bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand backdrop-blur-sm">
            <Icons.calendar className="size-3 shrink-0" aria-hidden />
            {t("lastCheck")}: {new Date(latestRun.started_at).toLocaleDateString()}
          </span>
        ) : null}
      </header>

      <nav role="tablist" aria-label={t("seoTitle")} className="flex flex-wrap gap-2">
        {(["overview", "onpage", "technical", "history"] as Tab[]).map((id) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              tab === id
                ? "border-brand/50 bg-brand/15 text-text-primary"
                : "border-border/60 text-muted-foreground hover:border-brand/40 hover:text-text-primary",
            )}
          >
            {id === "overview" ? t("tabOverview") : id === "onpage" ? t("onpageTitle") : id === "technical" ? t("technicalTitle") : t("tabHistory")}
          </button>
        ))}
      </nav>

      {overview.isLoading ? <LoadingState skeletonVariant="list" /> : null}
      {notConnected ? <EmptyState title={t("notConnectedTitle")} description={t("notConnectedBody")} /> : null}
      {overview.isError && !notConnected ? <EmptyState title={t("loadFailedTitle")} description={t("loadFailedBody")} /> : null}

      {data && tab === "overview" ? (
        <>
          <ScoreHero issues={seoOpen} latestRun={latestRun} t={t} />
          <SplitScores issues={seoOpen} onOpen={setTab} t={t} />
          <FixFirst issues={seoOpen} t={t} />
          <Glossary t={t} />
        </>
      ) : null}
      {data && tab === "onpage" ? <CategoryTab title={t("onpageTitle")} help={t("onpageHelp")} groups={ONPAGE_GROUPS} issues={seoOpen} t={t} /> : null}
      {data && tab === "technical" ? <CategoryTab title={t("technicalTitle")} help={t("technicalHelp")} groups={TECHNICAL_GROUPS} issues={seoOpen} t={t} /> : null}
      {data && tab === "history" ? <History runs={data.runs} t={t} /> : null}
    </div>
  );
}

function ScoreHero({ issues, latestRun, t }: { issues: TLensIssue[]; latestRun: TLensRun | null; t: T }) {
  const score = healthScore(issues);
  const band = scoreBand(score);
  const counts = severityCounts(issues);
  const color = band === "good" ? "var(--color-success)" : band === "work" ? "var(--color-warning)" : "var(--destructive)";
  const pages = new Set(issues.filter((i) => !EXTERNAL_CODES.has(i.code)).map((i) => i.target)).size;
  const checked = latestRun?.pages ?? 0;
  const known = latestRun?.known_urls;
  return (
    <section className={cn(CARD, "p-0")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold text-text-primary">{t(`summary_${band}`)}</h2>
        </div>
        <span className="inline-flex items-center rounded-full border border-brand/45 bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">
          {latestRun
            ? known ? t("summaryCoverage", { checked, known }) : t("summaryPagesPartial", { checked })
            : t("noRunYet")}
        </span>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 p-6 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          <DonutChart
            size={160}
            segments={[
              { label: t("healthScore"), value: score, color },
              { label: "rest", value: 100 - score, color: "var(--border)" },
            ]}
            centerLabel={t(`band_${band}`)}
            centerValue={String(score)}
          />
          <span className="max-w-[240px] text-center text-sm text-muted-foreground">{t("scoreRule")}</span>
        </div>
        <div className="flex min-w-0 flex-col gap-5 pt-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatChip label={t("failedLabel")} note={t("mustFixNote")} value={counts.high} tone="danger" />
            <StatChip label={t("warningsLabel")} note={t("shouldFixNote")} value={counts.medium} tone="warning" />
            <StatChip label={t("noticesLabel")} note={t("worthNote")} value={counts.low} tone="info" />
          </div>
          <p className="text-sm text-muted-foreground">{t("pagesAffectedNote", { count: pages })}</p>
        </div>
      </div>
    </section>
  );
}

function StatChip({ label, note, value, tone }: { label: string; note: string; value: number; tone: "danger" | "warning" | "info" }) {
  const Icon = tone === "danger" ? Icons.alert : tone === "warning" ? Icons.view : Icons.file;
  const text = tone === "danger" ? "text-destructive" : "text-text-primary";
  return (
    <div className={cn(CARD, "flex flex-col gap-4 p-5")}>
      <div className="flex items-center gap-3">
        <span className={cn(metricIconWellClass, tone === "danger" ? "text-destructive" : "text-brand")}>
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="text-sm font-medium text-text-primary">{label}</span>
      </div>
      <span className={cn("text-3xl font-semibold tabular-nums", text)}>{value}</span>
      <span className="text-sm text-muted-foreground">{note}</span>
    </div>
  );
}

/** Two scores: what the pages say, and how search engines reach them. */
function SplitScores({ issues, onOpen, t }: { issues: TLensIssue[]; onOpen: (tab: Tab) => void; t: T }) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
      <SplitCard title={t("onpageTitle")} help={t("onpageHelp")} groups={ONPAGE_GROUPS} issues={issues} onOpen={() => onOpen("onpage")} t={t} />
      <SplitCard title={t("technicalTitle")} help={t("technicalHelp")} groups={TECHNICAL_GROUPS} issues={issues} onOpen={() => onOpen("technical")} t={t} />
    </div>
  );
}

function SplitCard({ title, help, groups, issues, onOpen, t }: { title: string; help: string; groups: LensGroupId[]; issues: TLensIssue[]; onOpen: () => void; t: T }) {
  const mine = issues.filter((i) => groups.includes(groupOf(i.code)));
  const score = healthScore(mine);
  const band = scoreBand(score);
  const color = band === "good" ? "var(--color-success)" : band === "work" ? "var(--color-warning)" : "var(--destructive)";
  const working = groups.filter((g) => !mine.some((i) => groupOf(i.code) === g));
  return (
    <button type="button" onClick={onOpen} className={cn(CARD, "flex items-center gap-5 p-6 text-start transition-colors hover:border-brand/50")}>
      <DonutChart
        size={128}
        segments={[{ label: title, value: score, color }, { label: "rest", value: 100 - score, color: "var(--border)" }]}
        centerLabel={t(`band_${band}`)}
        centerValue={String(score)}
      />
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <p className="text-xs text-muted-foreground">{help}</p>
        <p className="text-sm text-text-primary">{t("openIssuesCount", { count: mine.length })}</p>
        {working.length ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground">{t("workingWell")}:</span>
            {working.map((g) => <span key={g} className="rounded-full border border-success/40 px-2 py-0.5 text-xs text-success">{t(`group_${g}`)}</span>)}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function FixFirst({ issues, t }: { issues: TLensIssue[]; t: T }) {
  const groups = useMemo(() => {
    const byCode = new Map<string, TLensIssue[]>();
    for (const issue of issues) byCode.set(issue.code, [...(byCode.get(issue.code) ?? []), issue]);
    return [...byCode.entries()]
      .map(([code, list]) => ({ code, list, level: levelOf(list) }))
      .sort((a, b) => rankOf(b.level) - rankOf(a.level) || b.list.length - a.list.length)
      .slice(0, 5);
  }, [issues]);
  if (groups.length === 0) return <p className="text-sm text-muted-foreground">{t("noIssues")}</p>;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-text-primary">{t("startHere")}</h2>
      <ul className="flex flex-col gap-2">
        {groups.map((g) => (
          <li key={g.code} className={cn(CARD, "flex flex-wrap items-center justify-between gap-3 px-5 py-4")}>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold text-text-primary">{explainIssue(g.code).title}</span>
              <span className="text-xs text-muted-foreground">{t("foundOnPages", { count: g.list.length })}</span>
            </div>
            <LevelWord level={g.level} t={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryTab({ title, help, groups, issues, t }: { title: string; help: string; groups: LensGroupId[]; issues: TLensIssue[]; t: T }) {
  const mine = issues.filter((i) => groups.includes(groupOf(i.code)));
  const score = healthScore(mine);
  const band = scoreBand(score);
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        <p className="text-sm text-muted-foreground">{help}</p>
        <p className="text-sm text-text-primary">{t(`band_${band}`)} · {t("openIssuesCount", { count: mine.length })}</p>
      </div>
      {groups.filter((g) => SEO_GROUP_ORDER.includes(g)).map((g) => {
        const rows = issues.filter((i) => groupOf(i.code) === g);
        return rows.length ? <CategorySection key={g} groupId={g} issues={rows} t={t} /> : (
          <div key={g} className="flex items-center justify-between rounded-2xl border border-success/30 px-5 py-3 text-sm">
            <span className="text-text-primary">{t(`group_${g}`)}</span>
            <span className="text-xs text-success">{t("workingWell")}</span>
          </div>
        );
      })}
    </section>
  );
}

function CategorySection({ groupId, issues, t }: { groupId: LensGroupId; issues: TLensIssue[]; t: T }) {
  const byCode = useMemo(() => {
    const map = new Map<string, TLensIssue[]>();
    for (const issue of issues) map.set(issue.code, [...(map.get(issue.code) ?? []), issue]);
    return [...map.entries()];
  }, [issues]);
  const counts = severityCounts(issues);
  return (
    <article className={cn(CARD, "flex flex-col gap-4 p-6")}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-text-primary">{t(`group_${groupId}`)}</h3>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {counts.high ? <span className="rounded-full border border-destructive/40 px-2 py-0.5 text-destructive">{counts.high} {t("failedLabel")}</span> : null}
            {counts.medium ? <span className="rounded-full border border-border/60 px-2 py-0.5 text-text-primary">{counts.medium} {t("warningsLabel")}</span> : null}
            {counts.low ? <span className="rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">{counts.low} {t("noticesLabel")}</span> : null}
          </div>
        </div>
        {GROUP_HELP[groupId] ? <p className="text-sm text-muted-foreground">{GROUP_HELP[groupId]}</p> : null}
      </div>
      <div className="flex flex-col gap-2">
        {byCode.map(([code, list]) => <IssueCard key={code} code={code} list={list} t={t} />)}
      </div>
    </article>
  );
}

/** One issue type: plain title, why it matters, how many pages, and a "What to do" panel that opens on click. */
function IssueCard({ code, list, t }: { code: string; list: TLensIssue[]; t: T }) {
  const [open, setOpen] = useState(false);
  const text = explainIssue(code);
  return (
    <div className="rounded-2xl border border-border/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h4 className="text-sm font-semibold text-text-primary">{text.title}</h4>
          <p className="text-sm text-muted-foreground">{text.why}</p>
          <span className="text-xs text-muted-foreground">{t("foundOnPages", { count: list.length })}</span>
        </div>
        <LevelWord level={levelOf(list)} t={t} />
      </div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="mt-3 text-xs font-medium text-brand hover:underline">
        {open ? t("showLess") : t("whatToDo")}
      </button>
      {open ? (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border/40 p-4">
          <p className="text-sm text-text-primary">{text.fix}</p>
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
            {list.slice(0, 10).map((i) => <li key={i.id} className="truncate">{i.target}</li>)}
          </ul>
          {list.length > 10 ? <span className="text-xs text-muted-foreground">+{list.length - 10}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function Glossary({ t }: { t: T }) {
  return (
    <section className={cn(CARD, "flex flex-col gap-3 p-6")}>
      <h2 className="text-sm font-semibold text-text-primary">{t("glossaryTitle")}</h2>
      <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-2">
        {GLOSSARY.map((term) => <li key={term}>{t(`glossary_${term}`)}</li>)}
      </ul>
    </section>
  );
}

function History({ runs, t }: { runs: TLensRun[]; t: T }) {
  if (runs.length === 0) return <p className="text-sm text-muted-foreground">{t("noRunYet")}</p>;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-text-primary">{t("historyTitle")}</h2>
      <ul className="flex flex-col gap-2">
        {runs.map((run) => (
          <li key={run.id} className={cn(CARD, "flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm")}>
            <span className="text-text-primary">{new Date(run.started_at).toLocaleString()}</span>
            <span className="text-muted-foreground">
              {run.known_urls ? t("summaryCoverage", { checked: run.pages, known: run.known_urls }) : t("summaryPagesPartial", { checked: run.pages })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LevelWord({ level, t }: { level: Level; t: T }) {
  if (level === "high") return <span className="shrink-0 rounded-full border border-destructive/40 px-2.5 py-0.5 text-xs text-destructive">{t("failedLabel")}</span>;
  if (level === "medium") return <span className="shrink-0 rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-text-primary">{t("warningsLabel")}</span>;
  return <span className="shrink-0 rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground">{t("noticesLabel")}</span>;
}

function levelOf(list: TLensIssue[]): Level {
  if (list.some((i) => i.severity === "high")) return "high";
  if (list.some((i) => i.severity === "medium")) return "medium";
  return "low";
}

function rankOf(level: Level): number {
  return level === "high" ? 3 : level === "medium" ? 2 : 1;
}
