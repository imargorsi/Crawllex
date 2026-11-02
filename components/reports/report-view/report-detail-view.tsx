"use client";

import { ReportBlock } from "@/components/reports/report-view/report-view-blocks";
import { elevatedCardSurfaceClass, elevatedCardTitleClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";
import type { TReportView } from "@/lib/reports/view-model";

/**
 * In-app report. Renders the same shared view the PDF uses, section by section, so the numbers and
 * wording match the downloaded PDF exactly.
 */
export function ReportDetailView({ view }: { view: TReportView }) {
  return (
    <div className="space-y-5">
      {view.sections.map((section) => (
        <section key={section.id} className={cn(elevatedCardSurfaceClass, "rounded-3xl p-5 sm:p-6")}>
          <header className="mb-5 flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-xl border border-brand/45 bg-brand/15 text-sm font-bold text-brand">
              {section.number}
            </span>
            <h2 className={cn("text-lg font-semibold", elevatedCardTitleClass)}>{section.title}</h2>
          </header>
          <div className="space-y-5">
            {section.blocks.map((block, index) => (
              <ReportBlock key={index} block={block} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
