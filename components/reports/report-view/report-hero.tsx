"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

/** Report header: client, period, and actions. Headline numbers are shown in the sections below. */
export function ReportHero({
  clientName,
  clientLogoDataUri,
  monthTitle,
  periodLabel,
  createdAt,
  actions,
}: {
  clientName: string;
  clientLogoDataUri: string | null;
  monthTitle: string;
  periodLabel: string;
  createdAt: string;
  actions: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-text-primary/20 p-6 sm:p-8">
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          {clientLogoDataUri ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URI from the report snapshot
            <img src={clientLogoDataUri} alt={clientName} className="mb-4 h-12 w-auto max-w-[14rem] object-contain" />
          ) : (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
              <Icons.globe className="size-3.5" aria-hidden />
              {clientName}
            </span>
          )}
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl">{monthTitle}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-text-primary/25 px-3 py-1 text-xs font-semibold text-text-primary">
              <Icons.calendar className="size-3.5" aria-hidden />
              {periodLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-text-primary/15 px-3 py-1 text-xs font-medium text-text-muted">
              <Icons.clock className="size-3.5" aria-hidden />
              Created {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(createdAt))}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>

    </header>
  );
}
