"use client";

import { useId } from "react";
import { Area, AreaChart, Cell, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";

import { AppTable, type TAppTableColumn } from "@/components/table/app-table";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { elevatedCardMutedClass, elevatedCardTitleClass } from "@/lib/frontend/layout/dashboard-chrome";
import type { TAppIconComponent } from "@/components/ui/app-icon";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";
import { PARAGRAPH_BREAK } from "@/lib/reports/report-text";
import type { TChangeView, TKpiView, TReportIcon, TReportTone, TSeriesView, TTableView } from "@/lib/reports/view-model";

/** Tone → theme token. The shared view carries tones, not colours, so the UI stays on theme tokens. */
export const TONE_VAR: Record<TReportTone, string> = {
  brand: "var(--brand)",
  cyan: "var(--status-invited)",
  emerald: "var(--status-active)",
  amber: "var(--status-pending)",
  neutral: "var(--text-muted)",
};

const CHANGE_TEXT = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-rose-600 dark:text-rose-400",
  flat: "text-text-muted",
  none: "text-text-muted",
} as const;

/** Trend text ("▲ 9.0% vs previous"), coloured by direction. Used by KPI tiles and highlight cards. */
export function ChangeText({ change, className }: { change: TChangeView; className?: string }) {
  return <p className={cn(className, CHANGE_TEXT[change.direction])}>{change.text}</p>;
}

/** Series colours: brand, cyan, emerald, amber. Distinct per series, same tokens as the KPI tones. */
const CHART_COLORS = [TONE_VAR.brand, TONE_VAR.cyan, TONE_VAR.emerald, TONE_VAR.amber] as const;

/** App icon per report icon key. KPI tiles and highlight cards both read from here. */
export const REPORT_ICON: Record<TReportIcon, TAppIconComponent> = {
  clicks: Icons.cursorPointer,
  impressions: Icons.view,
  ctr: Icons.chartLine,
  position: Icons.chartBar,
  sessions: Icons.analytics,
  users: Icons.userGroup,
  newUsers: Icons.userAdd,
  organic: Icons.chartLine,
  engagementRate: Icons.chartLine,
  time: Icons.clock,
  pageViews: Icons.view,
  engaged: Icons.userGroup,
  leads: Icons.userGroup,
  calls: Icons.call,
  emails: Icons.mail,
  whatsapp: Icons.message,
  blogs: Icons.file,
  backlinks: Icons.megaphone,
  technical: Icons.wrench,
};

function ReportKpi({ item }: { item: TKpiView }) {
  const Icon = REPORT_ICON[item.icon];
  const tone = item.empty ? "neutral" : item.tone;
  return (
    <div className={cn("flex min-w-0 items-start gap-3 rounded-2xl border p-4", item.empty ? "border-text-primary/10" : "border-text-primary/20")}>
      <span
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border"
        style={{ borderColor: TONE_VAR[tone], color: TONE_VAR[tone], opacity: item.empty ? 0.5 : 1 }}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className={cn("truncate text-xs font-medium", elevatedCardMutedClass)}>{item.label}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className={cn("text-3xl font-bold tabular-nums tracking-tight", item.empty ? "text-text-muted/50" : elevatedCardTitleClass)}>{item.value}</p>
          {item.change && !item.empty ? (
            <ChangeText change={item.change} className="text-sm font-bold" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Splits a text into paragraphs and bolds the figures, so numbers stand out when skimming. */
export function Emphasis({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(PARAGRAPH_BREAK).filter(Boolean);
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={className}>
          {paragraph.split(/(\d[\d,]*(?:\.\d+)?%?)/g).map((part, partIndex) => {
            if (!/^\d/.test(part)) return <span key={partIndex}>{part}</span>;
            const isYear = /^(19|20)\d{2}$/.test(part);
            return isYear ? <span key={partIndex}>{part}</span> : <strong key={partIndex} className="font-semibold text-brand">{part}</strong>;
          })}
        </p>
      ))}
    </>
  );
}

export function ReportKpiGrid({ items, columns = 4 }: { items: TKpiView[]; columns?: 2 | 4 }) {
  return (
    <div className={cn("grid gap-3", columns === 4 ? "grid-cols-2 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2")}>
      {items.map((item) => (
        <ReportKpi key={item.label} item={item} />
      ))}
    </div>
  );
}

export function ReportAreaChart({ chart, heightClass = "h-72", colorOffset = 0, fill = false }: { chart: TSeriesView; heightClass?: string; colorOffset?: number; fill?: boolean }) {
  const gradientId = useId().replace(/:/g, "");
  const keys = chart.series.map((_, index) => `series${index}`);
  const data = chart.dates.map((date, index) => {
    const row: Record<string, string | number | null> = { date: shortDate(date) };
    chart.series.forEach((series, seriesIndex) => {
      row[keys[seriesIndex]] = series.values[index] ?? null;
    });
    return row;
  });
  const config: ChartConfig = Object.fromEntries(
    chart.series.map((series, index) => [keys[index], { label: series.name, color: CHART_COLORS[(index + colorOffset) % CHART_COLORS.length] }]),
  );
  return (
    <ChartContainer config={config} className={cn("aspect-auto w-full", fill ? "absolute inset-0" : heightClass)} initialDimension={{ width: 640, height: 352 }}>
      <AreaChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {keys.map((key) => (
            <linearGradient key={key} id={`fill-${gradientId}-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--color-${key})`} stopOpacity={0.28} />
              <stop offset="100%" stopColor={`var(--color-${key})`} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.35} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} width={44} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {keys.map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="linear"
            stroke={`var(--color-${key})`}
            strokeWidth={2.5}
            fill={`url(#fill-${gradientId}-${key})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(day)}/${Number(month)}`;
}

export function ReportDonut({ rows }: { rows: { label: string; value: number }[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const config: ChartConfig = Object.fromEntries(rows.map((row, index) => [`slice${index}`, { label: row.label, color: CHART_COLORS[index % CHART_COLORS.length] }]));
  const slices = rows.map((row, index) => ({ name: row.label, value: row.value, fill: CHART_COLORS[index % CHART_COLORS.length] }));
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <ChartContainer config={config} className="aspect-square h-44 w-44 shrink-0" initialDimension={{ width: 176, height: 176 }}>
        <PieChart>
          <Pie data={slices} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} strokeWidth={0} paddingAngle={2}>
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: slice.fill }} aria-hidden />
              <span className="truncate text-text-primary">{slice.name}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-text-primary">
              {slice.value.toLocaleString("en-US")}
              <span className="ms-1.5 text-xs font-normal text-text-muted">
                {total > 0 ? `${Math.round((slice.value / total) * 100)}%` : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportTable({ table }: { table: TTableView }) {
  const columns: TAppTableColumn<{ id: string; cells: string[] }>[] = table.headers.map((header, index) => ({
    key: `col-${index}`,
    label: header,
    align: index === 0 ? "start" : "end",
    render: (item) => (
      <span className={cn("whitespace-nowrap", index === 0 ? "block max-w-[32rem] truncate text-text-primary" : "tabular-nums text-text-muted")} title={item.cells[index]}>
        {item.cells[index]}
      </span>
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

export function ReportNote({ text }: { text: string }) {
  return <p className="text-sm italic text-text-muted">{text}</p>;
}

export function ReportCallout({ text }: { text: string }) {
  return <p className="rounded-2xl border border-brand/50 px-4 py-3 text-sm text-text-primary">{text}</p>;
}

