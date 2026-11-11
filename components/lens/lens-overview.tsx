"use client";

import type { TFunction } from "i18next";
import type { ComponentType, CSSProperties, ReactNode } from "react";

import { LensSeoSummary } from "@/components/lens/lens-seo-summary";
import { formatUptimeDay, LensUptimeBars, LensUptimeLegend, UPTIME_LEGEND_COLORS } from "@/components/lens/lens-charts";
import {
  LensCardHeader,
  LensClickCard,
  LensPill,
  LensScoreRing,
  type TLensBand,
  LensSeverityBars,
  severityTone,
  type TLensSeverity,
  type TLensTone,
} from "@/components/lens/lens-ui";
import type { TLensDemoDashboard, TLensDemoIssue } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { buildSeoSummary } from "@/lib/lens/seo-summary";
import { cn } from "@/lib/utils";

export type TLensT = TFunction<"translation", "lens">;
export type TLensTab = "overview" | "seo" | "uptime";
export type TLensNavigate = (tab: TLensTab, sub?: "onpage" | "technical" | "pages" | "history") => void;

type TProps = { data: TLensDemoDashboard; t: TLensT; locale: string; go: TLensNavigate };

function scoreBandOf(score: number): "good" | "work" | "attention" {
  if (score >= 85) return "good";
  if (score >= 60) return "work";
  return "attention";
}

const BAND_TONE: Record<"good" | "work" | "attention", TLensTone> = { good: "success", work: "brand", attention: "danger" };
const HEALTH_BANDS: TLensBand[] = [
  { from: 0, to: 60, color: "var(--destructive)" },
  { from: 60, to: 85, color: "var(--brand)" },
  { from: 85, to: 100, color: "var(--color-success)" },
];

const BAND_CHIP: Record<"attention" | "work" | "good", { on: string; off: string }> = {
  attention: {
    on: "border-destructive/70 bg-destructive/20 text-destructive",
    off: "border-destructive/25 bg-destructive/5 text-text-muted",
  },
  work: {
    on: "border-brand/70 bg-brand/20 text-brand",
    off: "border-brand/25 bg-brand/5 text-text-muted",
  },
  good: {
    on: "border-success/70 bg-success/20 text-success",
    off: "border-success/25 bg-success/5 text-text-muted",
  },
};

