"use client";

import { useMemo, useState } from "react";

import { formatWhen, type TLensT } from "@/components/lens/lens-overview";
import { LensEmpty, LensNavBar, LensPill, LensWave, severityTone, type TLensSeverity } from "@/components/lens/lens-ui";
import { TableListSort } from "@/components/table/table-list-sort";
import type { TLensDemoDashboard, TLensDemoIssue, TLensGroup, TLensRuleGroup } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

export type TSeverityFilter = "all" | TLensSeverity;
export type TTypeFilter = "all" | TLensGroup;
export type TRuleTab = "all" | TLensRuleGroup;
export type TSortFilter = "severity" | "pages";

export const SEVERITY_FILTERS: TSeverityFilter[] = ["all", "high", "medium", "advisory"];
export const TYPE_FILTERS: TTypeFilter[] = ["all", "onpage", "technical"];
export const RULE_FILTERS: TRuleTab[] = ["all", "titles", "descriptions", "headings", "content", "images", "indexing", "robots", "urls", "links", "structured"];
export const SORT_FILTERS: TSortFilter[] = ["severity", "pages"];

type TNavigate = (view: "pages" | "history", extra?: Record<string, string>) => void;

const SEVERITY_RANK: Record<TLensSeverity, number> = { high: 3, medium: 2, advisory: 1 };

const RULE_LABEL_KEY: Record<TLensRuleGroup, "ruleTitles" | "ruleDescriptions" | "ruleHeadings" | "ruleContent" | "ruleImages" | "ruleIndexing" | "ruleRobots" | "ruleUrls" | "ruleLinks" | "ruleStructured"> = {
  titles: "ruleTitles",
  descriptions: "ruleDescriptions",
  headings: "ruleHeadings",
  content: "ruleContent",
  images: "ruleImages",
  indexing: "ruleIndexing",
  robots: "ruleRobots",
  urls: "ruleUrls",
  links: "ruleLinks",
  structured: "ruleStructured",
};

const RULE_ORDER: TLensRuleGroup[] = ["titles", "descriptions", "headings", "content", "images", "indexing", "robots", "urls", "links", "structured"];

const TILE_TONE = {
  danger: { well: "bg-destructive/15", icon: "text-destructive", color: "var(--destructive)" },
  warning: { well: "bg-warning/15", icon: "text-warning", color: "var(--warning)" },
  muted: { well: "bg-bg-hover", icon: "text-text-secondary", color: "var(--text-muted)" },
  brand: { well: "bg-brand/15", icon: "text-brand", color: "var(--brand)" },
} as const;

const PANEL_TONE = {
  neutral: { box: "border-border bg-text-primary/[0.03] dark:border-text-primary/35", well: "bg-bg-hover", icon: "text-text-secondary", label: "text-text-primary" },
  info: { box: "border-status-invited/40 bg-status-invited/[0.06]", well: "bg-status-invited/15", icon: "text-status-invited", label: "text-status-invited" },
  warn: { box: "border-warning/40 bg-warning/[0.06]", well: "bg-warning/15", icon: "text-warning", label: "text-warning" },
  brand: { box: "border-brand/50 bg-brand/[0.07]", well: "bg-brand/20", icon: "text-brand", label: "text-brand" },
} as const;

