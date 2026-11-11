"use client";

import { useMemo, useState } from "react";

import { formatWhen, type TLensT } from "@/components/lens/lens-overview";
import { LENS_FLOAT_CARD, LensCardHeader, LensEmpty, LensPill, severityTone, type TLensSeverity } from "@/components/lens/lens-ui";
import { Input } from "@/components/ui/input";
import type { TLensDemoDashboard, TLensDemoIssue, TLensGroup, TLensRuleGroup } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

type TSeverityFilter = "all" | TLensSeverity;
type TTypeFilter = "all" | TLensGroup;
type TStatusFilter = "open" | "resolved" | "all";
type TSort = "severity" | "pages" | "title";

const SEVERITY_RANK: Record<TLensSeverity, number> = { high: 3, medium: 2, advisory: 1 };

const RULE_LABEL_KEY: Record<TLensRuleGroup, string> = {
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

/** Chip used for every filter. Active chips use the brand tint; inactive chips stay quiet. */
function FilterChip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: string; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200",
        active
          ? "border-brand/60 bg-brand/15 text-text-primary"
          : "border-border text-text-secondary hover:border-text-primary/40 hover:text-text-primary",
      )}
    >
      {children}
      {count != null ? <span className={cn("tabular-nums", active ? "text-text-primary" : "text-text-muted")}>{count}</span> : null}
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-16 shrink-0 text-xs font-medium text-text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/**
 * All Issues: the SEO command center. One card, filters for severity, type, rule and status,
 * search and sort. Every issue shows its "How to Fix" line; details expand on demand.
 */
export function LensIssues({ data, t, locale, presetType }: {
  data: TLensDemoDashboard;
  t: TLensT;
  locale: string;
  presetType: TTypeFilter;
}) {
  const [severity, setSeverity] = useState<TSeverityFilter>("all");
  const [type, setType] = useState<TTypeFilter>(presetType);
  const [rule, setRule] = useState<TLensRuleGroup | "all">("all");
  const [status, setStatus] = useState<TStatusFilter>("open");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TSort>("severity");

  const counts = useMemo(() => {
    const open = data.issues.filter((i) => i.status === "open");
    return {
      high: open.filter((i) => i.severity === "high").length,
      medium: open.filter((i) => i.severity === "medium").length,
      advisory: open.filter((i) => i.severity === "advisory").length,
      open: open.length,
      pages: open.reduce((sum, i) => sum + i.affected, 0),
    };
  }, [data.issues]);

  const rulesPresent = useMemo(() => RULE_ORDER.filter((r) => data.issues.some((i) => i.ruleGroup === r)), [data.issues]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = data.issues.filter((issue) => {
      if (status !== "all" && issue.status !== status) return false;
      if (severity !== "all" && issue.severity !== severity) return false;
      if (type !== "all" && issue.group !== type) return false;
      if (rule !== "all" && issue.ruleGroup !== rule) return false;
      if (q) {
        const haystack = [issue.title, issue.action, issue.found, ...issue.pages].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "pages") return b.affected - a.affected || SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      if (sort === "title") return a.title.localeCompare(b.title, locale);
      return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.affected - a.affected;
    });
  }, [data.issues, status, severity, type, rule, query, sort, locale]);

  const total = data.issues.filter((i) => i.status === status || status === "all").length;

  return (
    <section className={cn(LENS_FLOAT_CARD, "gap-6 p-6 sm:p-7")}>
      <LensCardHeader
        icon={Icons.list}
        title={t("seoAllIssues")}
        action={<LensPill tone="brand">{t("openIssuesCount", { count: counts.open })}</LensPill>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([
          { id: "high", label: t("severityHigh"), value: counts.high, tone: "danger" },
          { id: "medium", label: t("severityMedium"), value: counts.medium, tone: "warning" },
          { id: "advisory", label: t("severityAdvisory"), value: counts.advisory, tone: "muted" },
          { id: "pages", label: t("pageIssues"), value: counts.pages, tone: "brand" },
        ] as const).map((item) => (
          <div key={item.id} className="flex flex-col gap-1 rounded-2xl border border-border px-4 py-3">
            <span className="text-xs text-text-muted">{item.label}</span>
            <span className="text-2xl font-semibold tabular-nums text-text-primary">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border p-4">
        <FilterRow label={t("filterSeverity")}>
          <FilterChip active={severity === "all"} onClick={() => setSeverity("all")}>{t("filterAll")}</FilterChip>
          <FilterChip active={severity === "high"} onClick={() => setSeverity("high")} count={counts.high}>{t("severityHigh")}</FilterChip>
          <FilterChip active={severity === "medium"} onClick={() => setSeverity("medium")} count={counts.medium}>{t("severityMedium")}</FilterChip>
          <FilterChip active={severity === "advisory"} onClick={() => setSeverity("advisory")} count={counts.advisory}>{t("severityAdvisory")}</FilterChip>
        </FilterRow>
        <FilterRow label={t("filterType")}>
          <FilterChip active={type === "all"} onClick={() => setType("all")}>{t("filterAll")}</FilterChip>
          <FilterChip active={type === "onpage"} onClick={() => setType("onpage")}>{t("typeOnpage")}</FilterChip>
          <FilterChip active={type === "technical"} onClick={() => setType("technical")}>{t("typeTechnical")}</FilterChip>
        </FilterRow>
        <FilterRow label={t("filterRule")}>
          <FilterChip active={rule === "all"} onClick={() => setRule("all")}>{t("filterAll")}</FilterChip>
          {rulesPresent.map((r) => (
            <FilterChip
              key={r}
              active={rule === r}
              onClick={() => setRule(r)}
              count={data.issues.filter((i) => i.ruleGroup === r && i.status === "open").length}
            >
              {t(RULE_LABEL_KEY[r] as "ruleTitles")}
            </FilterChip>
          ))}
        </FilterRow>
        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 md:flex-row md:items-center md:justify-between">
          <FilterRow label={t("filterStatus")}>
            <FilterChip active={status === "open"} onClick={() => setStatus("open")}>{t("statusOpen")}</FilterChip>
            <FilterChip active={status === "resolved"} onClick={() => setStatus("resolved")}>{t("statusResolved")}</FilterChip>
            <FilterChip active={status === "all"} onClick={() => setStatus("all")}>{t("statusAll")}</FilterChip>
          </FilterRow>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchIssues")}
              aria-label={t("searchIssues")}
              className="h-9 rounded-full sm:w-64"
            />
            <label className="flex items-center gap-2 text-xs text-text-muted">
              {t("sortBy")}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as TSort)}
                className="h-9 rounded-full border border-border bg-transparent px-3 text-xs text-text-primary"
              >
                <option value="severity">{t("sortSeverity")}</option>
                <option value="pages">{t("sortPages")}</option>
                <option value="title">{t("sortTitle")}</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <p className="-mb-2 text-xs text-text-muted">{t("showingIssues", { shown: rows.length, total })}</p>

      {rows.length === 0 ? (
        <LensEmpty>{t("noIssuesMatch")}</LensEmpty>
      ) : (
        <ul className="flex flex-col divide-y divide-border/60">
          {rows.map((issue) => (
            <IssueRow key={issue.id} issue={issue} t={t} locale={locale} />
          ))}
        </ul>
      )}
    </section>
  );
}

