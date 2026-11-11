"use client";

import { useMemo, useState } from "react";

import { formatWhen, type TLensT } from "@/components/lens/lens-overview";
import { TableListSort } from "@/components/table/table-list-sort";
import { LENS_FLOAT_CARD, LensEmpty, LensNavBar, LensPill, LensTabs, LensWave, severityTone, type TLensSeverity } from "@/components/lens/lens-ui";
import type { TLensDemoDashboard, TLensDemoIssue, TLensGroup, TLensRuleGroup } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

type TSeverityFilter = "all" | TLensSeverity;
type TTypeFilter = "all" | TLensGroup;
type TRuleTab = "all" | TLensRuleGroup;

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

/** Severity stat tile: icon, label, figure, and a trend wave in the tile colour (decorative, dummy data). */
function StatTile({ icon: Icon, label, value, tone, trend }: {
  icon: typeof Icons.alert;
  label: string;
  value: number;
  tone: keyof typeof TILE_TONE;
  trend: number[];
}) {
  const c = TILE_TONE[tone];
  return (
    <div className="relative flex min-h-[8.5rem] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-text-primary/[0.03] p-4 shadow-sm dark:border-text-primary/35">
      <div className="flex items-center gap-3">
        <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-xl", c.well)}>
          <Icon className={cn("size-4", c.icon)} aria-hidden />
        </span>
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      </div>
      <span className="relative text-3xl font-semibold tabular-nums leading-none text-text-primary">{value}</span>
      <LensWave values={trend} color={c.color} />
    </div>
  );
}

/**
 * All Issues: the SEO command center for current open issues.
 * Rule tabs, severity and type chips, sort. Resolved issues are not shown here (they belong in History).
 */
