"use client";

import { useCallback, useState } from "react";

import {
  ReportAreaChart,
  ReportCallout,
  ReportKpiGrid,
  ReportList,
  ReportNote,
  ReportPanel,
  ReportParagraphs,
  ReportTable,
  TONE_VAR,
} from "@/components/reports/report-view/report-view-blocks";
import { Modal } from "@/components/ui/modal";
import { Icons } from "@/lib/frontend/icons/app-icons";
import type { TAppIconComponent } from "@/components/ui/app-icon";
import type { TBlockView, TReportTone, TReportView, TSectionView, TTableView } from "@/lib/reports/view-model";

type TBlockOf<T extends TBlockView["type"]> = Extract<TBlockView, { type: T }>;

type TDrilldown = { title: string; description: string; table: TTableView };

function blocksOf<T extends TBlockView["type"]>(section: TSectionView | undefined, type: T): TBlockOf<T>[] {
  return section ? section.blocks.filter((block): block is TBlockOf<T> => block.type === type) : [];
}

function sectionById(view: TReportView, id: TSectionView["id"]): TSectionView | undefined {
  return view.sections.find((section) => section.id === id);
}

/** Pill that opens a detail table in a modal. The table is the same data the PDF prints. */
function DrilldownPill({
  label,
  count,
  icon: Icon,
  onOpen,
}: {
  label: string;
  count: number;
  icon: TAppIconComponent;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-2xl border border-border/70 bg-bg-card/40 px-4 py-3.5 text-start transition-all duration-200 hover:border-brand/55 hover:bg-brand/8 hover:shadow-[0_12px_28px_-16px_var(--brand)]"
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand/40 bg-brand/12 text-brand">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text-primary">{label}</span>
        <span className="mt-0.5 block text-xs text-text-muted">
          {count} {count === 1 ? "row" : "rows"} this month
        </span>
      </span>
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 text-text-muted transition-all duration-200 group-hover:border-brand/55 group-hover:text-brand">
        <Icons.arrowRight className="size-3.5" aria-hidden />
      </span>
    </button>
  );
}

/** Jump links to each section, so the page reads like a dashboard with a clear outline. */
function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="Report sections" className="sticky top-3 z-20 -mx-1 flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-bg-card/70 p-1.5 backdrop-blur-xl">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/** Small chip with a tone dot, for contact actions and lead sources. */
function ReportStat({ label, value, tone }: { label: string; value: string; tone: TReportTone }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-bg-card/40 px-4 py-3">
      <span className="flex min-w-0 items-center gap-2 text-sm text-text-muted">
        <span className="size-2 shrink-0 rounded-full" style={{ background: TONE_VAR[tone] }} aria-hidden />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-lg font-semibold tabular-nums text-text-primary">{value}</span>
    </div>
  );
}

function pickDrilldowns(section: TSectionView | undefined, count: number): TDrilldown[] {
  return blocksOf(section, "table").slice(0, count).map((block) => ({
    title: block.title,
    description: "",
    table: block.table,
  }));
}