function IssueRow({ issue, t, locale }: { issue: TLensDemoIssue; t: TLensT; locale: string }) {
  const [open, setOpen] = useState(false);
  const resolved = issue.status === "resolved";
  return (
    <li className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <LensPill tone={resolved ? "success" : severityTone(issue.severity)}>
          {resolved ? t("statusResolved") : t(severityLabel(issue.severity))}
        </LensPill>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-secondary">
          {issue.group === "onpage" ? t("typeOnpage") : t("typeTechnical")}
        </span>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-secondary">
          {t(RULE_LABEL_KEY[issue.ruleGroup] as "ruleTitles")}
        </span>
        {resolved && issue.resolvedOn ? (
          <span className="text-xs text-text-muted">{t("resolvedOn", { date: formatWhen(`${issue.resolvedOn}T00:00:00Z`, locale).split(",")[0] })}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-base font-semibold text-text-primary">{issue.title}</h3>
          <p className="text-sm text-text-secondary">{issue.found}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {resolved ? null : <span className="text-sm tabular-nums text-text-secondary">{t("pagesCount", { count: issue.affected })}</span>}
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-text-primary/40 hover:text-text-primary"
          >
            {open ? t("hideDetails") : t("viewDetails")}
            <Icons.arrowRight className={cn("size-3.5 transition-transform duration-200", open && "rotate-90")} aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
        <Icons.bulb className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-semibold text-text-primary">{t("howToFix")}</span>
          <span className="text-sm text-text-secondary">{issue.fix}</span>
        </div>
      </div>

      {open ? (
        <div className="grid gap-4 md:grid-cols-2">
          <DetailBlock label={t("issueWhy")} text={issue.why} />
          <DetailBlock label={t("issueVerify")} text={issue.verify} />
          {issue.pages.length > 0 ? (
            <div className="flex flex-col gap-2 md:col-span-2">
              <span className="text-xs font-medium text-text-muted">{t("issuePages")}</span>
              <ul className="flex flex-wrap gap-1.5">
                {issue.pages.map((url) => (
                  <li key={url} className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-text-secondary">{url}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function DetailBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}

function severityLabel(severity: TLensSeverity) {
  return severity === "high" ? "severityHigh" : severity === "medium" ? "severityMedium" : "severityAdvisory";
}