export function LensIssues({ data, t, locale, presetType }: {
  data: TLensDemoDashboard;
  t: TLensT;
  locale: string;
  presetType: TTypeFilter;
}) {
  const [severity, setSeverity] = useState<TSeverityFilter>("all");
  const [type, setType] = useState<TTypeFilter>(presetType);
  const [rule, setRule] = useState<TRuleTab>("all");

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
    return [...filtered].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.affected - a.affected);
  }, [open, severity, type, rule]);

  const ruleItems = [
    { id: "all" as const, label: t("filterAll"), count: open.length },
    ...rulesPresent.map((r) => ({
      id: r,
      label: t(RULE_LABEL_KEY[r]),
      count: open.filter((i) => i.ruleGroup === r).length,
    })),
  ];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
            <Icons.list className="size-4 text-brand" aria-hidden />
          </span>
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-text-primary">{t("seoAllIssues")}</h2>
            <span className="text-sm text-text-muted">{t("openIssuesCount", { count: open.length })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon={Icons.alert} label={t("tileHigh")} value={counts.high} tone="danger" trend={[2, 3, 2, 4, 3, 5, counts.high]} />
        <StatTile icon={Icons.alert} label={t("tileMedium")} value={counts.medium} tone="warning" trend={[4, 6, 5, 7, 6, 8, counts.medium]} />
        <StatTile icon={Icons.sparkles} label={t("tileAdvisory")} value={counts.advisory} tone="muted" trend={[3, 2, 4, 3, 3, 4, counts.advisory]} />
        <StatTile icon={Icons.grid} label={t("pageIssues")} value={counts.pageIssues} tone="brand" trend={[20, 24, 22, 28, 26, 30, counts.pageIssues]} />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <LensNavBar<TTypeFilter>
          label={t("filterType")}
          value={type}
          onChange={setType}
          items={[
            { id: "all", label: t("seoAllIssues"), icon: Icons.list, count: open.length },
            { id: "onpage", label: t("linkOnpage"), icon: Icons.file, count: open.filter((i) => i.group === "onpage").length },
            { id: "technical", label: t("linkTechnical"), icon: Icons.wrench, count: open.filter((i) => i.group === "technical").length },
          ]}
        />
        <TableListSort
          label={t("filterSeverity")}
          value={severity}
          onChange={(v) => setSeverity(v as TSeverityFilter)}
          options={[
            { value: "all", label: t("filterAll") },
            { value: "high", label: t("severityHigh") },
            { value: "medium", label: t("severityMedium") },
            { value: "advisory", label: t("severityAdvisory") },
          ]}
        />
      </div>

      <LensTabs<TRuleTab> label={t("filterRule")} value={rule} onChange={setRule} items={ruleItems} />

      <p className="-mb-2 text-sm text-text-muted">{t("showingIssues", { shown: rows.length, total: open.length })}</p>

      {rows.length === 0 ? (
        <LensEmpty>{t("noIssuesMatch")}</LensEmpty>
      ) : (
        <ul className="flex flex-col gap-5">
          {rows.map((issue) => (
            <IssueCard key={issue.id} issue={issue} t={t} locale={locale} lastCheckAt={data.lastCheckAt} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** One issue, laid out like the reference: header with count, affected pages strip, four equal panels, footer. */
function IssueCard({ issue, t, locale, lastCheckAt }: { issue: TLensDemoIssue; t: TLensT; locale: string; lastCheckAt: string }) {
  const scored = issue.severity !== "advisory";
  return (
    <li className={cn(LENS_FLOAT_CARD, "gap-6 p-5 sm:p-7")}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <LensPill tone={severityTone(issue.severity)}>{t(severityLabel(issue.severity))}</LensPill>
            <Tag>{issue.group === "onpage" ? t("typeOnpage") : t("typeTechnical")}</Tag>
            <Tag>{t(RULE_LABEL_KEY[issue.ruleGroup])}</Tag>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold leading-snug text-text-primary">{issue.title}</h3>
            <p className="text-sm text-text-secondary">{issue.found}</p>
          </div>
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
            <li key={url} className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-text-secondary">{url}</li>
          ))}
        </ul>
        <button type="button" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline">
          {t("viewAllPages")}
          <Icons.arrowRight className="size-3.5" aria-hidden />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel icon={Icons.search} label={t("issueFound")} tone="info">{issue.found}</Panel>
        <Panel icon={Icons.alert} label={t("issueWhy")} tone="warn">{issue.why}</Panel>
        <Panel icon={Icons.bulb} label={t("howToFix")} tone="brand">{issue.fix}</Panel>
        <Panel icon={Icons.sparkles} label={t("aiSuggestion")}>{issue.aiSuggestion}</Panel>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted">
          <span className="inline-flex items-center gap-2">
            <Icons.chartBar className="size-4 text-text-secondary" aria-hidden />
            {scored ? t("severityImpact") : t("advisoryNoImpact")}
          </span>
          <span className="inline-flex items-center gap-2">
            <Icons.clock className="size-4 text-text-secondary" aria-hidden />
            {t("lastCheck")} {formatWhen(lastCheckAt, locale)}
          </span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-brand/50"
        >
          <Icons.linkSquare className="size-4" aria-hidden />
          {t("openIssueDetails")}
        </button>
      </footer>
    </li>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-border bg-text-primary/[0.03] px-3 py-0.5 text-xs font-medium text-text-secondary dark:border-text-primary/35">
      {children}
    </span>
  );
}

/** Equal-size panel used for the four blocks of an issue. */
const PANEL_TONE = {
  neutral: { box: "border-border bg-text-primary/[0.03] dark:border-text-primary/35", well: "bg-bg-hover", icon: "text-text-secondary", label: "text-text-primary" },
  info: { box: "border-status-invited/40 bg-status-invited/[0.06]", well: "bg-status-invited/15", icon: "text-status-invited", label: "text-status-invited" },
  warn: { box: "border-warning/40 bg-warning/[0.06]", well: "bg-warning/15", icon: "text-warning", label: "text-warning" },
  brand: { box: "border-brand/50 bg-brand/[0.07]", well: "bg-brand/20", icon: "text-brand", label: "text-brand" },
} as const;

function Panel({ icon: Icon, label, children, tone = "neutral" }: {
  icon: typeof Icons.alert;
  label: string;
  children: React.ReactNode;
  tone?: keyof typeof PANEL_TONE;
}) {
  const c = PANEL_TONE[tone];
  return (
    <div className={cn("flex min-h-[9.5rem] flex-col gap-3 rounded-2xl border p-4 shadow-sm backdrop-blur-sm sm:p-5", c.box)}>
      <div className="flex items-center gap-3">
        <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-xl", c.well)}>
          <Icon className={cn("size-4", c.icon)} aria-hidden />
        </span>
        <span className={cn("text-sm font-semibold", c.label)}>{label}</span>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{children}</p>
    </div>
  );
}

function severityLabel(severity: TLensSeverity) {
  return severity === "high" ? "severityHigh" : severity === "medium" ? "severityMedium" : "severityAdvisory";
}
