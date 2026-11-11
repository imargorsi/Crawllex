"use client";

import { useEffect } from "react";

import { IssueCard } from "@/components/lens/lens-issues";
import { formatWhen, type TLensT } from "@/components/lens/lens-overview";
import { LensPill } from "@/components/lens/lens-ui";
import { pageRuleChecks, RULE_CHECK_IDS, type TLensDemoDashboard, type TLensDemoPage, type TRuleCheckId, type TRuleCheckState } from "@/features/lens/lens.demo";
import { Icons } from "@/lib/frontend/icons/app-icons";

const CHECK_LABEL: Record<TRuleCheckId, "checkTitlePresent" | "checkTitleLength" | "checkDescription" | "checkH1" | "checkCanonical" | "checkNoindex" | "checkRobots" | "checkUrl" | "checkImageAlt" | "checkContent"> = {
  title_present: "checkTitlePresent",
  title_length: "checkTitleLength",
  description_present: "checkDescription",
  h1_present: "checkH1",
  canonical: "checkCanonical",
  noindex: "checkNoindex",
  robots: "checkRobots",
  url_readable: "checkUrl",
  image_alt: "checkImageAlt",
  content_length: "checkContent",
};

const CHECK_STATE: Record<TRuleCheckState, { tone: "success" | "danger" | "muted"; key: "rsPass" | "rsFinding" | "rsNotEvaluated" }> = {
  pass: { tone: "success", key: "rsPass" },
  finding: { tone: "danger", key: "rsFinding" },
  not_evaluated: { tone: "muted", key: "rsNotEvaluated" },
};

/**
 * Page detail sheet: opens from a row in the Pages table (?page=<url>). Shows the page's scan status,
 * counts, every rule check with its result, and the issue cards for this page (the same cards as SEO Health).
 */
export function LensPageSheet({ page, data, t, locale, onClose, onNavigate }: {
  page: TLensDemoPage;
  data: TLensDemoDashboard;
  t: TLensT;
  locale: string;
  onClose: () => void;
  onNavigate: (view: "pages" | "history", extra?: Record<string, string>) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const issues = data.issues.filter((i) => i.status === "open" && i.pages.includes(page.url));
  const checks = pageRuleChecks(page.url, page.state, data.issues);
  const counts = {
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    advisory: issues.filter((i) => i.severity === "advisory").length,
  };
  const scanTone = page.state === "checked" ? "success" : page.state === "failed" ? "danger" : "muted";
  const scanLabel = page.state === "checked" ? t("stateChecked") : page.state === "failed" ? t("stateFailed") : t("notEvaluated");

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button type="button" aria-label={t("close")} onClick={onClose} className="absolute inset-0 bg-overlay backdrop-blur-sm" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("pageDetailTitle")}
        className="relative flex h-full w-[min(56rem,100%)] flex-col gap-6 overflow-y-auto border-s border-border bg-bg-main p-5 shadow-(--shadow-elevated) sm:p-7 dark:border-text-primary/40"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            <span className="text-xs font-medium text-text-muted">{t("pageDetailTitle")}</span>
            <h2 className="break-all font-mono text-lg font-semibold text-text-primary">{page.url}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <LensPill tone={scanTone}>{scanLabel}</LensPill>
              <span>{t("lastCheckedShort", { time: formatWhen(data.lastCheckAt, locale) })}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary"
            aria-label={t("close")}
          >
            <Icons.cancel className="size-4" aria-hidden />
          </button>
        </header>

        <div className="grid grid-cols-3 gap-3">
          {([
            { id: "high", label: t("mustFixLabel"), value: counts.high, tone: "danger" },
            { id: "medium", label: t("shouldFixLabel"), value: counts.medium, tone: "warning" },
            { id: "advisory", label: t("worthLookLabel"), value: counts.advisory, tone: "muted" },
          ] as const).map((item) => (
            <div key={item.id} className="flex flex-col gap-1 rounded-2xl border border-border bg-text-primary/[0.03] p-4 dark:border-text-primary/35">
              <span className="text-xs text-text-muted">{item.label}</span>
              <span className="text-2xl font-semibold tabular-nums text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-text-primary">{t("ruleChecks")}</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {RULE_CHECK_IDS.map((id) => {
              const state = checks.find((c) => c.id === id)?.state ?? "not_evaluated";
              const meta = CHECK_STATE[state];
              return (
                <li key={id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 dark:border-text-primary/35">
                  <span className="text-sm text-text-primary">{t(CHECK_LABEL[id])}</span>
                  <LensPill tone={meta.tone}>{t(meta.key)}</LensPill>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-text-primary">{t("issuesOnPage")}</h3>
          {issues.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">{t("noIssuesOnPage")}</p>
          ) : (
            <ul className="flex flex-col gap-5">
              {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} t={t} locale={locale} onNavigate={onNavigate} compact />
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

