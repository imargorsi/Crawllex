"use client";

import { REPORT_PALETTE } from "@/lib/reports/constants";
import { Icons } from "@/lib/frontend/icons/app-icons";

/** Report header: cover artwork, client, period, and actions on the artwork. */
export function ReportHero({
  clientName,
  monthTitle,
  periodLabel,
  createdAt,
  actions,
}: {
  clientName: string;
  monthTitle: string;
  periodLabel: string;
  createdAt: string;
  actions: React.ReactNode;
}) {
  return (
    <header
      className="relative overflow-hidden rounded-3xl border border-border/60 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.7)]"
      style={{ background: `linear-gradient(120deg, ${REPORT_PALETTE.accentDark}, ${REPORT_PALETTE.accent})` }}
    >
      <img
        src="/report-assets/cover-report.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-60 motion-safe:animate-[report-cover-pan_18s_ease-in-out_infinite]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" aria-hidden />
      <div className="relative flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
        <div className="min-w-0 space-y-3">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
            <Icons.globe className="size-3.5" aria-hidden />
            {clientName}
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">{monthTitle}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/55 bg-brand/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Icons.calendar className="size-3.5" aria-hidden />
              {periodLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
              <Icons.clock className="size-3.5" aria-hidden />
              {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(createdAt))}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
