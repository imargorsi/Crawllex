"use client";

import { useMemo, useState } from "react";

import type { TLensT } from "@/components/lens/lens-overview";
import { LENS_FLOAT_CARD, LensCardHeader, LensPill } from "@/components/lens/lens-ui";
import { Input } from "@/components/ui/input";
import type { TLensDemoDashboard } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";

/** Pages: every checked page with its status and issue counts, sorted by priority. */
export function LensPages({ data, t }: { data: TLensDemoDashboard; t: TLensT }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () =>
      data.pages
        .filter((p) => p.url.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => b.failed - a.failed || b.warnings - a.warnings || b.suggestions - a.suggestions),
    [data.pages, query],
  );
  return (
    <section className={LENS_FLOAT_CARD}>
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