export function ReportDetailView({ view }: { view: TReportView }) {
  const [drilldown, setDrilldown] = useState<TDrilldown | null>(null);
  const close = useCallback(() => setDrilldown(null), []);

  const summary = sectionById(view, "summary");
  const search = sectionById(view, "search");
  const searchPages = sectionById(view, "searchPages");
  const traffic = sectionById(view, "traffic");
  const audience = sectionById(view, "audience");
  const engagement = sectionById(view, "engagement");
  const leads = sectionById(view, "leads");

  const [queries] = pickDrilldowns(search, 1);
  const [pages] = pickDrilldowns(searchPages, 1);
  const [countries, landing] = pickDrilldowns(audience, 2);
  const [actions] = pickDrilldowns(engagement, 1);
  const [work, blogs] = pickDrilldowns(leads, 2);
  const sources = blocksOf(leads, "donut")[0];

  const open = (item: TDrilldown | undefined, description: string) => {
    if (!item) return;
    setDrilldown({ ...item, description });
  };

  const navItems = [
    summary && { id: "summary", label: summary.title },
    search && { id: "search", label: search.title },
    traffic && { id: "traffic", label: traffic.title },
    engagement && { id: "engagement", label: engagement.title },
    leads && { id: "leads", label: leads.title },
  ].filter((item): item is { id: string; label: string } => Boolean(item));

  return (
    <div className="space-y-6">
      <SectionNav items={navItems} />

      {summary ? (
        <ReportPanel id="summary" title={summary.title} icon={Icons.analytics} number={summary.number}>
          {blocksOf(summary, "kpis").map((block, index) => (
            <ReportKpiGrid key={index} items={block.items} />
          ))}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">{blocksOf(summary, "list")[0]?.title}</h3>
              <ReportList items={blocksOf(summary, "list")[0]?.items ?? []} />
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">{blocksOf(summary, "list")[1]?.title}</h3>
              <ReportList items={blocksOf(summary, "list")[1]?.items ?? []} />
            </div>
          </div>
        </ReportPanel>
      ) : null}

      {search ? (
        <ReportPanel id="search" title={search.title} icon={Icons.cursorPointer} number={search.number}>
          {blocksOf(search, "kpis").map((block, index) => (
            <ReportKpiGrid key={index} items={block.items} />
          ))}
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-5 lg:col-span-3">
              {blocksOf(search, "paragraphs").map((block, index) => (
                <ReportParagraphs key={index} items={block.items} />
              ))}
            </div>
            <div className="space-y-3 lg:col-span-2">
              {queries ? <DrilldownPill label={queries.title} count={queries.table.rows.length} icon={Icons.cursorPointer} onOpen={() => open(queries, search.title)} /> : null}
              {pages ? <DrilldownPill label={pages.title} count={pages.table.rows.length} icon={Icons.file} onOpen={() => open(pages, search.title)} /> : null}
            </div>
          </div>
          {blocksOf(search, "line").map((block, index) => (
            <ReportAreaChart key={index} chart={block.chart} />
          ))}
          {blocksOf(search, "note").map((block, index) => (
            <ReportNote key={index} text={block.text} />
          ))}
        </ReportPanel>
      ) : null}

      {traffic ? (
        <ReportPanel id="traffic" title={traffic.title} icon={Icons.chartLine} number={traffic.number}>
          {blocksOf(traffic, "kpis").map((block, index) => (
            <ReportKpiGrid key={index} items={block.items} />
          ))}
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-5 lg:col-span-3">
              {blocksOf(traffic, "paragraphs").map((block, index) => (
                <ReportParagraphs key={index} items={block.items} />
              ))}
            </div>
            <div className="space-y-3 lg:col-span-2">
              {countries ? <DrilldownPill label={countries.title} count={countries.table.rows.length} icon={Icons.globe} onOpen={() => open(countries, traffic.title)} /> : null}
              {landing ? <DrilldownPill label={landing.title} count={landing.table.rows.length} icon={Icons.megaphone} onOpen={() => open(landing, traffic.title)} /> : null}
            </div>
          </div>
          {blocksOf(traffic, "line").map((block, index) => (
            <ReportAreaChart key={index} chart={block.chart} />
          ))}
          {blocksOf(traffic, "note").map((block, index) => (
            <ReportNote key={index} text={block.text} />
          ))}
        </ReportPanel>
      ) : null}

      {engagement || leads ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {engagement ? (
            <ReportPanel id="engagement" title={engagement.title} icon={Icons.userGroup} number={engagement.number}>
              {blocksOf(engagement, "kpis").map((block, index) => (
                <ReportKpiGrid key={index} items={block.items} columns={2} />
              ))}
              <div className="grid gap-3">
                {blocksOf(engagement, "chips")[0]?.items.map((item) => (
                  <ReportStat key={item.label} label={item.label} value={item.value} tone={item.tone} />
                ))}
              </div>
              {blocksOf(engagement, "paragraphs").map((block, index) => (
                <ReportParagraphs key={index} items={block.items} />
              ))}
              {actions ? <DrilldownPill label={actions.title} count={actions.table.rows.length} icon={Icons.view} onOpen={() => open(actions, engagement.title)} /> : null}
            </ReportPanel>
          ) : null}

          {leads ? (
            <ReportPanel id="leads" title={leads.title} icon={Icons.userGroup} number={leads.number}>
              {blocksOf(leads, "kpis").map((block, index) => (
                <ReportKpiGrid key={index} items={block.items} columns={2} />
              ))}
              {sources ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary">{sources.title}</h3>
                  <div className="grid gap-3">
                    {sources.rows.map((row, index) => (
                      <ReportStat key={row.label} label={row.label} value={row.value.toLocaleString("en-US")} tone={(["brand", "cyan", "emerald", "amber"] as const)[index % 4]} />
                    ))}
                  </div>
                </div>
              ) : null}
              {blocksOf(leads, "paragraphs").map((block, index) => (
                <ReportParagraphs key={index} items={block.items} />
              ))}
              <div className="grid gap-3">
                {work ? <DrilldownPill label={work.title} count={work.table.rows.length} icon={Icons.chartLine} onOpen={() => open(work, leads.title)} /> : null}
                {blogs ? <DrilldownPill label={blogs.title} count={blogs.table.rows.length} icon={Icons.file} onOpen={() => open(blogs, leads.title)} /> : null}
              </div>
            </ReportPanel>
          ) : null}
        </div>
      ) : null}

      {!summary && !search && !traffic && !leads ? <ReportCallout text="No report content." /> : null}

      <Modal
        open={Boolean(drilldown)}
        onClose={close}
        title={drilldown?.title ?? ""}
        description={drilldown?.description}
      >
        {drilldown ? <ReportTable table={drilldown.table} /> : null}
      </Modal>
    </div>
  );
}