/** Band legend under the ring. The active band is strong; the next-target note sits inside its chip. */
function HealthLegend({ score, t }: { score: number; t: TLensT }) {
  const band = scoreBandOf(score);
  const items = [
    { id: "attention", name: t("band_attention"), range: t("bandLegendAttention") },
    { id: "work", name: t("band_work"), range: t("bandLegendWork") },
    { id: "good", name: t("band_good"), range: t("bandLegendGood") },
  ] as const;
  return (
    <ul className="grid w-full grid-cols-3 gap-2">
      {items.map((item) => {
        const active = band === item.id;
        return (
          <li
            key={item.id}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-colors duration-200",
              active ? BAND_CHIP[item.id].on : BAND_CHIP[item.id].off,
            )}
          >
            <span className="text-sm font-semibold">{item.name}</span>
            <span className="text-[11px] text-text-secondary">{item.range}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Uptime: the most important availability number. Neutral glass panel (not a band chip), large figure, 30 daily bars. */
function UptimeBlock({ data, t }: { data: TLensDemoDashboard; t: TLensT }) {
  const operational = data.uptime.status === "operational";
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-text-primary/[0.04] p-5 shadow-(--shadow) dark:border-text-primary/40 dark:bg-text-primary/[0.06]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-text-secondary">{t("uptimeLabel")}</span>
        <LensPill tone={operational ? "success" : "danger"}>
          {operational ? t("statusOperational") : t("statusDown")}
        </LensPill>
      </div>
      <span className="text-5xl font-semibold tabular-nums leading-none text-text-primary">{data.uptime.percent.toFixed(2)}%</span>
      <div className="flex h-10 items-end gap-[3px]" aria-hidden>
        {data.uptime.daily.map((d) => {
          const pct = d.uptimePct;
          const height = pct == null ? 12 : Math.max(18, 100 - (100 - pct) * 12);
          const color = pct == null ? "var(--border)" : pct >= 99.5 ? "var(--color-success)" : pct >= 98 ? "var(--color-warning)" : "var(--destructive)";
          return <span key={d.day} className="flex-1 rounded-sm" style={{ height: `${height}%`, background: color }} title={`${d.day}: ${pct ?? "—"}%`} />;
        })}
      </div>
    </div>
  );
}
const SEVERITY_RANK: Record<TLensSeverity, number> = { high: 3, medium: 2, advisory: 1 };

export function formatWhen(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

export function formatMinutes(min: number, t: TLensT) {
  return t("minutes", { count: min });
}

export function severityKey(severity: TLensSeverity) {
  return severity === "high" ? "severityHigh" : severity === "medium" ? "severityMedium" : "severityAdvisory";
}

function sumAffected(issues: TLensDemoIssue[], group: "onpage" | "technical") {
  return issues.filter((i) => i.group === group).reduce((sum, i) => sum + i.affected, 0);
}

/** Staggered entrance wrapper. Reduced motion is handled in globals.css. */
function Rise({ index, children }: { index: number; children: ReactNode }) {
  return <div className="lens-rise min-w-0" style={{ "--lens-delay": `${index * 70}ms` } as CSSProperties}>{children}</div>;
}

export function LensOverview({ data, t, locale, go }: TProps) {
  return (
    <div className="flex flex-col gap-6">
      <Rise index={0}>
        <SeoScoreCard data={data} t={t} />
      </Rise>

      <Rise index={1}>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          <PagesAffectedCard data={data} t={t} />
          <PriorityCard data={data} t={t} go={go} />
        </div>
      </Rise>

      <Rise index={2}>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <LinkCard
          icon={Icons.file}
          title={t("linkOnpage")}
          value={sumAffected(data.issues, "onpage")}
          unit={t("unitIssues")}
          description={t("linkOnpageDesc")}
          segments={severityTotals(data.issues, "onpage")}
          onOpen={() => go("seo", "onpage")}
        />
        <LinkCard
          icon={Icons.wrench}
          title={t("linkTechnical")}
          value={sumAffected(data.issues, "technical")}
          unit={t("unitIssues")}
          description={t("linkTechnicalDesc")}
          segments={severityTotals(data.issues, "technical")}
          onOpen={() => go("seo", "technical")}
        />
        <LinkCard
          icon={Icons.grid}
          title={t("linkPages")}
          value={data.seo.checked}
          unit={t("unitKnown", { known: data.seo.known })}
          description={t("linkPagesDesc")}
          segments={[
            { value: data.seo.checked, tone: "brand" },
            { value: Math.max(0, data.seo.known - data.seo.checked), tone: "muted" },
          ]}
          onOpen={() => go("seo", "pages")}
        />
        <LinkCard
          icon={Icons.alert}
          title={t("linkIssues")}
          value={allIssueTotal(data.issues)}
          unit={t("unitIssues")}
          description={t("linkIssuesDesc")}
          segments={allSeverityTotals(data.issues)}
          onOpen={() => go("seo")}
        />
      </div>

      </Rise>

      <Rise index={3}>
        <UptimeChartCard data={data} t={t} locale={locale} go={go} />
      </Rise>
    </div>
  );
}

/** Full-width SEO score: ring and band, three explained counts, rule-based summary bullets. */
function SeoScoreCard({ data, t }: { data: TLensDemoDashboard; t: TLensT }) {
  const { seo } = data;
  const band = scoreBandOf(seo.score);
  const bullets = buildSeoSummary({
    issues: data.issues.map((i) => ({ id: i.id, title: i.title, severity: i.severity, affected: i.affected })),
    checked: seo.checked,
    known: seo.known,
    partial: seo.partial,
    uptimePercent: data.uptime.percent,
  });
  return (
    <LensClickCard className="p-6 sm:p-7" label={t("seoScoreTitle")}>
      <LensCardHeader
        icon={Icons.search}
        title={t("seoScoreTitle")}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <LensPill tone={seo.partial ? "warning" : "success"} className="px-3.5 py-1.5 text-sm">
              {seo.partial ? t("partialScan") : t("completeScan")}
            </LensPill>
            <LensPill tone={BAND_TONE[band]} className="px-3.5 py-1.5 text-sm">{t(`band_${band}`)}</LensPill>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[3fr_7fr] lg:items-stretch">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <LensScoreRing score={seo.score} bands={HEALTH_BANDS} size={164} />
          <HealthLegend score={seo.score} t={t} />
          <UptimeBlock data={data} t={t} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <p className="text-sm font-medium text-text-primary">
            {seo.score >= 85 ? t("stayHealthy") : t("pointsToHealthy", { points: 85 - seo.score })}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <CountTile tone="danger" label={t("failedLabel")} value={seo.failed} help={t("mustFixNote")} />
            <CountTile tone="warning" label={t("warningsLabel")} value={seo.warnings} help={t("shouldFixNote")} />
            <CountTile tone="muted" label={t("noticesLabel")} value={seo.notices} help={t("worthNote")} />
          </div>
          <LensSeoSummary bullets={bullets} heading={t("summaryHeading")} t={t} className="flex-1" />
        </div>
      </div>
    </LensClickCard>
  );
}

const TILE_CLASS: Record<TLensTone, string> = {
  brand: "border-brand/40 bg-brand/10",
  success: "border-success/40 bg-success/10",
  warning: "border-warning/40 bg-warning/10",
  danger: "border-destructive/40 bg-destructive/10",
  muted: "border-border/70 bg-bg-hover/60",
};
const TILE_TEXT: Record<TLensTone, string> = {
  brand: "text-brand",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  muted: "text-text-secondary",
};

function CountTile({ tone, label, value, help }: { tone: TLensTone; label: string; value: number; help: string }) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-2xl border p-4", TILE_CLASS[tone])}>
      <span className={cn("text-sm font-semibold", TILE_TEXT[tone])}>{label}</span>
      <span className="text-4xl font-semibold tabular-nums text-text-primary">{value}</span>
      <span className="text-xs leading-relaxed text-text-secondary">{help}</span>
    </div>
  );
}

function PagesAffectedCard({ data, t }: { data: TLensDemoDashboard; t: TLensT }) {
  const { seo } = data;
  return (
    <LensClickCard label={t("pagesAffectedTitle")}>
      <LensCardHeader
        icon={Icons.grid}
        title={t("pagesAffectedTitle")}
        action={
          <button type="button" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline">
            {t("viewAllPages")}
            <Icons.arrowRight className="size-3.5" aria-hidden />
          </button>
        }
      />
      <div className="flex flex-col gap-1">
        <span className="text-4xl font-semibold tabular-nums text-text-primary">{seo.pagesAffected}</span>
        <p className="text-sm text-text-secondary">{t("pagesAffectedNote")}</p>
      </div>
      <LensSeverityBars
        rows={[
          { label: t("severityHigh"), value: seo.bySeverity.high, tone: "danger" },
          { label: t("severityMedium"), value: seo.bySeverity.medium, tone: "warning" },
          { label: t("severityAdvisory"), value: seo.bySeverity.advisory, tone: "muted" },
        ]}
      />
    </LensClickCard>
  );
}

function PriorityCard({ data, t, go }: { data: TLensDemoDashboard; t: TLensT; go: TLensNavigate }) {
  const rows = [...data.issues]
    .filter((i) => i.affected > 0)
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.affected - a.affected)
    .slice(0, 4);
  return (
    <LensClickCard label={t("priorityTitle")}>
      <LensCardHeader
        icon={Icons.alert}
        title={t("priorityTitle")}
        action={
          <button type="button" onClick={() => go("seo")} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline">
            {t("viewAllIssues")}
            <Icons.arrowRight className="size-3.5" aria-hidden />
          </button>
        }
      />
      <div className="-mx-2 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs text-text-muted">
              <th className="px-2 py-2 font-medium">{t("colSeverity")}</th>
              <th className="px-2 py-2 font-medium">{t("colIssue")}</th>
              <th className="px-2 py-2 font-medium">{t("colAffected")}</th>
              <th className="px-2 py-2 font-medium">{t("colAction")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/40 last:border-0">
                <td className="px-2 py-3"><LensPill tone={severityTone(row.severity)}>{t(severityKey(row.severity))}</LensPill></td>
                <td className="px-2 py-3 font-medium text-text-primary">{row.title}</td>
                <td className="px-2 py-3 tabular-nums text-text-secondary">{t("pagesCount", { count: row.affected })}</td>
                <td className="px-2 py-3 text-text-secondary">{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LensClickCard>
  );
}

type TLinkCardProps = {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  value: string | number;
  unit: string;
  description: string;
  segments?: { value: number; tone: TLensTone }[];
  onOpen?: () => void;
};

const SEGMENT_FILL: Record<TLensTone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  muted: "bg-text-muted",
};

/** Section card: icon, big figure, optional severity strip, description. Whole card is clickable. */
function LinkCard({ icon: Icon, title, value, unit, description, segments, onOpen }: TLinkCardProps) {
  const total = segments?.reduce((sum, seg) => sum + seg.value, 0) ?? 0;
  return (
    <LensClickCard label={title} onOpen={onOpen} className="gap-5">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10">
          <Icon className="size-5 text-brand" aria-hidden />
        </span>
        <span className="inline-flex size-8 items-center justify-center rounded-full border border-border text-text-muted transition-all duration-200 group-hover:border-brand/50 group-hover:text-brand">
          <Icons.arrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-secondary">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums leading-none text-text-primary">{value}</span>
          <span className="text-sm text-text-muted">{unit}</span>
        </div>
      </div>
      {segments && total > 0 ? (
        <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {segments.filter((seg) => seg.value > 0).map((seg, i) => (
            <span key={i} className={cn("h-full rounded-full", SEGMENT_FILL[seg.tone])} style={{ width: `${(seg.value / total) * 100}%` }} />
          ))}
        </div>
      ) : null}
      <p className="text-xs leading-relaxed text-text-muted">{description}</p>
    </LensClickCard>
  );
}

function allIssueTotal(issues: TLensDemoIssue[]) {
  return issues.reduce((sum, i) => sum + i.affected, 0);
}

function allSeverityTotals(issues: TLensDemoIssue[]) {
  return [
    { value: issues.filter((i) => i.severity === "high").reduce((s, i) => s + i.affected, 0), tone: "danger" as const },
    { value: issues.filter((i) => i.severity === "medium").reduce((s, i) => s + i.affected, 0), tone: "warning" as const },
    { value: issues.filter((i) => i.severity === "advisory").reduce((s, i) => s + i.affected, 0), tone: "muted" as const },
  ];
}

function severityTotals(issues: TLensDemoIssue[], group: "onpage" | "technical") {
  const totals = { high: 0, medium: 0, advisory: 0 };
  for (const issue of issues) if (issue.group === group) totals[issue.severity] += issue.affected;
  return [
    { value: totals.high, tone: "danger" as const },
    { value: totals.medium, tone: "warning" as const },
    { value: totals.advisory, tone: "muted" as const },
  ];
}

/** Uptime, last 30 days: headline figures first, then the daily chart with its legend and the lowest day. */
function UptimeChartCard({ data, t, locale, go }: { data: TLensDemoDashboard; t: TLensT; locale: string; go: TLensNavigate }) {
  const { uptime } = data;
  const operational = uptime.status === "operational";
  const measured = uptime.daily.filter((d) => d.uptimePct != null);
  const lowest = measured.reduce<{ day: string; uptimePct: number } | null>(
    (min, d) => (min == null || (d.uptimePct as number) < min.uptimePct ? { day: d.day, uptimePct: d.uptimePct as number } : min),
    null,
  );
  const headline = [
    { label: t("uptimeLabel"), value: `${uptime.percent.toFixed(2)}%`, strong: true },
    { label: t("totalDowntime"), value: formatMinutes(uptime.totalDowntimeMin, t) },
    { label: t("incidents"), value: String(uptime.incidents) },
    { label: t("avgResponse"), value: `${uptime.avgResponseMs} ms` },
    { label: t("lowestDay"), value: lowest ? t("lowestDayValue", { percent: lowest.uptimePct.toFixed(2), date: formatUptimeDay(lowest.day, locale) }) : "—" },
  ];
  return (
    <LensClickCard label={t("uptimeTitle")} className="gap-6 p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LensCardHeader
          icon={Icons.analytics}
          title={t("uptimeTitle")}
          action={
            <button type="button" onClick={() => go("uptime")} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline">
              {t("viewUptimeDetails")}
              <Icons.arrowRight className="size-3.5" aria-hidden />
            </button>
          }
        />
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border md:grid-cols-5 dark:border-text-primary/40">
        {headline.map((item, i) => (
          <div
            key={item.label}
            className={cn(
              "flex min-w-0 flex-col gap-1 px-4 py-3.5",
              i > 0 && "border-t border-border md:border-t-0 md:border-s",
              i % 2 === 1 && "border-s border-border md:border-s",
              i > 1 && "border-t border-border md:border-t-0",
              item.strong && "bg-success/10",
            )}
          >
            <span className="truncate text-xs text-text-muted">{item.label}</span>
            <span className={cn("truncate font-semibold tabular-nums text-text-primary", item.strong ? "text-2xl" : "text-lg")}>{item.value}</span>
            {item.strong ? (
              <span className="mt-0.5 w-fit">
                <LensPill tone={operational ? "success" : "danger"}>{operational ? t("statusOperational") : t("statusDown")}</LensPill>
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-text-secondary">{t("dailyUptimeTitle")}</span>
          <LensUptimeLegend
            items={[
              { label: t("legendGood"), color: UPTIME_LEGEND_COLORS.good },
              { label: t("legendDegraded"), color: UPTIME_LEGEND_COLORS.degraded },
              { label: t("legendDown"), color: UPTIME_LEGEND_COLORS.down },
              { label: t("legendNoData"), color: UPTIME_LEGEND_COLORS.none },
            ]}
          />
        </div>
        <LensUptimeBars days={uptime.daily} height={280} locale={locale} />
      </div>

      <p className="text-xs text-text-muted">{t("lastCheckedShort", { time: formatWhen(uptime.lastCheckedAt, locale) })}</p>
    </LensClickCard>
  );
}
