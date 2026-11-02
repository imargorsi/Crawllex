"use client";

import { useId } from "react";
import { Area, AreaChart, Cell, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";

import { AppTable, type TAppTableColumn } from "@/components/table/app-table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { TAppIconComponent } from "@/components/ui/app-icon";
import { elevatedCardMutedClass, elevatedCardSurfaceClass, elevatedCardTitleClass } from "@/lib/frontend/layout/dashboard-chrome";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";
import type { TKpiView, TReportTone, TSeriesView, TTableView } from "@/lib/reports/view-model";

/** Tone → theme token. The shared view carries tones, not colours, so the UI stays on theme tokens. */
export const TONE_VAR: Record<TReportTone, string> = {
  brand: "var(--brand)",
  cyan: "var(--status-invited)",
  emerald: "var(--status-active)",
  amber: "var(--status-pending)",
  neutral: "var(--text-muted)",
};

const CHANGE_TEXT = {
  up: "text-[var(--status-active)]",
  down: "text-[var(--status-rejected)]",
  flat: "text-text-muted",
  none: "text-text-muted",
} as const;

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"] as const;

/** Icon per KPI label, so the same metric looks the same wherever it appears. */
const KPI_ICON: Record<string, TAppIconComponent> = {
  "Search clicks": Icons.cursorPointer,
  Clicks: Icons.cursorPointer,
  Impressions: Icons.view,
  CTR: Icons.chartLine,
  "Click-through rate": Icons.chartLine,
  "Avg position": Icons.chartBar,
  Sessions: Icons.analytics,
  Users: Icons.userGroup,
  "New users": Icons.userAdd,
  "Organic sessions": Icons.chartLine,
  Leads: Icons.userGroup,
  "Blog posts": Icons.file,
  Backlinks: Icons.megaphone,
  "Technical tasks": Icons.access,
  "Engagement rate": Icons.chartLine,
  "Avg time on site": Icons.clock,
  "Page views": Icons.view,
  "Engaged sessions": Icons.userGroup,
  Calls: Icons.call,
  "Email clicks": Icons.mail,
  "WhatsApp clicks": Icons.megaphone,
};

export function ReportPanel({
  title,
  icon: Icon,
  number,
  children,
  className,
}: {
  title: string;
  icon?: TAppIconComponent;
  number?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(elevatedCardSurfaceClass, "flex min-w-0 flex-col gap-5 rounded-3xl p-5 sm:p-6", className)}>
      <header className="flex items-center gap-3 border-b border-border/60 pb-4">
        {Icon ? (
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand/35 bg-brand/12 text-brand">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
        <h2 className={cn("min-w-0 flex-1 text-base font-semibold", elevatedCardTitleClass)}>{title}</h2>
        {number ? <span className="text-xs font-semibold tabular-nums text-text-muted">{number}</span> : null}
      </header>
      {children}
    </section>
  );
}

export function ReportKpi({ item }: { item: TKpiView }) {
  const Icon = KPI_ICON[item.label] ?? Icons.chartLine;
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-border/70 bg-bg-card/40 p-4">
      <span
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border"
        style={{ borderColor: TONE_VAR[item.tone], color: TONE_VAR[item.tone] }}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className={cn("truncate text-xs font-medium", elevatedCardMutedClass)}>{item.label}</p>
        <p className={cn("mt-1 text-3xl font-bold tabular-nums tracking-tight", elevatedCardTitleClass)}>{item.value}</p>
        {item.change ? (
          <p className={cn("mt-1 text-xs font-medium", CHANGE_TEXT[item.change.direction])}>{item.change.text}</p>
        ) : null}
      </div>
    </div>
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

export function ReportAreaChart({ chart }: { chart: TSeriesView }) {
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
    chart.series.map((series, index) => [keys[index], { label: series.name, color: CHART_COLORS[index % CHART_COLORS.length] }]),
  );
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full" initialDimension={{ width: 640, height: 256 }}>
      <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
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
        {keys.map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            stroke={`var(--color-${key})`}
            strokeWidth={2.5}
            fill={`url(#fill-${gradientId}-${key})`}
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

export function ReportList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-text-secondary">
          <Icons.checkCircle className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ReportParagraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((text) => (
        <p key={text} className="text-sm leading-relaxed text-text-secondary">
          {text}
        </p>
      ))}
    </div>
  );
}

export function ReportNote({ text }: { text: string }) {
  return <p className="text-sm italic text-text-muted">{text}</p>;
}

export function ReportCallout({ text }: { text: string }) {
  return <p className="rounded-2xl border border-brand/35 bg-brand/10 px-4 py-3 text-sm text-text-primary">{text}</p>;
}

export function ReportSubheading({ children }: { children: React.ReactNode }) {
  return <h3 className={cn("text-sm font-semibold", elevatedCardTitleClass)}>{children}</h3>;
}
