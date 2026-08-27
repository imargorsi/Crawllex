import type { TDateRange } from "@/lib/frontend/seo-activities/date-range.utils";
import { downloadBrowserFile } from "@/lib/frontend/seo-activities/export.utils";
import { leadSourceGroup } from "@/lib/frontend/leads/origin-display";
import { leadExtrasForDisplay } from "@/lib/leads/extras.utils";
import type { TLeadDto } from "@/types/lead.types";

export type TLeadExportLabels = {
  leadDate: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  servicesInterestedIn: string;
  message: string;
  source: string;
  sourceWordpress: string;
  sourceOthers: string;
};

/** Prefix formula-like values so Excel/LibreOffice treat them as text. */
function sanitizeSpreadsheetCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function escapeXml(value: string): string {
  return sanitizeSpreadsheetCell(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function collectExtrasKeys(rows: readonly TLeadDto[], servicesLabel: string): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const [key] of leadExtrasForDisplay(row, servicesLabel)) {
      keys.add(key);
    }
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}

function extrasValueMap(row: TLeadDto, servicesLabel: string): Record<string, string> {
  return Object.fromEntries(leadExtrasForDisplay(row, servicesLabel));
}

function buildExportTable(rows: readonly TLeadDto[], labels: TLeadExportLabels) {
  const extrasKeys = collectExtrasKeys(rows, labels.servicesInterestedIn);
  const headers = [
    labels.leadDate,
    labels.firstName,
    labels.lastName,
    labels.email,
    labels.phone,
    labels.source,
    labels.message,
    ...extrasKeys,
  ];
  const values = rows.map((row) => {
    const extras = extrasValueMap(row, labels.servicesInterestedIn);
    return [
      row.leadDate,
      row.firstName,
      row.lastName,
      row.email,
      row.phone,
      leadSourceGroup(row.origin) === "wordpress" ? labels.sourceWordpress : labels.sourceOthers,
      row.message,
      ...extrasKeys.map((key) => extras[key] ?? ""),
    ];
  });
  return { headers, values };
}

export function buildLeadsExcelXml(rows: readonly TLeadDto[], labels: TLeadExportLabels): string {
  const table = buildExportTable(rows, labels);
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
 <Worksheet ss:Name="Leads">
  <Table>
   <Row>${headerCells}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function buildLeadsExportFilename(range: TDateRange, now = new Date()): string {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const from = range.from ?? "all";
  const to = range.to ?? "all";
  return `leads_${from}_${to}_${stamp}.xls`;
}

export function downloadLeadsExcel(input: {
  rows: readonly TLeadDto[];
  range: TDateRange;
  labels: TLeadExportLabels;
}) {
  const content = buildLeadsExcelXml(input.rows, input.labels);
  const filename = buildLeadsExportFilename(input.range);
  downloadBrowserFile(filename, content, "application/vnd.ms-excel;charset=utf-8");
}
