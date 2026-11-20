"use client";

import { useMemo } from "react";

import { formatWhen, scoreBandOf, type TLensT } from "@/components/lens/lens-overview";
import { EVENT_LABEL_KEY } from "@/components/lens/lens-issues";
import { LENS_FLOAT_CARD, LensEmpty, LensPill, LensStatTile, severityTone, type TLensSeverity } from "@/components/lens/lens-ui";
import type { TLensDashboard, TLensRun } from "@/features/lens/lens.types";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";
import type { TLensEventCode, TLensIssue } from "@/features/lens/lens.types";

/**
 * Scan History: every check with its saved score and counts, then the issue log built from each
 * issue's events. Same structure as All Issues, Pages and Uptime.
 */
export function LensHistory({ data, t, locale }: { data: TLensDashboard; t: TLensT; locale: string }) {
  const completed = data.runs.filter((r) => r.status === "completed");
  const current = completed[0]?.id ?? null;

  const log = useMemo(
    () =>
      data.issues
        // "Seen again" is recorded on every check for every open issue; the log shows changes only.
        .flatMap((issue) => issue.tracking.events.filter((event) => event.event !== "seen").map((event) => ({ ...event, issue })))
        // One row per day, event and issue, with how many pages it covered.
        .reduce<{ date: string; event: TLensEventCode; issue: TLensIssue; pages: number }[]>((rows, entry) => {
          const row = rows.find((r) => r.date === entry.date && r.event === entry.event && r.issue.id === entry.issue.id);
          if (row) row.pages += 1;
          else rows.push({ date: entry.date, event: entry.event, issue: entry.issue, pages: 1 });
          return rows;
        }, [])
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.issues],
  );

  // Fixes confirmed by complete checks: resolved events across all issues (an issue type can stay open while pages are fixed).
  const fixed = data.issues.reduce((sum, i) => sum + i.tracking.events.filter((e) => e.event === "resolved").length, 0);
  const open = data.issues.filter((i) => i.status === "open").length;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
          <Icons.clock className="size-4 text-brand" aria-hidden />
        </span>
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-text-primary">{t("historyTitle")}</h2>
          <span className="text-sm text-text-muted">
            {t("historySubtitle", { count: completed.length, time: formatWhen(data.lastCheckAt, locale) })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <LensStatTile icon={Icons.checkCircle} label={t("fixedSinceFirst")} value={fixed} tone="success" caption={t("resolvedCaption")} />
        <LensStatTile icon={Icons.alert} label={t("openNow")} value={open} tone="danger" caption={t("currentIssues")} />
        <LensStatTile icon={Icons.clock} label={t("checksCompleted")} value={completed.length} tone="muted" caption={t("allTime")} />
        <LensStatTile icon={Icons.refresh} label={t("checksFailed")} value={data.runs.length - completed.length} tone="warning" caption={t("noScoreSaved")} />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-base font-semibold text-text-primary">{t("scanHistory")}</span>
        <div className={cn(LENS_FLOAT_CARD, "overflow-x-auto p-0")}>
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs text-text-muted">
                <th className="px-5 py-3 font-medium">{t("colDate")}</th>
                <th className="px-3 py-3 font-medium">{t("colStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("colCoverage")}</th>
                <th className="px-3 py-3 text-end font-medium">{t("colScore")}</th>
                <th className="px-3 py-3 text-end font-medium">{t("colPagesChecked")}</th>
                <th className="px-3 py-3 text-end font-medium">{t("colNew")}</th>
                <th className="px-3 py-3 text-end font-medium">{t("colResolved")}</th>
                <th className="px-5 py-3 text-end font-medium">{t("colOpen")}</th>
              </tr>
            </thead>
            <tbody>
              {data.runs.map((run, index) => (
                <RunRow key={run.id} run={run} previous={data.runs.slice(index + 1).find((r) => r.status === "completed") ?? null} isCurrent={run.id === current} t={t} locale={locale} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted">{t("historyNote")}</p>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-base font-semibold text-text-primary">{t("issueLogTitle")}</span>
        {log.length === 0 ? (
          <LensEmpty>{t("noIssueLog")}</LensEmpty>
        ) : (
          <div className={cn(LENS_FLOAT_CARD, "overflow-x-auto p-0")}>
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs text-text-muted">
                  <th className="px-5 py-3 font-medium">{t("colDate")}</th>
                  <th className="px-3 py-3 font-medium">{t("colEvent")}</th>
                  <th className="px-3 py-3 font-medium">{t("colIssue")}</th>
                  <th className="px-5 py-3 font-medium">{t("colSeverity")}</th>
                </tr>
              </thead>
              <tbody>
                {log.map((entry) => (
                  <tr key={`${entry.issue.id}-${entry.date}-${entry.event}`} className="border-b border-border/40 last:border-0">
                    <td className="px-5 py-3 text-text-secondary">{new Date(`${entry.date}T00:00:00Z`).toLocaleDateString(locale, { dateStyle: "medium", timeZone: "UTC" })}</td>
                    <td className={cn("px-3 py-3", entry.event === "resolved" || entry.event === "verified" ? "text-success" : entry.event === "reopened" || entry.event === "fix_failed" ? "text-destructive" : "text-text-primary")}>{t(EVENT_LABEL_KEY[entry.event])}</td>
                    <td className="px-3 py-3 font-medium text-text-primary">
                      {entry.issue.title}
                      {entry.pages > 1 ? <span className="ms-2 text-xs font-normal text-text-muted">{t("pagesCount", { count: entry.pages })}</span> : null}
                    </td>
                    <td className="px-5 py-3">
                      <LensPill tone={severityTone(entry.issue.severity as TLensSeverity)}>{t(severityKey(entry.issue.severity))}</LensPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function RunRow({ run, previous, isCurrent, t, locale }: {
  run: TLensRun;
  previous: TLensRun | null;
  isCurrent: boolean;
  t: TLensT;
  locale: string;
}) {
  const failed = run.status === "failed";
  const delta = run.score != null && previous?.score != null ? run.score - previous.score : null;
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="px-5 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-text-primary">{formatWhen(run.startedAt, locale)}</span>
          {isCurrent ? <LensPill tone="brand">{t("current")}</LensPill> : null}
        </div>
      </td>
      <td className="px-3 py-3">
        <LensPill tone={failed ? "danger" : "success"}>{failed ? t("runFailed") : t("runCompleted")}</LensPill>
        {failed && run.errorCode ? <p className="mt-1 text-xs text-text-muted">{t("runFailedNote", { code: run.errorCode })}</p> : null}
      </td>
      <td className="px-3 py-3 text-text-secondary">
        {run.coverage === "partial" ? t("coveragePartial") : run.coverage === "complete" ? t("coverageComplete") : "—"}
        {run.coverageReason === "cap_reached" ? <p className="mt-1 text-xs text-text-muted">{t("crawlLimitReached")}</p> : null}
      </td>
      <td className="px-3 py-3 text-end">
        {run.score != null ? (
          <div className="flex flex-col items-end gap-1">
            <span className="tabular-nums text-text-primary">{run.score}</span>
            <span className="text-xs text-text-muted">{t(`band_${scoreBandOf(run.score)}`)}</span>
            {delta != null && delta !== 0 ? (
              <span className={cn("text-xs font-medium tabular-nums", delta > 0 ? "text-success" : "text-destructive")}>
                {delta > 0 ? `+${delta}` : delta}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-end tabular-nums text-text-secondary">
        {failed ? "—" : run.knownUrls ? `${run.pagesChecked} / ${run.knownUrls}` : run.pagesChecked}
      </td>
      <td className="px-3 py-3 text-end tabular-nums text-text-secondary">{run.newIssues ?? "—"}</td>
      <td className="px-3 py-3 text-end tabular-nums text-text-secondary">{run.resolvedIssues ?? "—"}</td>
      <td className="px-5 py-3 text-end tabular-nums text-text-secondary">{run.openIssues ?? "—"}</td>
    </tr>
  );
}

function severityKey(severity: TLensSeverity) {
  return severity === "high" ? "severityHigh" : severity === "medium" ? "severityMedium" : "severityAdvisory";
}
