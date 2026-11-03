import { REPORT_PALETTE } from "@/lib/reports/constants";
import { escapeHtml } from "@/lib/reports/escape";

type TLineSeries = {
  name: string;
  color: string;
  values: Array<number | null>;
};

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * base >= value / 4) ?? 10;
  return Math.ceil(value / (step * base)) * step * base;
}

function formatAxis(value: number): string {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value));
}

function shortDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(day)}/${Number(month)}`;
}

/** Line chart with one or more series over a shared date axis. Returns an inline SVG string. */
export function lineChartSvg(dates: string[], series: TLineSeries[]): string {
  const values = series.flatMap((item) => item.values.filter((v): v is number => v != null));
  const max = niceMax(Math.max(0, ...values));
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const count = Math.max(dates.length - 1, 1);
  const x = (index: number) => PAD.left + (dates.length <= 1 ? innerW / 2 : (index / count) * innerW);
  const y = (value: number) => PAD.top + innerH - (value / max) * innerH;

  const grid = [0, 0.5, 1]
    .map((ratio) => {
      const value = max * ratio;
      const gy = y(value);
      return `<line x1="${PAD.left}" x2="${WIDTH - PAD.right}" y1="${gy}" y2="${gy}" stroke="${REPORT_PALETTE.line}" />
<text x="${PAD.left - 8}" y="${gy + 4}" text-anchor="end" font-size="11" fill="${REPORT_PALETTE.muted}">${formatAxis(value)}</text>`;
    })
    .join("\n");

  const labelIndexes = [0, Math.floor(count / 2), count].filter(
    (value, index, all) => all.indexOf(value) === index && value < dates.length,
  );
  const xLabels = labelIndexes
    .map(
      (index) =>
        `<text x="${x(index)}" y="${HEIGHT - 8}" text-anchor="middle" font-size="11" fill="${REPORT_PALETTE.muted}">${escapeHtml(shortDate(dates[index]))}</text>`,
    )
    .join("\n");

  const lines = series
    .map((item) => {
      const points = item.values
        .map((value, index) => (value == null ? null : `${x(index)},${y(value)}`))
        .filter((point): point is string => point !== null);
      if (points.length === 0) return "";
      return `<polyline fill="none" stroke="${item.color}" stroke-width="2.25" stroke-linejoin="round" points="${points.join(" ")}" />`;
    })
    .join("\n");

  const legend = series
    .map(
      (item, index) =>
        `<g transform="translate(${PAD.left + index * 160},${HEIGHT + 22})"><rect width="12" height="4" y="4" fill="${item.color}" /><text x="18" y="10" font-size="11" fill="${REPORT_PALETTE.ink}">${escapeHtml(item.name)}</text></g>`,
    )
    .join("\n");

  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT + 34}" width="100%" role="img" xmlns="http://www.w3.org/2000/svg">
${grid}
${lines}
${xLabels}
${legend}
</svg>`;
}

/** Horizontal bar chart for ranked rows. Returns an inline SVG string. */
export function barChartSvg(rows: Array<{ label: string; value: number }>): string {
  const max = Math.max(1, ...rows.map((row) => row.value));
  const rowH = 26;
  const labelW = 190;
  const valueW = 70;
  const barW = WIDTH - labelW - valueW;
  const height = rows.length * rowH + 8;

  const body = rows
    .map((row, index) => {
      const y = index * rowH + 4;
      const width = Math.max(2, (row.value / max) * barW);
      return `<text x="0" y="${y + 16}" font-size="12" fill="${REPORT_PALETTE.ink}">${escapeHtml(truncate(row.label, 32))}</text>
<rect x="${labelW}" y="${y + 4}" width="${width}" height="14" rx="3" fill="${REPORT_PALETTE.accent}" />
<text x="${labelW + barW + 8}" y="${y + 16}" font-size="12" fill="${REPORT_PALETTE.ink}">${row.value.toLocaleString("en-US")}</text>`;
    })
    .join("\n");

  return `<svg viewBox="0 0 ${WIDTH} ${height}" width="100%" role="img" xmlns="http://www.w3.org/2000/svg">
${body}
</svg>`;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
