"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { LENS_CARD, LensCardHeader, LensEmpty, LensPill, severityTone } from "@/components/lens/lens-ui";
import { formatWhen, scoreBandOf, severityKey, type TLensT } from "@/components/lens/lens-overview";
import type { TLensDemoDashboard, TLensDemoIssue, TLensGroup } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

export type TSeoSub = "all" | "onpage" | "technical" | "pages" | "history";

type TProps = { data: TLensDemoDashboard; t: TLensT; locale: string; sub: TSeoSub };

/** SEO health tab: issues (grouped by category), pages, and scan history. Data comes from the dashboard view model. */
export function LensSeoHealth({ data, t, locale, sub }: TProps) {
  if (sub === "pages") return <PagesView data={data} t={t} />;
  if (sub === "history") return <HistoryView data={data} t={t} locale={locale} />;
  return <IssuesView data={data} t={t} sub={sub} />;
}

function IssuesView({ data, t, sub }: { data: TLensDemoDashboard; t: TLensT; sub: "all" | "onpage" | "technical" }) {
  const groups: TLensGroup[] = sub === "all" ? ["onpage", "technical"] : [sub];
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const items = data.issues.filter((i) => i.group === group);
        return (
          <section key={group} className={LENS_CARD}>
            <LensCardHeader icon={group === "onpage" ? Icons.file : Icons.wrench} title={t(group === "onpage" ? "onpageTitle" : "technicalTitle")} />
            <p className="-mt-2 text-sm text-text-secondary">{t(group === "onpage" ? "onpageHelp" : "technicalHelp")}</p>
            {items.length === 0 ? (
              <LensEmpty>{t("noRunYet")}</LensEmpty>
            ) : (
              <ul className="flex flex-col divide-y divide-border/50">
                {items.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} t={t} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function IssueRow({ issue, t }: { issue: TLensDemoIssue; t: TLensT }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full min-w-0 flex-wrap items-center gap-3 rounded-xl px-1 py-1 text-start transition-colors hover:bg-bg-hover/60"
      >
        <LensPill tone={severityTone(issue.severity)}>{t(severityKey(issue.severity))}</LensPill>
        <span className="min-w-0 flex-1 truncate font-medium text-text-primary">{issue.title}</span>
        <span className="text-sm tabular-nums text-text-secondary">{t("pagesCount", { count: issue.affected })}</span>
        <Icons.arrowRight className={cn("size-4 shrink-0 text-text-muted transition-transform duration-200", open && "rotate-90")} aria-hidden />
      </button>
      {open ? (
        <div className="mt-3 grid gap-4 rounded-2xl border border-border/60 p-4 md:grid-cols-2">
          <Block label={t("issueFound")} text={issue.found} />
          <Block label={t("issueWhy")} text={issue.why} />
          <Block label={t("issueFix")} text={issue.fix} />
          <Block label={t("issueVerify")} text={issue.verify} />
          <div className="flex flex-col gap-2 md:col-span-2">
            <span className="text-xs font-medium text-text-muted">{t("issuePages")}</span>
            <ul className="flex flex-wrap gap-1.5">
              {issue.pages.map((url) => (
                <li key={url} className="rounded-full border border-border/60 px-2.5 py-0.5 font-mono text-xs text-text-secondary">{url}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <p className="text-sm text-text-secondary">{text}</p>
    </div>
  );
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