function formatDay(iso: string, locale: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** Stat tile: label and figure first, then a trend wave in the tile colour. Caption says what the wave shows. */
function StatTile({ icon: Icon, label, value, tone, trend, caption }: {
  icon: typeof Icons.alert;
  label: string;
  value: number;
  tone: keyof typeof TILE_TONE;
  trend: number[];
  caption: string;
}) {
  const c = TILE_TONE[tone];
  return (
    <div className="flex min-h-[9.5rem] flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-text-primary/[0.03] p-4 shadow-sm dark:border-text-primary/35">
      <div className="flex items-center gap-3">
        <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-xl", c.well)}>
          <Icon className={cn("size-4", c.icon)} aria-hidden />
        </span>
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      </div>
      <span className="text-3xl font-semibold tabular-nums leading-none text-text-primary">{value}</span>
      <div className="mt-auto flex flex-col gap-1">
        <LensWave values={trend} color={c.color} />
        <span className="text-xs text-text-muted">{caption}</span>
      </div>
    </div>
  );
}

/**
 * All Issues: the SEO command center for current open issues.
 * Filters, sort and view state come from the URL (see LensSection). Resolved issues belong in History.
 */
export function LensIssues({ data, t, locale, filters, onFilterChange, onNavigate }: {
  data: TLensDemoDashboard;
  t: TLensT;
  locale: string;
  filters: { type: TTypeFilter; severity: TSeverityFilter; rule: TRuleTab; sort: TSortFilter };
  onFilterChange: (key: "type" | "severity" | "rule" | "sort", value: string) => void;
  onNavigate: TNavigate;
}) {
  const { type, severity, rule, sort } = filters;

  const open = useMemo(() => data.issues.filter((i) => i.status === "open"), [data.issues]);

  const counts = useMemo(
    () => ({
      high: open.filter((i) => i.severity === "high").length,
      medium: open.filter((i) => i.severity === "medium").length,
      advisory: open.filter((i) => i.severity === "advisory").length,
      pageIssues: open.reduce((sum, i) => sum + i.affected, 0),
    }),
    [open],
  );

  const rulesPresent = useMemo(() => RULE_ORDER.filter((r) => open.some((i) => i.ruleGroup === r)), [open]);

  const rows = useMemo(() => {
    const filtered = open.filter((issue) => {
      if (severity !== "all" && issue.severity !== severity) return false;
      if (type !== "all" && issue.group !== type) return false;
      if (rule !== "all" && issue.ruleGroup !== rule) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "pages") return b.affected - a.affected || SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.affected - a.affected;
    });
  }, [open, severity, type, rule, sort]);

  const ruleOptions = [
    { value: "all", label: `${t("filterAll")} (${open.length})` },
    ...rulesPresent.map((r) => ({ value: r, label: `${t(RULE_LABEL_KEY[r])} (${open.filter((i) => i.ruleGroup === r).length})` })),
  ];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
            <Icons.list className="size-4 text-brand" aria-hidden />
          </span>
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-text-primary">{t("seoAllIssues")}</h2>
            <span className="text-sm text-text-muted">
              {t("openIssuesCount", { count: open.length })} · {t("lastCheckedShort", { time: formatWhen(data.lastCheckAt, locale) })}
            </span>
          </div>
        </div>
        {data.seo.partial ? (
          <div className="flex items-center gap-2 rounded-full border border-warning/40 bg-warning/[0.06] px-4 py-2 text-sm text-text-secondary">
            <LensPill tone="warning">{t("partialScan")}</LensPill>
            {t("partialNotice", { checked: data.seo.checked, known: data.seo.known })}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon={Icons.alert} label={t("tileHigh")} value={counts.high} tone="danger" trend={[2, 3, 2, 4, 3, 5, counts.high]} caption={t("trendCaption")} />
        <StatTile icon={Icons.alert} label={t("tileMedium")} value={counts.medium} tone="warning" trend={[4, 6, 5, 7, 6, 8, counts.medium]} caption={t("trendCaption")} />
        <StatTile icon={Icons.sparkles} label={t("tileAdvisory")} value={counts.advisory} tone="muted" trend={[3, 2, 4, 3, 3, 4, counts.advisory]} caption={t("trendCaption")} />
        <StatTile icon={Icons.grid} label={t("pageIssues")} value={counts.pageIssues} tone="brand" trend={[20, 24, 22, 28, 26, 30, counts.pageIssues]} caption={t("trendCaption")} />
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <LensNavBar<TTypeFilter>
          label={t("filterType")}
          value={type}
          onChange={(v) => onFilterChange("type", v)}
          items={[
            { id: "all", label: t("seoAllIssues"), icon: Icons.list, count: open.length },
            { id: "onpage", label: t("linkOnpage"), icon: Icons.file, count: open.filter((i) => i.group === "onpage").length },
            { id: "technical", label: t("linkTechnical"), icon: Icons.wrench, count: open.filter((i) => i.group === "technical").length },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <TableListSort label={t("filterRule")} value={rule} onChange={(v) => onFilterChange("rule", v)} options={ruleOptions} />
          <TableListSort
            label={t("filterSeverity")}
            value={severity}
            onChange={(v) => onFilterChange("severity", v)}
            options={[
              { value: "all", label: t("filterAll") },
              { value: "high", label: t("severityHigh") },
              { value: "medium", label: t("severityMedium") },
              { value: "advisory", label: t("severityAdvisory") },
            ]}
          />
          <TableListSort
            label={t("sortBy")}
            value={sort}
            onChange={(v) => onFilterChange("sort", v)}
            options={[
              { value: "severity", label: t("sortSeverity") },
              { value: "pages", label: t("sortPages") },
            ]}
          />
        </div>
      </div>

      {open.length === 0 ? (
        <LensEmpty>{t("allClear")}</LensEmpty>
      ) : (
        <>
          <IssueSummary rows={rows} t={t} />
          <p className="-mb-2 text-sm text-text-muted">{t("showingIssues", { shown: rows.length, total: open.length })}</p>
          {rows.length === 0 ? (
            <LensEmpty>{t("noIssuesMatch")}</LensEmpty>
          ) : (
            <ul className="flex flex-col gap-5">
              {rows.map((issue) => (
                <IssueCard key={issue.id} issue={issue} t={t} locale={locale} onNavigate={onNavigate} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/** Compact list of the filtered issues. Each row jumps to its card, so long lists stay easy to scan. */
function IssueSummary({ rows, t }: { rows: TLensDemoIssue[]; t: TLensT }) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border p-2 dark:border-text-primary/35">
      <span className="px-3 pb-1 pt-2 text-xs font-medium text-text-muted">{t("issueSummary")}</span>
      <ul className="flex flex-col">
        {rows.map((issue) => (
          <li key={issue.id}>
            <a
              href={`#issue-${issue.id}`}
              className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-bg-hover"
            >
              <LensPill tone={severityTone(issue.severity)}>{t(severityLabel(issue.severity))}</LensPill>
              <span className="min-w-0 flex-1 truncate font-medium text-text-primary">{issue.title}</span>
              <span className="tabular-nums text-text-secondary">{t("pagesCount", { count: issue.affected })}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One issue. Header, affected pages, four panels, footer. Details (tracking and history) open on demand. */
export function IssueCard({ issue, t, locale, onNavigate, compact = false }: { issue: TLensDemoIssue; t: TLensT; locale: string; onNavigate: TNavigate; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const scored = issue.severity !== "advisory";
  const tracking = issue.tracking;

  return (
    <li id={`issue-${issue.id}`} className="flex scroll-mt-24 flex-col gap-6 rounded-3xl border border-border p-5 shadow-(--shadow) sm:p-7 dark:border-text-primary/40">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <LensPill tone={severityTone(issue.severity)}>{t(severityLabel(issue.severity))}</LensPill>
            <Tag>{issue.group === "onpage" ? t("typeOnpage") : t("typeTechnical")}</Tag>
            <Tag>{t(RULE_LABEL_KEY[issue.ruleGroup])}</Tag>
          </div>
          <h3 className="text-xl font-semibold leading-snug text-text-primary">{issue.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-text-primary/[0.03] px-4 py-2 shadow-sm dark:border-text-primary/35">
          <Icons.globe className="size-4 text-text-muted" aria-hidden />
          <span className="text-xl font-semibold tabular-nums text-text-primary">{issue.affected}</span>
          <span className="text-sm text-text-muted">{t("pagesUnit")}</span>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-text-primary/[0.03] p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center dark:border-text-primary/35">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-brand/15">
            <Icons.file className="size-4 text-brand" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-text-primary">{t("issuePages")}</span>
        </div>
        <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {issue.pages.map((url) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => onNavigate("pages", { page: url, issue: issue.id })}
                className="rounded-full border border-border px-3 py-1 font-mono text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary"
              >
                {url}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onNavigate("pages", { issue: issue.id })}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          {t("viewAllPages")}
          <Icons.arrowRight className="size-3.5" aria-hidden />
        </button>
      </div>

      <div className={cn("grid gap-4 sm:grid-cols-2", !compact && "xl:grid-cols-4")}>
        <Panel icon={Icons.search} label={t("issueFound")} tone="info">{issue.found}</Panel>
        <Panel icon={Icons.alert} label={t("issueWhy")} tone="warn">{issue.why}</Panel>
        <Panel icon={Icons.bulb} label={t("howToFix")} tone="brand">{issue.fix}</Panel>
        <Panel icon={Icons.sparkles} label={t("aiSuggestion")} note={t("aiSuggestionNote")}>{issue.aiSuggestion}</Panel>
      </div>

      <footer className="flex flex-col gap-4 border-t border-border/70 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <Icons.chartBar className="size-4 text-text-secondary" aria-hidden />
              {scored ? t("scoreCounted") : t("scoreNotCounted")}
            </span>
            <span className="inline-flex items-center gap-2">
              <Icons.settings className="size-4 text-text-secondary" aria-hidden />
              {t("effortLabel")}: {t(EFFORT_KEY[tracking.effort])}
            </span>
            <span className="inline-flex items-center gap-2">
              <Icons.clock className="size-4 text-text-secondary" aria-hidden />
              {t("firstSeen")}: {formatDay(tracking.firstSeen, locale)}
            </span>
          </div>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-brand/50"
          >
            <Icons.linkSquare className="size-4" aria-hidden />
            {open ? t("hideDetails") : t("openIssueDetails")}
          </button>
        </div>

        {open ? (
          <div className="grid gap-5 rounded-2xl border border-border bg-text-primary/[0.03] p-4 sm:p-5 lg:grid-cols-2 dark:border-text-primary/35">
            <div className="flex flex-col gap-4">
              <DetailRow label={t("statusLabel")}>
                <LensPill tone={issue.status === "open" ? "danger" : "success"}>
                  {issue.status === "open" ? t("stillOpen") : t("statusResolved")}
                </LensPill>
              </DetailRow>
              <DetailRow label={t("firstSeen")}>
                <span className="text-sm text-text-primary">{formatDay(tracking.firstSeen, locale)}</span>
              </DetailRow>
              <button
                type="button"
                onClick={() => onNavigate("history")}
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-brand hover:underline"
              >
                {t("viewInHistory")}
                <Icons.arrowRight className="size-3.5" aria-hidden />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium text-text-muted">{t("timeline")}</span>
              <ol className="flex flex-col gap-3">
                {tracking.events.map((event) => (
                  <li key={`${event.date}-${event.text}`} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden />
                    <div className="flex flex-col">
                      <span className="text-text-primary">{event.text}</span>
                      <span className="text-xs text-text-muted">{formatDay(event.date, locale)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </footer>
    </li>
  );
}

const EFFORT_KEY = { low: "effortLow", medium: "effortMedium", high: "effortHigh" } as const;

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      {children}
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-border bg-text-primary/[0.03] px-3 py-1 text-sm font-medium text-text-secondary dark:border-text-primary/35">
      {children}
    </span>
  );
}

/** Equal-size panel used for the four blocks of an issue. */
function Panel({ icon: Icon, label, children, tone = "neutral", note }: {
  icon: typeof Icons.alert;
  label: string;
  children: React.ReactNode;
  tone?: keyof typeof PANEL_TONE;
  note?: string;
}) {
  const c = PANEL_TONE[tone];
  return (
    <div className={cn("flex min-h-[10rem] flex-col gap-3 rounded-2xl border p-4 shadow-sm backdrop-blur-sm sm:p-5", c.box)}>
      <div className="flex items-center gap-3">
        <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-xl", c.well)}>
          <Icon className={cn("size-4", c.icon)} aria-hidden />
        </span>
        <span className={cn("text-sm font-semibold", c.label)}>{label}</span>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{children}</p>
      {note ? <p className="mt-auto text-xs text-text-muted">{note}</p> : null}
    </div>
  );
}

export function severityLabel(severity: TLensSeverity) {
  return severity === "high" ? "severityHigh" : severity === "medium" ? "severityMedium" : "severityAdvisory";
}

