"use client";

import { useCallback, useState } from "react";

import {
  ChangeText,
  Emphasis,
  REPORT_ICON,
  ReportAreaChart,
  RichDoc,
  ReportCallout,
  ReportDonut,
  ReportKpiGrid,
  ReportNote,
  ReportTable,
  TONE_VAR,
} from "@/components/reports/report-view/report-view-blocks";
import { Modal } from "@/components/ui/modal";
import type { TAppIconComponent } from "@/components/ui/app-icon";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { toolbarFilterChipClass, toolbarFilterShellClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";
import type { TBlockView, TCardView, TNamedTable, TReportView, TSectionView, TTableView } from "@/lib/reports/view-model";

type TDrilldown = { title: string; description: string; table: TTableView };

type TOpenTable = (table: TTableView, title: string) => void;

const TABLE_ICON: Record<"query" | "country" | "landing" | "page" | "backlink" | "technical" | "default", TAppIconComponent> = {
  query: Icons.cursorPointer,
  country: Icons.globe,
  landing: Icons.megaphone,
  page: Icons.file,
  backlink: Icons.megaphone,
  technical: Icons.wrench,
  default: Icons.chartLine,
};

/** Table kind from its title, so the same table gets the same icon wherever it appears. */
function tableKind(title: string): keyof typeof TABLE_ICON {
  const lower = title.toLowerCase();
  if (lower.includes("quer")) return "query";
  if (lower.includes("countr")) return "country";
  if (lower.includes("backlink")) return "backlink";
  if (lower.includes("technical")) return "technical";
  if (lower.includes("landing") || lower.includes("action") || lower.includes("event")) return "landing";
  if (lower.includes("page") || lower.includes("blog")) return "page";
  return "default";
}

/** Opens a detail table in a modal. `row` is full width (drilldown list), `chip` is compact (chart header). */
function DrilldownButton({
  title,
  table,
  onOpen,
  variant,
}: {
  title: string;
  table: TTableView;
  onOpen: () => void;
  variant: "row" | "chip";
}) {
  const Icon = TABLE_ICON[tableKind(title)];
  const count = `${table.rows.length} ${table.rows.length === 1 ? "row" : "rows"}`;
  if (variant === "chip") {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="group inline-flex items-center gap-2.5 rounded-xl border border-text-primary/20 py-2 pe-3 ps-2 text-start transition-all duration-200 hover:border-brand/60 hover:shadow-[0_10px_24px_-16px_var(--brand)]"
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-brand/50 text-brand">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-semibold leading-tight text-text-primary">{title}</span>
          <span className="text-xs leading-tight text-text-muted">{count}</span>
        </span>
        <Icons.arrowRight className="size-3.5 text-text-muted transition-colors group-hover:text-brand" aria-hidden />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-2xl border border-text-primary/20 px-5 py-4 text-start transition-all duration-200 hover:border-brand/60 hover:shadow-[0_14px_30px_-18px_var(--brand)]"
    >
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand/50 text-brand">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold text-text-primary">{title}</span>
        <span className="mt-0.5 block text-sm text-text-muted">{count} this month</span>
      </span>
      <Icons.arrowRight className="size-4 shrink-0 text-text-muted transition-colors group-hover:text-brand" aria-hidden />
    </button>
  );
}

/** Section tabs, same pill style as the other module tabs. Right-aligned. One section shows at a time. */
function SectionTabs({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div id="report-section-tabs" className="flex justify-end scroll-mt-24">
      <div role="tablist" aria-label="Report sections" className={toolbarFilterShellClass}>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(item.id)}
              className={cn(
                toolbarFilterChipClass,
                isActive ? "bg-brand text-text-on-brand shadow-xs" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Section sub-heading with a brand rule, used the same way in every section. */
function SubHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-1 rounded-full bg-brand" aria-hidden />
      <h3 className="text-xl font-semibold tracking-tight text-text-primary">{title}</h3>
    </div>
  );
}

/** Highlight card: icon, label, big number and the plain-language line. Cards with a table open it in a modal. */
function HighlightCard({ card, onOpen }: { card: TCardView; onOpen: TOpenTable }) {
  const Icon = REPORT_ICON[card.icon];
  const tone = card.empty ? "neutral" : card.tone;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className="inline-flex size-11 items-center justify-center rounded-xl border"
          style={{ borderColor: TONE_VAR[tone], color: TONE_VAR[tone], opacity: card.empty ? 0.5 : 1 }}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        {card.table ? (
          <span className="inline-flex size-8 items-center justify-center rounded-full border border-text-primary/15 text-text-muted transition-colors group-hover:border-brand/60 group-hover:text-brand">
            <Icons.arrowRight className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="mt-auto space-y-1">
        <p className="text-sm font-medium text-text-muted">{card.label}</p>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className={cn("text-4xl font-bold tabular-nums tracking-tight", card.empty ? "text-text-muted/50" : "text-text-primary")}>{card.value}</p>
          {card.change && !card.empty ? <ChangeText change={card.change} className="text-sm font-bold" /> : null}
        </div>
      </div>
      <Emphasis
        text={card.body || " "}
        className={cn("min-h-[2.75rem] text-sm leading-relaxed", card.empty ? "text-text-muted" : "text-text-secondary")}
      />
    </>
  );
  const base = cn(
    "group flex h-full w-full flex-col gap-4 rounded-2xl border p-5 text-start transition-all duration-200",
    card.empty ? "border-text-primary/10" : "border-text-primary/20",
  );
  if (!card.table) return <article className={base}>{body}</article>;
  const table = card.table;
  return (
    <button type="button" onClick={() => onOpen(table, card.label)} className={cn(base, "hover:border-brand/60 hover:shadow-[0_14px_30px_-18px_var(--brand)]")}>
      {body}
    </button>
  );
}

/** Charts with their drilldown tables as chips in the header. One chart per series, so scales do not hide each other. */
function ChartCard({
  title,
  charts,
  tables,
  onOpen,
  fill = false,
}: {
  title: string | null;
  charts: { title: string; chart: Parameters<typeof ReportAreaChart>[0]["chart"] }[];
  tables: TNamedTable[];
  onOpen: TOpenTable;
  /** Stretch to the height of the row (used beside the channel pie). */
  fill?: boolean;
}) {
  const single = charts.length === 1;
  if (fill && single) {
    return (
      <section className="flex h-full flex-col rounded-2xl border border-text-primary/20 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {title ? <h4 className="text-base font-semibold text-text-primary">{title}</h4> : <span />}
          {tables.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tables.map((named) => (
                <DrilldownButton key={named.title} title={named.title} table={named.table} onOpen={() => onOpen(named.table, named.title)} variant="chip" />
              ))}
            </div>
          ) : null}
        </div>
        <div className="relative mt-5 min-h-[22rem] flex-1">
          <ReportAreaChart chart={charts[0].chart} fill />
        </div>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-text-primary/20 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {title ? <h4 className="text-base font-semibold text-text-primary">{title}</h4> : <span />}
        {tables.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tables.map((named) => (
              <DrilldownButton key={named.title} title={named.title} table={named.table} onOpen={() => onOpen(named.table, named.title)} variant="chip" />
            ))}
          </div>
        ) : null}
      </div>
      <div className={cn("mt-5 grid gap-6", single ? "" : "lg:grid-cols-2")}>
        {charts.map((item) => (
          <div key={item.title} className="min-w-0 space-y-3">
            {single ? null : <p className="text-sm font-medium text-text-muted">{item.title}</p>}
            <ReportAreaChart chart={item.chart} heightClass={single ? "h-[22rem]" : "h-64"} colorOffset={charts.indexOf(item)} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Channel pie with an optional short list (top countries) under it. Stretches to match the chart beside it. */
function DonutCard({ block }: { block: Extract<TBlockView, { type: "donut" }> }) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-text-primary/20 p-5 sm:p-6">
      <h4 className="mb-5 text-base font-semibold text-text-primary">{block.title}</h4>
      <div className="flex flex-1 items-center justify-center">
        <ReportDonut rows={block.rows} />
      </div>
      {block.list ? (
        <div className="mt-6 space-y-3 border-t border-text-primary/15 pt-5">
          <h5 className="text-xs font-semibold uppercase tracking-widest text-text-muted">{block.list.title}</h5>
          {block.list.rows.length > 0 ? (
            <ul className="divide-y divide-text-primary/10">
              {block.list.rows.map((row, index) => (
                <li key={row.label} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-4 shrink-0 text-xs tabular-nums text-text-muted">{index + 1}</span>
                    <span className="truncate text-text-primary">{row.label}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-text-primary">{row.value.toLocaleString("en-US")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">{block.list.emptyText}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function SectionBlock({ block, onOpen }: { block: TBlockView; onOpen: TOpenTable }) {
  switch (block.type) {
    case "heading":
      return <SubHeading title={block.title} />;
    case "rich":
      return <RichDoc doc={block.doc} />;
    case "prose":
      return (
        <div className="max-w-4xl space-y-3">
          {block.title ? <h4 className="text-base font-semibold text-text-primary">{block.title}</h4> : null}
          <div className="flex flex-col gap-4">
            <Emphasis
              text={block.body}
              className={block.variant === "lead" ? "text-lg leading-relaxed text-text-primary" : "text-[15px] leading-relaxed text-text-secondary"}
            />
          </div>
        </div>
      );
    case "cards":
      return (
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted">{block.title}</h4>
          <div className="flex flex-wrap gap-4">
            {block.items.map((card) => (
              <div key={card.label} className="min-w-0 basis-full sm:basis-[calc(50%_-_0.5rem)] xl:basis-[calc(25%_-_0.75rem)]">
                <HighlightCard card={card} onOpen={onOpen} />
              </div>
            ))}
          </div>
        </div>
      );
    case "kpis":
      return <ReportKpiGrid items={block.items} />;
    case "line":
      return <ChartCard title={block.title} charts={block.charts} tables={block.tables} onOpen={onOpen} />;
    case "donut":
      return <DonutCard block={block} />;
    case "bullets":
      return (
        <section className="space-y-4">
          <h4 className="text-base font-semibold text-text-primary">{block.title}</h4>
          <ul className="space-y-3">
            {block.items.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                <Icons.checkCircle className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
                <Emphasis text={item} className="min-w-0" />
              </li>
            ))}
          </ul>
        </section>
      );
    case "table":
      return block.table.rows.length > 0 ? (
        <DrilldownButton title={block.title} table={block.table} onOpen={() => onOpen(block.table, block.title)} variant="row" />
      ) : null;
    case "callout":
      return <ReportCallout text={block.text} />;
    case "note":
      return <ReportNote text={block.text} />;
  }
}

type TBlockGroup =
  | { kind: "single"; block: TBlockView }
  | { kind: "pair"; line: Extract<TBlockView, { type: "line" }>; donut: Extract<TBlockView, { type: "donut" }> }
  | { kind: "tables"; blocks: Extract<TBlockView, { type: "table" }>[] };

/** Puts a chart and its pie side by side, and lays consecutive tables out as a row of chips. */
function groupBlocks(blocks: TBlockView[]): TBlockGroup[] {
  const groups: TBlockGroup[] = [];
  blocks.forEach((block, index) => {
    const next = blocks[index + 1];
    const previous = groups[groups.length - 1];
    if (block.type === "line" && next?.type === "donut") {
      groups.push({ kind: "pair", line: block, donut: next });
      return;
    }
    if (block.type === "donut" && previous?.kind === "pair") return;
    if (block.type === "table") {
      if (previous?.kind === "tables") {
        previous.blocks.push(block);
      } else {
        groups.push({ kind: "tables", blocks: [block] });
      }
      return;
    }
    groups.push({ kind: "single", block });
  });
  return groups;
}

function BlockGroup({ group, onOpen }: { group: TBlockGroup; onOpen: TOpenTable }) {
  if (group.kind === "pair") {
    return (
      <div className="grid gap-6 lg:h-[40rem] lg:grid-cols-5">
        <div className="flex min-w-0 flex-col lg:col-span-3">
          <ChartCard title={group.line.title} charts={group.line.charts} tables={group.line.tables} onOpen={onOpen} fill />
        </div>
        <div className="flex min-w-0 flex-col lg:col-span-2">
          <DonutCard block={group.donut} />
        </div>
      </div>
    );
  }
  if (group.kind === "tables") {
    return (
      <div className={cn("grid gap-4", group.blocks.length > 1 ? "md:grid-cols-2 xl:grid-cols-3" : "")}>
        {group.blocks.map((block, index) => (
          <SectionBlock key={index} block={block} onOpen={onOpen} />
        ))}
      </div>
    );
  }
  return <SectionBlock block={group.block} onOpen={onOpen} />;
}

/** `?section=search` (from the PDF's "View the full breakdown" links) opens that tab. Client-only: runs after the report loads. */
function initialSectionId(view: TReportView): string {
  if (typeof window === "undefined") return "summary";
  const requested = new URLSearchParams(window.location.search).get("section");
  return view.sections.some((section) => section.id === requested) ? (requested as string) : "summary";
}

export function ReportDetailView({ view }: { view: TReportView }) {
  const [drilldown, setDrilldown] = useState<TDrilldown | null>(null);
  const [activeId, setActiveId] = useState<string>(() => initialSectionId(view));
  const close = useCallback(() => setDrilldown(null), []);

  const tabs = view.sections.map((section) => ({ id: section.id, label: section.title }));
  // Executive summary by default. Falls back to the first section if the id is unknown.
  const current: TSectionView | undefined = view.sections.find((section) => section.id === activeId) ?? view.sections[0];

  const selectTab = (id: string) => {
    setActiveId(id);
    document.getElementById("report-section-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openTable: TOpenTable = (table, title) => {
    setDrilldown({ title, description: current?.title ?? "", table });
  };

  return (
    <div className="space-y-6">
      <SectionTabs items={tabs} activeId={current?.id ?? ""} onSelect={selectTab} />

      {current ? (
        <div key={current.id} className="report-tab-enter space-y-10">
          <div className="flex items-end gap-4 border-b border-text-primary/15 pb-4">
            <span className="text-4xl font-bold tabular-nums text-text-muted/60">{current.number}</span>
            <h2 className="text-3xl font-semibold tracking-tight text-text-primary">{current.title}</h2>
          </div>
          {groupBlocks(current.blocks).map((group, index) => (
            <BlockGroup key={index} group={group} onOpen={openTable} />
          ))}
        </div>
      ) : (
        <ReportCallout text="No report content." />
      )}

      <Modal open={Boolean(drilldown)} onClose={close} title={drilldown?.title ?? ""} description={drilldown?.description} className="w-[min(100%-1.5rem,64rem)]">
        {drilldown ? <ReportTable table={drilldown.table} /> : null}
      </Modal>
    </div>
  );
}
