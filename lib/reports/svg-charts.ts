import { REPORT_PALETTE } from "@/lib/reports/constants";
import { escapeHtml } from "@/lib/reports/escape";
import { shortDayLabel } from "@/lib/reports/view-model";

/**
 * Inline SVG charts for the report (PDF and preview). Styled like the dashboard charts:
 * filled area under a line, light grid, readable axis labels, a marked best day.
 * Plain SVG only (no filters, masks or blend modes), so the PDF renderer prints them as drawn.
 */

const WIDTH = 640;
const HEIGHT = 230;
/**
 * Plot area. Axis labels sit in the left gutter, starting at the card's text edge, so the chart's
 * left side lines up with the heading, the figures and the bar labels above it.
 */
const PAD = { top: 20, right: 8, bottom: 26, left: 34 };

/** Whole-number axis ticks from 0 to a rounded top. Never repeats a label. */
export function niceTicks(maxValue: number): number[] {
  const raw = Math.max(maxValue, 1) / 4;
  const base = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((multiplier) => multiplier * base).find((candidate) => candidate >= raw) ?? 10 * base;
  const unit = Math.max(1, Math.ceil(step));
  const top = Math.max(unit, Math.ceil(maxValue / unit) * unit);
  const ticks: number[] = [];
  for (let value = 0; value <= top; value += unit) ticks.push(value);
  return ticks;
}

function formatAxis(value: number): string {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value));
}

/** About six date labels across the axis, first and last always included. */
function tickIndexes(count: number): number[] {
  if (count <= 1) return [0];
  const picks = new Set<number>();
  for (let step = 0; step < 6; step++) picks.add(Math.round((step * (count - 1)) / 5));
  return [...picks].sort((a, b) => a - b);
}

export type TAreaChartInput = {
  /** Unique per chart on a page, used for the gradient id. */
  id: string;
  dates: string[];
  values: Array<number | null>;
  color: string;
  /** Index of the best day, marked with a dot and a label. */
  peakIndex: number | null;
};

/** Area chart for one daily metric. Returns an inline SVG string. */
export function areaChartSvg(input: TAreaChartInput): string {
  const values = input.values.map((value) => value ?? 0);
  const ticks = niceTicks(Math.max(0, ...values));
  const top = ticks[ticks.length - 1] ?? 1;
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const last = Math.max(input.dates.length - 1, 1);
  const x = (index: number) => PAD.left + (input.dates.length <= 1 ? innerW / 2 : (index / last) * innerW);
  const y = (value: number) => PAD.top + innerH - (value / top) * innerH;
  const baseline = PAD.top + innerH;
  const gradientId = `fill-${input.id}`;

  const grid = ticks
    .map((tick) => {
      const gy = y(tick);
      return `<line x1="${PAD.left}" x2="${WIDTH - PAD.right}" y1="${gy}" y2="${gy}" stroke="${REPORT_PALETTE.line}" stroke-width="1" />
<text x="0" y="${gy + 4}" text-anchor="start" font-size="11" fill="${REPORT_PALETTE.muted}">${formatAxis(tick)}</text>`;
    })
    .join("\n");

  const line = values.map((value, index) => `${x(index)},${y(value)}`);
  const area = `M${x(0)},${baseline} L${line.join(" L")} L${x(values.length - 1)},${baseline} Z`;

  const dateLabels = tickIndexes(input.dates.length)
    .map((index) => {
      const anchor = index === 0 ? "start" : index === input.dates.length - 1 ? "end" : "middle";
      return `<text x="${index === 0 ? PAD.left : x(index)}" y="${HEIGHT - 6}" text-anchor="${anchor}" font-size="11" fill="${REPORT_PALETTE.muted}">${escapeHtml(shortDayLabel(input.dates[index] ?? ""))}</text>`;
    })
    .join("\n");

  let peak = "";
  if (input.peakIndex !== null && (values[input.peakIndex] ?? 0) > 0) {
    const px = x(input.peakIndex);
    const py = y(values[input.peakIndex] ?? 0);
    const labelX = px > WIDTH * 0.7 ? px - 10 : px + 10;
    const anchor = px > WIDTH * 0.7 ? "end" : "start";
    peak = `<line x1="${px}" x2="${px}" y1="${py}" y2="${baseline}" stroke="${input.color}" stroke-dasharray="3 3" stroke-width="1" />
<circle cx="${px}" cy="${py}" r="4" fill="#fff" stroke="${input.color}" stroke-width="2" />
<text x="${labelX}" y="${py - 6}" text-anchor="${anchor}" font-size="11" font-weight="700" fill="${REPORT_PALETTE.ink}">${formatAxis(values[input.peakIndex] ?? 0)}</text>`;
  }

  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" role="img" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${input.color}" stop-opacity="0.28" />
<stop offset="1" stop-color="${input.color}" stop-opacity="0" />
</linearGradient>
</defs>
${grid}
<path d="${area}" fill="url(#${gradientId})" />
<polyline fill="none" stroke="${input.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${line.join(" ")}" />
${peak}
${dateLabels}
</svg>`;
}

/** Horizontal bars for ranked rows, with the value and share printed at the end of each bar. */
export function barChartSvg(rows: Array<{ label: string; value: number; valueLabel: string }>): string {
  const max = Math.max(1, ...rows.map((row) => row.value));
  const rowH = 30;
  const labelW = 170;
  const valueW = 130;
  const barW = WIDTH - labelW - valueW;
  const height = rows.length * rowH + 4;

  const body = rows
    .map((row, index) => {
      const y = index * rowH + 4;
      const width = row.value > 0 ? Math.max(3, (row.value / max) * barW) : 0;
      return `<text x="0" y="${y + 17}" font-size="12" fill="${REPORT_PALETTE.ink}">${escapeHtml(truncate(row.label, 28))}</text>
<rect x="${labelW}" y="${y + 6}" width="${barW}" height="16" rx="4" fill="${REPORT_PALETTE.surface}" />
<rect x="${labelW}" y="${y + 6}" width="${width}" height="16" rx="4" fill="${REPORT_PALETTE.accent}" />
<text x="${labelW + barW + 10}" y="${y + 18}" font-size="12" font-weight="700" fill="${REPORT_PALETTE.ink}">${escapeHtml(row.valueLabel)}</text>`;
    })
    .join("\n");

  return `<svg viewBox="0 0 ${WIDTH} ${height}" width="100%" role="img" xmlns="http://www.w3.org/2000/svg">
${body}
</svg>`;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
