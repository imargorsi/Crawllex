import { downloadBrowserFile } from "@/lib/frontend/seo-activities/export.utils";
import type { TDateRange } from "@/lib/frontend/seo-activities/date-range.utils";
import {
  buildDatedExportFilename,
  buildSpreadsheetXml,
  formatSpreadsheetPercentRatio,
  formatSpreadsheetPosition,
  numberOrEmpty,
  stringCell,
  type TSpreadsheetSheet,
} from "@/lib/frontend/export/spreadsheet-xml.utils";
import type { TAnalyticsOverviewDto } from "@/types/analytics.types";

export type TDashboardExportPulse = {
  leads: number | null;
  calls: number | null;
  emails: number | null;
  whatsapp: number | null;
};

export type TDashboardExportLabels = {
  sheets: {
    summary: string;
    dailyTrend: string;
  };
  metric: string;
  value: string;
  date: string;
  leads: string;
  calls: string;
  emails: string;
  whatsapp: string;
  clicks: string;
  impressions: string;
  ctr: string;
  position: string;
  engagementRate: string;
  avgSessionDuration: string;
  sessions: string;
};

export type TDashboardExportPayload = {
  pulse: TDashboardExportPulse;
  overview: TAnalyticsOverviewDto | undefined;
};

function formatSessionDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return "";
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function hasPositive(value: number | null | undefined): boolean {
  return value != null && !Number.isNaN(value) && value > 0;
}

export function hasDashboardExportSignal(payload: TDashboardExportPayload): boolean {
  const { pulse, overview } = payload;
  if (
    hasPositive(pulse.leads) ||
    hasPositive(pulse.calls) ||
    hasPositive(pulse.emails) ||
    hasPositive(pulse.whatsapp)
  ) {
    return true;
  }
  if (!overview) return false;

  const hasCards =
    hasPositive(overview.cards.clicks.value) ||
    hasPositive(overview.cards.impressions.value) ||
    hasPositive(overview.ga4.sessions) ||
    hasPositive(overview.engagement.pageViews.value) ||
    hasPositive(overview.engagement.engagementRate.value);
  const hasSeries = overview.series.some(
    (point) =>
      hasPositive(point.clicks) ||
      hasPositive(point.impressions) ||
      hasPositive(point.sessions),
  );
  return hasCards || hasSeries;
}

function buildSheets(
  payload: TDashboardExportPayload,
  labels: TDashboardExportLabels,
): TSpreadsheetSheet[] {
  const { pulse, overview } = payload;
  const sheets: TSpreadsheetSheet[] = [
    {
      name: labels.sheets.summary,
      headers: [labels.metric, labels.value],
      rows: [
        [stringCell(labels.leads), numberOrEmpty(pulse.leads)],
        [stringCell(labels.calls), numberOrEmpty(pulse.calls)],
        [stringCell(labels.emails), numberOrEmpty(pulse.emails)],
        [stringCell(labels.whatsapp), numberOrEmpty(pulse.whatsapp)],
        [stringCell(labels.clicks), numberOrEmpty(overview?.cards.clicks.value)],
        [stringCell(labels.impressions), numberOrEmpty(overview?.cards.impressions.value)],
        [
          stringCell(labels.ctr),
          stringCell(formatSpreadsheetPercentRatio(overview?.cards.ctr.value)),
        ],
        [
          stringCell(labels.position),
          stringCell(formatSpreadsheetPosition(overview?.cards.position.value)),
        ],
        [
          stringCell(labels.engagementRate),
          stringCell(formatSpreadsheetPercentRatio(overview?.engagement.engagementRate.value)),
        ],
        [
          stringCell(labels.avgSessionDuration),
          stringCell(formatSessionDuration(overview?.engagement.avgSessionDuration.value)),
        ],
      ],
    },
  ];

  if (overview) {
    sheets.push({
      name: labels.sheets.dailyTrend,
      headers: [
        labels.date,
        labels.clicks,
        labels.impressions,
        labels.ctr,
        labels.position,
        labels.sessions,
      ],
      rows: overview.series.map((point) => [
        stringCell(point.date),
        numberOrEmpty(point.clicks),
        numberOrEmpty(point.impressions),
        stringCell(formatSpreadsheetPercentRatio(point.ctr)),
        stringCell(formatSpreadsheetPosition(point.position)),
        numberOrEmpty(point.sessions),
      ]),
    });
  }

  return sheets;
}

export function buildDashboardExcelXml(
  payload: TDashboardExportPayload,
  labels: TDashboardExportLabels,
): string {
  return buildSpreadsheetXml(buildSheets(payload, labels));
}

export function buildDashboardExportFilename(range: TDateRange, now = new Date()): string {
  return buildDatedExportFilename("dashboard", range, now);
}

export function downloadDashboardExcel(input: {
  payload: TDashboardExportPayload;
  range: TDateRange;
  labels: TDashboardExportLabels;
}) {
  const content = buildDashboardExcelXml(input.payload, input.labels);
  const filename = buildDashboardExportFilename(input.range);
  downloadBrowserFile(filename, content, "application/vnd.ms-excel;charset=utf-8");
}
