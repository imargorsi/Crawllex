"use client";

import type { TLensT } from "@/components/lens/lens-overview";
import { formatWhen } from "@/components/lens/lens-overview";
import { LENS_FLOAT_CARD, LensCardHeader, LensPill } from "@/components/lens/lens-ui";
import type { TLensDemoDashboard } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { scoreBandOf } from "@/components/lens/lens-overview";

/** Scan history: one row per check, with its saved score and what changed. Issue log comes next. */
export function LensHistory({ data, t, locale }: { data: TLensDemoDashboard; t: TLensT; locale: string }) {
  return (
    <div className="flex flex-col gap-4">
      <section className={LENS_FLOAT_CARD}>
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
