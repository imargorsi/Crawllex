"use client";

import { useMemo } from "react";

import type { TLensT } from "@/components/lens/lens-overview";
import { formatWhen } from "@/components/lens/lens-overview";
import { LENS_FLOAT_CARD, LensPill } from "@/components/lens/lens-ui";
import { TableListSort } from "@/components/table/table-list-sort";
import type { TLensDashboard, TLensPage } from "@/features/lens/lens.types";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";

/**
 * Pages: every page with its meta title, status and open-issue counts, sorted by priority.
 * Layout matches All Issues: header, one filter bar, then the list. Filtered to one issue via the Issue dropdown.
 */
export function LensPages({ data, t, locale, issueId, onIssueChange, onOpenPage }: {
  data: TLensDashboard;
  t: TLensT;
  locale: string;
  issueId: string | null;
  onIssueChange: (value: string) => void;
  onOpenPage: (url: string) => void;
}) {
  const issue = issueId ? data.issues.find((i) => i.id === issueId && i.status === "open") ?? null : null;

  /** Open issues on the page, from Lens. Null when the page was not checked. */
  const countsFor = (page: TLensPage) =>
    page.state !== "checked" ? null : { high: page.counts.mustFix, medium: page.counts.shouldFix, advisory: page.counts.worthALook };

  const rows = useMemo(
    () =>
      data.pages
        .filter((p) => (issue ? issue.pages.includes(p.url) : true))
        .map((p) => ({ page: p, counts: countsFor(p) }))
        .sort((a, b) => (b.counts?.high ?? -1) - (a.counts?.high ?? -1) || (b.counts?.medium ?? -1) - (a.counts?.medium ?? -1)),
    [data.pages, issue],
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
            <Icons.grid className="size-4 text-brand" aria-hidden />
          </span>
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-text-primary">{t("pagesTitle")}</h2>
            <span className="text-sm text-text-muted">
              {t("showingPages", { shown: rows.length, total: data.seo.checked })} · {t("sortedByPriority")} · {t("lastCheckedShort", { time: formatWhen(data.lastCheckAt, locale) })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TableListSort
          label={t("filterIssue")}
          value={issue?.id ?? "all"}
          onChange={onIssueChange}
          options={[
            { value: "all", label: t("seoAllIssues") },
            ...data.issues.filter((i) => i.status === "open").map((i) => ({ value: i.id, label: i.title })),
          ]}
        />
      </div>

      <div className={cn(LENS_FLOAT_CARD, "overflow-x-auto p-0")}>
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs text-text-muted">
              <th className="px-5 py-3 font-medium">{t("colPage")}</th>
              <th className="px-3 py-3 font-medium">{t("colState")}</th>
              <th className="px-3 py-3 text-end font-medium">{t("mustFixLabel")}</th>
              <th className="px-3 py-3 text-end font-medium">{t("shouldFixLabel")}</th>
              <th className="px-5 py-3 text-end font-medium">{t("worthLookLabel")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ page, counts }) => (
              <tr key={page.url} className="border-b border-border/40 last:border-0 transition-colors hover:bg-bg-hover/40">
                <td className="px-5 py-3">
                  <button type="button" onClick={() => onOpenPage(page.url)} className="flex flex-col items-start gap-0.5 text-start">
                    <span className="font-mono text-xs text-text-muted group-hover:text-brand">{page.url}</span>
                    {page.metaTitle ? (
                      <span className="text-sm font-medium text-text-primary hover:text-brand">{page.metaTitle}</span>
                    ) : (
                      <span className="text-sm font-medium text-destructive">{t("noTitle")}</span>
                    )}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <LensPill tone={page.state === "checked" ? "success" : page.state === "failed" ? "danger" : "muted"}>
                    {page.state === "checked" ? t("stateChecked") : page.state === "failed" ? t("stateFailed") : t("notEvaluated")}
                  </LensPill>
                </td>
                <td className="px-3 py-3 text-end tabular-nums text-text-primary">{counts ? counts.high : "—"}</td>
                <td className="px-3 py-3 text-end tabular-nums text-text-secondary">{counts ? counts.medium : "—"}</td>
                <td className="px-5 py-3 text-end tabular-nums text-text-secondary">{counts ? counts.advisory : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
