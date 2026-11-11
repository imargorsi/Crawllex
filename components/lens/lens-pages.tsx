"use client";

import { useMemo, useState } from "react";

import type { TLensT } from "@/components/lens/lens-overview";
import { LENS_FLOAT_CARD, LensCardHeader, LensPill } from "@/components/lens/lens-ui";
import { TableListSort } from "@/components/table/table-list-sort";
import { Input } from "@/components/ui/input";
import type { TLensDemoDashboard } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";

/** Pages: every checked page with its status and issue counts, sorted by priority. Can be narrowed to one issue. */
export function LensPages({ data, t, issueId, initialQuery, onIssueChange, onOpenPage }: {
  data: TLensDemoDashboard;
  t: TLensT;
  issueId: string | null;
  initialQuery: string;
  onIssueChange: (value: string) => void;
  onOpenPage: (url: string) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const issue = issueId ? data.issues.find((i) => i.id === issueId) ?? null : null;
  const pageCounts = (url: string) => {
    const open = data.issues.filter((i) => i.status === "open" && i.pages.includes(url));
    return {
      high: open.filter((i) => i.severity === "high").length,
      medium: open.filter((i) => i.severity === "medium").length,
      advisory: open.filter((i) => i.severity === "advisory").length,
    };
  };
  const rows = useMemo(
    () =>
      data.pages
        .filter((p) => (issue ? issue.pages.includes(p.url) : true))
        .filter((p) => p.url.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => b.failed - a.failed || b.warnings - a.warnings || b.suggestions - a.suggestions),
    [data.pages, issue, query],
  );
  return (
    <section className={LENS_FLOAT_CARD}>
      <LensCardHeader icon={Icons.grid} title={t("pagesTitle")} />
      <div className="flex flex-wrap items-center justify-between gap-3">
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
              <th className="px-2 py-2 text-end font-medium">{t("mustFixLabel")}</th>
              <th className="px-2 py-2 text-end font-medium">{t("shouldFixLabel")}</th>
              <th className="px-2 py-2 text-end font-medium">{t("worthLookLabel")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((page) => {
              const counts = pageCounts(page.url);
              return (
              <tr key={page.url} className="border-b border-border/40 last:border-0 transition-colors hover:bg-bg-hover/40">
                <td className="px-2 py-2.5">
                  <button type="button" onClick={() => onOpenPage(page.url)} className="font-mono text-xs text-text-primary underline-offset-4 hover:text-brand hover:underline">
                    {page.url}
                  </button>
                </td>
                <td className="px-2 py-2.5">
                  <LensPill tone={page.state === "checked" ? "success" : page.state === "failed" ? "danger" : "muted"}>
                    {page.state === "checked" ? t("stateChecked") : page.state === "failed" ? t("stateFailed") : t("notEvaluated")}
                  </LensPill>
                </td>
                <td className="px-2 py-2.5 text-end tabular-nums text-text-primary">{counts.high}</td>
                <td className="px-2 py-2.5 text-end tabular-nums text-text-secondary">{counts.medium}</td>
                <td className="px-2 py-2.5 text-end tabular-nums text-text-secondary">{counts.advisory}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

