import { downloadBrowserBlob } from "@/lib/frontend/download-file";
import type { TDateRange } from "@/lib/frontend/seo-activities/date-range.utils";
import type {
  TSeoActivityBacklink,
  TSeoActivityBlog,
  TSeoActivityType,
  TSeoActivityTechnicalWork,
} from "@/types/seo-activity.types";

export type TSeoActivityExportLabels = {
  date: string;
  title: string;
  url: string;
  anchorText: string;
  details: string;
};

type TSeoActivityExportRow = TSeoActivityBlog | TSeoActivityBacklink | TSeoActivityTechnicalWork;

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildExportTable(
  type: TSeoActivityType,
  rows: readonly TSeoActivityExportRow[],
  labels: TSeoActivityExportLabels,
): { headers: string[]; values: string[][] } {
  if (type === "blogs") {
    return {
      headers: [labels.date, labels.title, labels.url],
      values: (rows as TSeoActivityBlog[]).map((row) => [
        row.occurredOn ?? "",
        row.title ?? "",
        row.url ?? "",
      ]),
    };
  }

  if (type === "backlinks") {
    return {
      headers: [labels.date, labels.anchorText, labels.url],
      values: (rows as TSeoActivityBacklink[]).map((row) => [
        row.occurredOn ?? "",
        row.anchorText ?? "",
        row.url ?? "",
      ]),
    };
  }

  return {
    headers: [labels.date, labels.details, labels.url],
    values: (rows as TSeoActivityTechnicalWork[]).map((row) => [
      row.occurredOn ?? "",
      row.details ?? "",
      row.url ?? "",
    ]),
  };
}

export function buildSeoActivityCsv(
  type: TSeoActivityType,
  rows: readonly TSeoActivityExportRow[],
  labels: TSeoActivityExportLabels,
): string {
  const table = buildExportTable(type, rows, labels);
  const lines = [
    table.headers.map(escapeCsvCell).join(","),
    ...table.values.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

/** SpreadsheetML (.xls) — opens in Excel without a third-party library. */
export function buildSeoActivityExcelXml(
  type: TSeoActivityType,
  rows: readonly TSeoActivityExportRow[],
  labels: TSeoActivityExportLabels,
): string {
  const table = buildExportTable(type, rows, labels);
  const headerCells = table.headers
    .map((header) => `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`)
    .join("");
  const bodyRows = table.values
    .map((row) => {
      const cells = row
        .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`)
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="SEO Activities">
  <Table>
   <Row>${headerCells}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function buildSeoActivityExportFilename(
  type: TSeoActivityType,
  range: TDateRange,
  extension: "csv" | "xls",
  now = new Date(),
): string {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const from = range.from ?? "all";
  const to = range.to ?? "all";
  return `seo-activities-${type}_${from}_${to}_${stamp}.${extension}`;
}

export function downloadBrowserFile(filename: string, content: string, mimeType: string) {
  downloadBrowserBlob(filename, new Blob([content], { type: mimeType }));
}

export function downloadSeoActivitiesExcel(input: {
  type: TSeoActivityType;
  rows: readonly TSeoActivityExportRow[];
  range: TDateRange;
  labels: TSeoActivityExportLabels;
}) {
  const content = buildSeoActivityExcelXml(input.type, input.rows, input.labels);
  const filename = buildSeoActivityExportFilename(input.type, input.range, "xls");
  downloadBrowserFile(
    filename,
    content,
    "application/vnd.ms-excel;charset=utf-8",
  );
}

export function downloadSeoActivitiesCsv(input: {
  type: TSeoActivityType;
  rows: readonly TSeoActivityExportRow[];
  range: TDateRange;
  labels: TSeoActivityExportLabels;
}) {
  const content = buildSeoActivityCsv(input.type, input.rows, input.labels);
  const filename = buildSeoActivityExportFilename(input.type, input.range, "csv");
  downloadBrowserFile(filename, content, "text/csv;charset=utf-8");
}
