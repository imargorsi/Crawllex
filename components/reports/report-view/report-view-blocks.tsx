"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { AppTable, type TAppTableColumn } from "@/components/table/app-table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { TBlockView, TKpiView, TReportTone, TTableView, TSeriesView } from "@/lib/reports/view-model";

/** Tone → theme token. The shared view carries tones, not colours, so the UI stays on theme tokens. */
const TONE_VAR: Record<TReportTone, string> = {
  brand: "var(--brand)",
  cyan: "var(--status-invited)",
  emerald: "var(--status-active)",
  amber: "var(--status-pending)",
  neutral: "var(--text-muted)",
};

const TONE_TEXT: Record<TReportTone, string> = {
  brand: "text-brand",
  cyan: "text-[var(--status-invited)]",
  emerald: "text-[var(--status-active)]",
  amber: "text-[var(--status-pending)]",
  neutral: "text-text-muted",
};

const CHANGE_TEXT = {
  up: "text-[var(--status-active)]",
  down: "text-[var(--status-rejected)]",
  flat: "text-text-muted",
  none: "text-text-muted",
} as const;

export function ReportKpiTile({ item }: { item: TKpiView }) {
  return (
    <div
      className="rounded-2xl border-[1.5px] bg-transparent px-4 py-3.5 shadow-[0_14px_28px_-12px_rgba(0,0,0,0.65)]"
      style={{ borderColor: TONE_VAR[item.tone] }}
    >
      <p className="text-xs font-semibold text-text-muted">{item.label}</p>
      <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", TONE_TEXT[item.tone])}>{item.value}</p>
      {item.change ? (
        <p className={cn("mt-1 text-xs font-medium", CHANGE_TEXT[item.change.direction])}>{item.change.text}</p>
      ) : null}
    </div>
  );
}

function ReportLine({ chart }: { chart: TSeriesView }) {
  const keys = chart.series.map((_, index) => `series${index}`);
  const data = chart.dates.map((date, index) => {
    const row: Record<string, string | number | null> = { date: shortDate(date) };
    chart.series.forEach((series, seriesIndex) => {
      row[keys[seriesIndex]] = series.values[index] ?? null;
    });
    return row;
  });
  const config: ChartConfig = Object.fromEntries(
    chart.series.map((series, index) => [keys[index], { label: series.name, color: `var(--chart-${index + 1})` }]),
  );
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full" initialDimension={{ width: 640, height: 256 }}>
      <LineChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} width={44} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {keys.map((key) => (
          <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2.4} dot={false} />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(day)}/${Number(month)}`;
}

function ReportBars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-text-primary">{row.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-bg-hover">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(row.value / max) * 100}%`, background: "var(--brand)" }}
            />
          </span>
          <span className="font-semibold tabular-nums text-text-primary">{row.value.toLocaleString("en-US")}</span>
        </li>
      ))}
    </ul>
  );
}

function ReportTable({ table }: { table: TTableView }) {
  const columns: TAppTableColumn<{ id: string; cells: string[] }>[] = table.headers.map((header, index) => ({
    key: `col-${index}`,
    label: header,
    align: index === 0 ? "start" : "end",
    render: (item) => (
      <span className={cn(index === 0 ? "text-text-primary" : "tabular-nums text-text-muted")}>{item.cells[index]}</span>
    ),
  }));
  return (
    <AppTable
      columns={columns}
      data={table.rows.map((cells, index) => ({ id: `${index}`, cells }))}
      getRowId={(item) => item.id}
      emptyTitle={table.emptyText}
      emptyBody=""
    />
  );
}

export function ReportBlock({ block }: { block: TBlockView }) {
  switch (block.type) {
    case "paragraphs":
      return (
        <div className="space-y-2.5">
          {block.items.map((text) => (
            <p key={text} className="text-sm leading-relaxed text-text-secondary">
              {text}
            </p>
          ))}
        </div>
      );
    case "list":
      return (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-text-primary">{block.title}</h4>
          <ul className="list-disc space-y-1.5 ps-5 text-sm leading-relaxed text-text-secondary">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );
    case "kpis":
      return (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {block.items.map((item) => (
            <ReportKpiTile key={item.label} item={item} />
          ))}
        </div>
      );
    case "chips":
      return (
        <div className="grid grid-cols-3 gap-3">
          {block.items.map((item) => (
            <ReportKpiTile key={item.label} item={{ ...item, change: null }} />
          ))}
        </div>
      );
    case "line":
      return <ReportLine chart={block.chart} />;
    case "bars":
      return (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text-primary">{block.title}</h4>
          <ReportBars rows={block.rows} />
        </div>
      );
    case "table":
      return (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text-primary">{block.title}</h4>
          <ReportTable table={block.table} />
        </div>
      );
    case "callout":
      return (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-text-primary">{block.title}</h4>
          <p className="rounded-xl border-s-[3px] border-brand bg-bg-hover px-4 py-3 text-sm text-text-secondary">{block.text}</p>
        </div>
      );
    case "note":
      return <p className="text-sm italic text-text-muted">{block.text}</p>;
  }
}
