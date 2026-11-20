"use client";

import { useMemo, useState } from "react";

import { formatWhen, type TLensT } from "@/components/lens/lens-overview";
import { LensEmpty, LensNavBar, LensPill, LensStatTile, severityTone, type TLensSeverity } from "@/components/lens/lens-ui";
import { TableListSort } from "@/components/table/table-list-sort";
import type { TLensDashboard, TLensEventCode, TLensIssue, TLensGroup, TLensRuleGroup } from "@/features/lens/lens.types";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";
import { readablePath, readableUrl, visibleItems } from "@/features/lens/url-display";

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

/** Lens lifecycle event code to label. */
export const EVENT_LABEL_KEY: Record<TLensEventCode, "eventOpened" | "eventSeen" | "eventReopened" | "eventResolved" | "eventFixFailed" | "eventVerified" | "eventNotSeenPartial" | "eventVerificationInconclusive"> = {
  opened: "eventOpened",
  seen: "eventSeen",
  reopened: "eventReopened",
  resolved: "eventResolved",
  fix_failed: "eventFixFailed",
  verified: "eventVerified",
  not_seen_partial: "eventNotSeenPartial",
  verification_inconclusive: "eventVerificationInconclusive",
};

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


const SEVERITY_TILE: Record<TLensSeverity, string> = {
  high: "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
  medium: "bg-warning/12 text-warning ring-1 ring-warning/25",
  advisory: "bg-status-invited/12 text-status-invited ring-1 ring-status-invited/25",
};

/** Monospace only for real paths; words such as "Homepage" use the body font. */
function labelFont(label: string | null): string {
  return label?.startsWith("/") ? "font-mono" : "font-sans font-medium";
}

/** Short page label: "Homepage" for the site root, otherwise the decoded path. */
function pageLabel(url: string, t: TLensT): string {
  const path = readablePath(url);
  return path === "/" ? t("homepage") : path;
}

function formatDay(iso: string, locale: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}


/**
 * All Issues: the SEO command center for current open issues.
 * Filters, sort and view state come from the URL (see LensSection). Resolved issues belong in History.
 */
