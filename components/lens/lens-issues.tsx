"use client";

import { useMemo, useState } from "react";

import type { TLensT } from "@/components/lens/lens-overview";
import { TableListSort } from "@/components/table/table-list-sort";
import { LENS_FLOAT_CARD, LensCardHeader, LensEmpty, LensPill, LensTabs, severityTone, type TLensSeverity } from "@/components/lens/lens-ui";
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

function StatTile({ icon: Icon, label, value, tone }: { icon: typeof Icons.alert; label: string; value: number; tone: "danger" | "warning" | "muted" | "brand" }) {
  const iconClass = { danger: "text-destructive", warning: "text-warning", muted: "text-text-muted", brand: "text-brand" }[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3.5">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-hover/60">
        <Icon className={cn("size-4", iconClass)} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-2xl font-semibold tabular-nums leading-tight text-text-primary">{value}</span>
      </div>
    </div>
  );
}

/**
 * All Issues: the SEO command center for current open issues.
 * Rule tabs, severity and type chips, sort. Resolved issues are not shown here (they belong in History).
 */
export function LensIssues({ data, t, presetType }: {
  data: TLensDemoDashboard;
  t: TLensT;
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
    <section className={cn(LENS_FLOAT_CARD, "gap-6 p-6 sm:p-7")}>
      <LensCardHeader
        icon={Icons.list}
        title={t("seoAllIssues")}
        action={<LensPill tone="brand">{t("openIssuesCount", { count: open.length })}</LensPill>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon={Icons.alert} label={t("severityHigh")} value={counts.high} tone="danger" />
        <StatTile icon={Icons.alert} label={t("severityMedium")} value={counts.medium} tone="warning" />
        <StatTile icon={Icons.sparkles} label={t("severityAdvisory")} value={counts.advisory} tone="muted" />
        <StatTile icon={Icons.grid} label={t("pageIssues")} value={counts.pageIssues} tone="brand" />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <LensTabs<TTypeFilter>
            label={t("filterType")}
            value={type}
            onChange={setType}
            items={[
              { id: "all", label: t("filterAll"), count: open.length },
              { id: "onpage", label: t("typeOnpage"), count: open.filter((i) => i.group === "onpage").length },
              { id: "technical", label: t("typeTechnical"), count: open.filter((i) => i.group === "technical").length },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
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
        </div>
        <LensTabs<TRuleTab> label={t("filterRule")} value={rule} onChange={setRule} items={ruleItems} />
      </div>

      <p className="-mb-2 text-sm text-text-muted">{t("showingIssues", { shown: rows.length, total: open.length })}</p>

      {rows.length === 0 ? (
        <LensEmpty>{t("noIssuesMatch")}</LensEmpty>
      ) : (
        <ul className="flex flex-col gap-5">
          {rows.map((issue) => (
            <IssueCard key={issue.id} issue={issue} t={t} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** One issue. Header, then findings and fix side by side, then verification. Every section is always visible. */
function IssueCard({ issue, t }: { issue: TLensDemoIssue; t: TLensT }) {
  return (
    <li className="flex flex-col gap-5 rounded-2xl border border-border p-5 sm:p-6 dark:border-text-primary/40">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <LensPill tone={severityTone(issue.severity)}>{t(severityLabel(issue.severity))}</LensPill>
            <span className="rounded-full bg-bg-hover px-3 py-1 text-xs font-medium text-text-secondary">
              {issue.group === "onpage" ? t("typeOnpage") : t("typeTechnical")}
            </span>
            <span className="rounded-full bg-bg-hover px-3 py-1 text-xs font-medium text-text-secondary">
              {t(RULE_LABEL_KEY[issue.ruleGroup])}
            </span>
          </div>
          <h3 className="text-lg font-semibold leading-snug text-text-primary">{issue.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border px-4 py-2.5">
          <Icons.globe className="size-4 text-text-muted" aria-hidden />
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums leading-none text-text-primary">{issue.affected}</span>
            <span className="text-xs text-text-muted">{t("pagesUnit")}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Section icon={Icons.search} label={t("issueFound")} text={issue.found} />
          <Section icon={Icons.alert} label={t("issueWhy")} text={issue.why} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-brand/40 bg-brand/5 p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-brand/15">
                <Icons.bulb className="size-4 text-brand" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-brand">{t("howToFix")}</span>
            </div>
            <p className="text-sm leading-relaxed text-text-primary">{issue.fix}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-border p-4">
            <span className="flex items-center gap-2 text-xs font-medium text-text-muted">
              <Icons.globe className="size-3.5" aria-hidden />
              {t("issuePages")}
            </span>
            <ul className="flex flex-wrap gap-1.5">
              {issue.pages.map((url) => (
                <li key={url} className="rounded-full bg-bg-hover px-2.5 py-1 font-mono text-xs text-text-secondary">{url}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </li>
  );
}

function Section({ icon: Icon, label, text }: { icon: typeof Icons.alert; label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2 text-xs font-medium text-text-muted">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </span>
      <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}

function severityLabel(severity: TLensSeverity) {
  return severity === "high" ? "severityHigh" : severity === "medium" ? "severityMedium" : "severityAdvisory";
}
