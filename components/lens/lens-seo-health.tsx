"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { LENS_CARD, LensCardHeader, LensPill } from "@/components/lens/lens-ui";
import { LensIssues } from "@/components/lens/lens-issues";
import { formatWhen, scoreBandOf, type TLensT } from "@/components/lens/lens-overview";
import type { TLensDemoDashboard } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";

export type TSeoSub = "all" | "pages" | "history";
export type TTypePreset = "all" | "onpage" | "technical";

type TProps = { data: TLensDemoDashboard; t: TLensT; locale: string; sub: TSeoSub; presetType: TTypePreset };

/** SEO health tab: `all` is the command center (LensIssues). `pages` and `history` render below. */
export function LensSeoHealth({ data, t, locale, sub, presetType }: TProps) {
  if (sub === "pages") return <PagesView data={data} t={t} />;
  if (sub === "history") return <HistoryView data={data} t={t} locale={locale} />;
  return <LensIssues key={presetType} data={data} t={t} locale={locale} presetType={presetType} />;
}

function PagesView({ data, t }: { data: TLensDemoDashboard; t: TLensT }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () =>
      data.pages
        .filter((p) => p.url.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => b.failed - a.failed || b.warnings - a.warnings || b.suggestions - a.suggestions),
    [data.pages, query],
  );
  return (
    <section className={LENS_CARD}>
      <LensCardHeader icon={Icons.grid} title={t("pagesTitle")} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPages")}
          aria-label={t("searchPages")}
          className="max-w-sm rounded-full"
        />
        <span className="text-xs text-text-muted">{t("showingPages", { shown: rows.length, total: data.seo.checked })} · {t("sortedByPriority")}</span>
      </div>
      <div className="-mx-2 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs text-text-muted">
              <th className="px-2 py-2 font-medium">{t("colPage")}</th>
              <th className="px-2 py-2 font-medium">{t("colState")}</th>
              <th className="px-2 py-2 text-end font-medium">{t("colFailed")}</th>
              <th className="px-2 py-2 text-end font-medium">{t("colWarnings")}</th>
              <th className="px-2 py-2 text-end font-medium">{t("colSuggestions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((page) => (
              <tr key={page.url} className="border-b border-border/40 last:border-0 hover:bg-bg-hover/40">
                <td className="px-2 py-2.5 font-mono text-xs text-text-primary">{page.url}</td>
                <td className="px-2 py-2.5">
                  <LensPill tone={page.state === "checked" ? "success" : page.state === "failed" ? "danger" : "muted"}>
                    {page.state === "checked" ? t("stateChecked") : page.state === "failed" ? t("stateFailed") : t("notEvaluated")}
                  </LensPill>
                </td>
                <td className="px-2 py-2.5 text-end tabular-nums text-text-primary">{page.failed}</td>
                <td className="px-2 py-2.5 text-end tabular-nums text-text-secondary">{page.warnings}</td>
                <td className="px-2 py-2.5 text-end tabular-nums text-text-secondary">{page.suggestions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HistoryView({ data, t, locale }: { data: TLensDemoDashboard; t: TLensT; locale: string }) {
  return (
    <div className="flex flex-col gap-4">
      <section className={LENS_CARD}>
        <LensCardHeader icon={Icons.clock} title={t("historyTitle")} />
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs text-text-muted">
                <th className="px-2 py-2 font-medium">{t("colDate")}</th>
                <th className="px-2 py-2 font-medium">{t("colStatus")}</th>
                <th className="px-2 py-2 font-medium">{t("colCoverage")}</th>
                <th className="px-2 py-2 text-end font-medium">{t("colScore")}</th>
                <th className="px-2 py-2 text-end font-medium">{t("colPagesChecked")}</th>
                <th className="px-2 py-2 text-end font-medium">{t("colNew")}</th>
                <th className="px-2 py-2 text-end font-medium">{t("colResolved")}</th>
                <th className="px-2 py-2 text-end font-medium">{t("colOpen")}</th>
              </tr>
            </thead>
            <tbody>
              {data.runs.map((run) => {
                const failed = run.status === "failed";
                return (
                  <tr key={run.id} className="border-b border-border/40 last:border-0">
                    <td className="px-2 py-3 text-text-primary">{formatWhen(run.startedAt, locale)}</td>
                    <td className="px-2 py-3">
                      <LensPill tone={failed ? "danger" : "success"}>{failed ? t("runFailed") : t("runCompleted")}</LensPill>
                      {failed && run.errorCode ? <p className="mt-1 text-xs text-text-muted">{t("runFailedNote", { code: run.errorCode })}</p> : null}
                    </td>
                    <td className="px-2 py-3 text-text-secondary">
                      {run.coverage === "partial" ? t("coveragePartial") : run.coverage === "complete" ? t("coverageComplete") : "—"}
                      {run.coverageReason === "cap_reached" ? <p className="mt-1 text-xs text-text-muted">{t("crawlLimitReached")}</p> : null}
                    </td>
                    <td className="px-2 py-3 text-end">
                      <span className="block tabular-nums text-text-primary">{run.score ?? "—"}</span>
                      {run.score != null ? <span className="text-xs text-text-muted">{t(`band_${scoreBandOf(run.score)}`)}</span> : null}
                    </td>
                    <td className="px-2 py-3 text-end tabular-nums text-text-secondary">
                      {failed ? "—" : run.knownUrls ? `${run.pagesChecked} / ${run.knownUrls}` : run.pagesChecked}
                    </td>
                    <td className="px-2 py-3 text-end tabular-nums text-text-secondary">{run.newIssues ?? "—"}</td>
                    <td className="px-2 py-3 text-end tabular-nums text-text-secondary">{run.resolvedIssues ?? "—"}</td>
                    <td className="px-2 py-3 text-end tabular-nums text-text-secondary">{run.openIssues ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted">{t("historyNote")}</p>
      </section>
    </div>
  );
}
