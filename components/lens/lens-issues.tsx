"use client";

import { useMemo, useState } from "react";

import type { TLensT } from "@/components/lens/lens-overview";
import { LENS_FLOAT_CARD, LensCardHeader, LensEmpty, LensPill, LensTabs, severityTone, type TLensSeverity } from "@/components/lens/lens-ui";
import type { TLensDemoDashboard, TLensDemoIssue, TLensGroup, TLensRuleGroup } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

type TSeverityFilter = "all" | TLensSeverity;
type TTypeFilter = "all" | TLensGroup;
type TRuleTab = "all" | TLensRuleGroup;
type TSort = "severity" | "pages" | "title";

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

/** Filter chip: severity and type. Active chip uses the brand tint. */
function FilterChip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: string; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200",
        active
          ? "border-brand/60 bg-brand/15 text-text-primary"
          : "border-border text-text-secondary hover:border-text-primary/40 hover:text-text-primary",
      )}
    >
      {children}
      {count != null ? <span className={cn("tabular-nums text-xs", active ? "text-text-primary" : "text-text-muted")}>{count}</span> : null}
    </button>
  );
}

/**
 * All Issues: the SEO command center for current open issues. Rules are tabs; severity and type are chips.
 * Resolved issues are not shown here. They belong in History.
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
  const [sort, setSort] = useState<TSort>("severity");

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
      if (sort === "title") return a.title.localeCompare(b.title, locale);
      return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.affected - a.affected;
    });
  }, [open, severity, type, rule, sort, locale]);

  const ruleItems = [
    { id: "all" as const, label: `${t("filterAll")} (${open.length})` },
    ...rulesPresent.map((r) => ({
      id: r,
      label: `${t(RULE_LABEL_KEY[r])} (${open.filter((i) => i.ruleGroup === r).length})`,
    })),
  ];

  return (
    <section className={cn(LENS_FLOAT_CARD, "gap-6 p-6 sm:p-7")}>
      <LensCardHeader
        icon={Icons.list}
        title={t("seoAllIssues")}
        action={<LensPill tone="brand">{t("openIssuesCount", { count: open.length })}</LensPill>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([
          { id: "high", label: t("severityHigh"), value: counts.high },
          { id: "medium", label: t("severityMedium"), value: counts.medium },
          { id: "advisory", label: t("severityAdvisory"), value: counts.advisory },
          { id: "pages", label: t("pageIssues"), value: counts.pageIssues },
        ] as const).map((item) => (
          <div key={item.id} className="flex flex-col gap-1 rounded-2xl border border-border px-4 py-3">
            <span className="text-xs text-text-muted">{item.label}</span>
            <span className="text-2xl font-semibold tabular-nums text-text-primary">{item.value}</span>
          </div>
        ))}
      </div>

      <LensTabs<TRuleTab> label={t("filterRule")} value={rule} onChange={setRule} items={ruleItems} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={severity === "all"} onClick={() => setSeverity("all")}>{t("filterAll")}</FilterChip>
          <FilterChip active={severity === "high"} onClick={() => setSeverity("high")} count={counts.high}>{t("severityHigh")}</FilterChip>
          <FilterChip active={severity === "medium"} onClick={() => setSeverity("medium")} count={counts.medium}>{t("severityMedium")}</FilterChip>
          <FilterChip active={severity === "advisory"} onClick={() => setSeverity("advisory")} count={counts.advisory}>{t("severityAdvisory")}</FilterChip>
          <span className="mx-1 hidden h-5 w-px bg-border md:inline-block" aria-hidden />
          <FilterChip active={type === "all"} onClick={() => setType("all")}>{t("filterAll")}</FilterChip>
          <FilterChip active={type === "onpage"} onClick={() => setType("onpage")}>{t("typeOnpage")}</FilterChip>
          <FilterChip active={type === "technical"} onClick={() => setType("technical")}>{t("typeTechnical")}</FilterChip>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          {t("sortBy")}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as TSort)}
            className="h-9 rounded-full border border-border bg-transparent px-3 text-sm text-text-primary"
          >
            <option value="severity">{t("sortSeverity")}</option>
            <option value="pages">{t("sortPages")}</option>
            <option value="title">{t("sortTitle")}</option>
          </select>
        </label>
      </div>

      <p className="-mb-2 text-sm text-text-muted">{t("showingIssues", { shown: rows.length, total: open.length })}</p>

      {rows.length === 0 ? (
        <LensEmpty>{t("noIssuesMatch")}</LensEmpty>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((issue) => (
            <IssueCard key={issue.id} issue={issue} t={t} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** One issue as an info box. Every section is visible: nothing is hidden behind a toggle. */
function IssueCard({ issue, t }: { issue: TLensDemoIssue; t: TLensT }) {
  return (
    <li className="flex flex-col gap-5 rounded-2xl border border-border p-5 sm:p-6 dark:border-text-primary/40">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <LensPill tone={severityTone(issue.severity)}>{t(severityLabel(issue.severity))}</LensPill>
            <span className="rounded-full border border-border px-3 py-0.5 text-xs font-medium text-text-secondary">
              {issue.group === "onpage" ? t("typeOnpage") : t("typeTechnical")}
            </span>
            <span className="rounded-full border border-border px-3 py-0.5 text-xs font-medium text-text-secondary">
              {t(RULE_LABEL_KEY[issue.ruleGroup])}
            </span>
          </div>
          <h3 className="text-lg font-semibold leading-snug text-text-primary">{issue.title}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-3xl font-semibold tabular-nums leading-none text-text-primary">{issue.affected}</span>
          <span className="mt-1 text-xs text-text-muted">{t("pagesUnit")}</span>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoBox label={t("issueFound")} text={issue.found} />
        <InfoBox label={t("issueWhy")} text={issue.why} />
      </div>

      <div className="flex gap-4 rounded-xl border border-brand/40 bg-brand/5 p-4">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/15">
          <Icons.bulb className="size-4 text-brand" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-semibold text-brand">{t("howToFix")}</span>
          <p className="text-sm leading-relaxed text-text-primary">{issue.fix}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoBox label={t("issueVerify")} text={issue.verify} />
        <div className="flex flex-col gap-2 rounded-xl border border-border/70 p-4">
          <span className="text-xs font-medium text-text-muted">{t("issuePages")}</span>
          <ul className="flex flex-wrap gap-1.5">
            {issue.pages.map((url) => (
              <li key={url} className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-text-secondary">{url}</li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

function InfoBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border/70 bg-bg-hover/40 p-4">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}

function severityLabel(severity: TLensSeverity) {
  return severity === "high" ? "severityHigh" : severity === "medium" ? "severityMedium" : "severityAdvisory";
}