export function LensIssues({ data, t, locale, filters, onFilterChange, onNavigate }: {
  data: TLensDashboard;
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
        <LensStatTile icon={Icons.alert} label={t("tileHigh")} value={counts.high} tone="danger" trend={[2, 3, 2, 4, 3, 5, counts.high]} caption={t("trendCaption")} />
        <LensStatTile icon={Icons.alert} label={t("tileMedium")} value={counts.medium} tone="warning" trend={[4, 6, 5, 7, 6, 8, counts.medium]} caption={t("trendCaption")} />
        <LensStatTile icon={Icons.sparkles} label={t("tileAdvisory")} value={counts.advisory} tone="muted" trend={[3, 2, 4, 3, 3, 4, counts.advisory]} caption={t("trendCaption")} />
        <LensStatTile icon={Icons.grid} label={t("pageIssues")} value={counts.pageIssues} tone="brand" trend={[20, 24, 22, 28, 26, 30, counts.pageIssues]} caption={t("trendCaption")} />
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
function IssueSummary({ rows, t }: { rows: TLensIssue[]; t: TLensT }) {
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
export function IssueCard({ issue, t, locale, onNavigate, compact = false }: { issue: TLensIssue; t: TLensT; locale: string; onNavigate: TNavigate; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const scored = issue.severity !== "advisory";
  const tracking = issue.tracking;
  const tips = issue.pageSuggestions ?? [];
  const multiPage = issue.pages.length > 1;
  const patterns = issue.patterns ?? [];
  const pageChips = visibleItems(issue.pages, 8);
  const inPattern = new Set(patterns.flatMap((p) => p.urls));
  const ownSteps = issue.pageFixSteps?.find((p) => p.steps.length > 0 && !inPattern.has(p.url));
  const aiItems: { key: string; label: string | null; title?: string; text: string }[] = [
    ...patterns.flatMap((p) =>
      p.aiSuggestion
        ? [{ key: p.key, label: t("patternPages", { count: p.count, label: p.kind === "section" ? readablePath(p.label) : p.label.trim() }), text: p.aiSuggestion }]
        : [],
    ),
    ...tips.map((tip) => ({ key: tip.url, label: multiPage ? pageLabel(tip.url, t) : null, title: readableUrl(tip.url), text: tip.text })),
  ];

  return (
    <li id={`issue-${issue.id}`} className="flex scroll-mt-24 flex-col gap-6 rounded-3xl border border-border/80 bg-bg-card/40 p-5 shadow-(--shadow) sm:p-7 dark:border-text-primary/25">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <span className={cn("inline-flex size-12 shrink-0 items-center justify-center rounded-2xl", SEVERITY_TILE[issue.severity])} aria-hidden>
          {issue.severity === "advisory" ? <Icons.bulb className="size-5" /> : <Icons.alert className="size-5" />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <LensPill tone={severityTone(issue.severity)}>{t(severityLabel(issue.severity))}</LensPill>
            <Tag>{issue.group === "onpage" ? t("typeOnpage") : t("typeTechnical")}</Tag>
            <Tag>{t(RULE_LABEL_KEY[issue.ruleGroup])}</Tag>
          </div>
          <h3 className="text-xl font-semibold leading-snug tracking-tight text-text-primary sm:text-2xl">{issue.title}</h3>
          <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">{issue.found}</p>
          <p className="flex max-w-3xl items-start gap-2 text-xs leading-relaxed text-text-muted">
            <Icons.alert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              <span className="font-medium text-text-secondary">{t("issueWhy")}:</span> {issue.why}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-text-primary/[0.03] px-4 py-2 shadow-sm dark:border-text-primary/35">
          <Icons.globe className="size-4 text-text-muted" aria-hidden />
          <span className="text-xl font-semibold tabular-nums text-text-primary">{issue.affected}</span>
          <span className="text-sm text-text-muted">{t("pagesUnit")}</span>
        </div>
      </header>

      <section
        aria-label={t("recommendedFix")}
        className={cn("grid overflow-hidden rounded-2xl border border-border/70 bg-text-primary/[0.02] dark:border-text-primary/20", !compact && "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]")}
      >
        <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-6">
          <SectionLabel icon={Icons.bulb} tone="text-brand">{t("recommendedFix")}</SectionLabel>
          {patterns.map((pattern) => (
            <div key={pattern.key} className="flex flex-col gap-3">
              <div className="flex items-center gap-4 rounded-xl bg-brand/[0.08] p-3.5 ring-1 ring-brand/25">
                <span className="inline-flex h-14 min-w-14 shrink-0 items-center justify-center rounded-xl bg-brand px-2 text-2xl font-semibold tabular-nums text-white shadow-sm">
                  {pattern.count}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold text-text-primary">
                    {t("sharedCauseTitle", { label: pattern.kind === "section" ? readablePath(pattern.label) : pattern.label.trim() })}
                  </span>
                  <span className="text-xs text-text-secondary">{t("sharedCauseSub")}</span>
                </div>
              </div>
              <Steps steps={pattern.fixSteps.slice(1)} />
            </div>
          ))}
          {ownSteps ? (
            <div className="flex min-w-0 flex-col gap-3">
              {patterns.length > 0 ? <span className="text-xs font-medium text-text-muted">{t("otherPages")}</span> : null}
              {multiPage ? (
                <span dir="ltr" title={readableUrl(ownSteps.url)} className={cn("inline-flex w-fit max-w-full items-center gap-1.5 truncate rounded-md bg-bg-hover px-2 py-0.5 text-xs text-text-secondary", labelFont(pageLabel(ownSteps.url, t)))}>
                  {pageLabel(ownSteps.url, t)}
                </span>
              ) : null}
              <Steps steps={ownSteps.steps} />
            </div>
          ) : null}
          {!ownSteps && patterns.length === 0 ? <p className="text-sm leading-relaxed text-text-secondary">{issue.fix}</p> : null}
        </div>

        <aside className={cn("flex min-w-0 flex-col gap-3 border-t border-border/70 bg-text-primary/[0.035] p-5 sm:p-6 dark:border-text-primary/20", !compact && "lg:border-s lg:border-t-0")}>
          <SectionLabel icon={Icons.sparkles} tone="text-text-secondary">{t("aiSuggestion")}</SectionLabel>
          {aiItems.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {aiItems.slice(0, 3).map((item) => (
                <AiTip key={item.key} label={item.label} title={item.title} text={item.text} t={t} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">{issue.aiSuggestion ?? t("aiSuggestionPending")}</p>
          )}
          {aiItems.length > 3 ? (
            <button type="button" onClick={() => onNavigate("pages", { issue: issue.id })} className="inline-flex w-fit items-center gap-1 text-sm font-medium text-brand hover:underline">
              {t("viewAllPages")}
              <Icons.arrowRight className="size-3.5" aria-hidden />
            </button>
          ) : null}
          <p className="mt-auto pt-1 text-xs text-text-muted">{t("aiSuggestionNote")}</p>
        </aside>
      </section>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
        <span className="shrink-0 text-xs font-medium text-text-muted">{t("issuePages")}</span>
        <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {pageChips.shown.map((url) => (
            <li key={url} className="min-w-0 max-w-full">
              <button
                type="button"
                dir="ltr"
                title={readableUrl(url)}
                onClick={() => onNavigate("pages", { page: url, issue: issue.id })}
                className={cn("block max-w-full truncate rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary sm:max-w-[22rem]", labelFont(pageLabel(url, t)))}
              >
                {pageLabel(url, t)}
              </button>
            </li>
          ))}
          {pageChips.more > 0 ? (
            <li>
              <button
                type="button"
                onClick={() => onNavigate("pages", { issue: issue.id })}
                className="rounded-full border border-border px-3 py-1 text-xs text-text-muted transition-colors hover:border-brand/50 hover:text-text-primary"
              >
                +{pageChips.more}
              </button>
            </li>
          ) : null}
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

      <footer className="flex flex-col gap-4 border-t border-border/70 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <Icons.chartBar className="size-4 text-text-secondary" aria-hidden />
              {scored ? t("scoreCounted") : t("scoreNotCounted")}
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
              <DetailRow label={t("verifyLabel")}>
                <span className="text-sm text-text-primary">{issue.verify}</span>
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
                  <li key={`${event.date}-${event.event}`} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden />
                    <div className="flex flex-col">
                      <span className="text-text-primary">{t(EVENT_LABEL_KEY[event.event])}</span>
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


/** Small uppercase label that opens a section of the issue card. */
function SectionLabel({ icon: Icon, tone, children }: { icon: typeof Icons.alert; tone: string; children: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide", tone)}>
      <Icon className="size-3.5" aria-hidden />
      {children}
    </span>
  );
}

/** Numbered fix steps with round step markers. */
function Steps({ steps }: { steps: string[] }) {
  if (steps.length === 0) return null;
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => (
        <li key={index} className="relative flex items-start gap-3 pb-3.5 text-sm leading-relaxed text-text-secondary last:pb-0">
          {index < steps.length - 1 ? <span className="absolute start-[11px] top-7 bottom-0 w-px bg-border" aria-hidden /> : null}
          <span className="relative mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-[11px] font-semibold tabular-nums text-brand">
            {index + 1}
          </span>
          <span className="min-w-0 pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/** One AI suggestion: optional page or pattern label, the text, and a copy button. */
function AiTip({ label, title, text, t }: { label: string | null; title?: string; text: string; t: TLensT }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <li className="flex min-w-0 flex-col gap-1.5">
      {label ? (
        <span dir="ltr" title={title} className={cn("block truncate text-xs text-text-muted", labelFont(label))}>
          {label}
        </span>
      ) : null}
      <div className="group relative rounded-xl border-s-2 border-brand/70 bg-bg-card/80 p-3.5 pe-11 text-sm leading-relaxed text-text-primary shadow-sm ring-1 ring-border/60">
        {text}
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? t("copied") : t("copy")}
          title={copied ? t("copied") : t("copy")}
          className="absolute end-2 top-2 inline-flex size-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          {copied ? <Icons.checkCircle className="size-4 text-success" aria-hidden /> : <Icons.copy className="size-4" aria-hidden />}
        </button>
      </div>
    </li>
  );
}

export function severityLabel(severity: TLensSeverity) {
  return severity === "high" ? "severityHigh" : severity === "medium" ? "severityMedium" : "severityAdvisory";
}

