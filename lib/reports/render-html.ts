import { REPORT_BRAND, REPORT_PALETTE } from "@/lib/reports/constants";
import { EMPTY_REPORT_ASSETS, type TReportAssets } from "@/lib/reports/assets";
import { escapeHtml } from "@/lib/reports/escape";
import { REPORT_COPY } from "@/lib/reports/copy";
import { barChartSvg, lineChartSvg } from "@/lib/reports/svg-charts";
import type { TRichDoc, TRichInline } from "@/lib/reports/rich-text";
import { buildReportView, type TBlockView, type TCardView, type TKpiView, type TReportView, type TSectionView, type TTableView } from "@/lib/reports/view-model";
import type { TReportSnapshotDto } from "@/types/reports.types";

/**
 * Print document for the PDF. Renders the shared report view (lib/reports/view-model.ts), so the
 * PDF and the in-app report show the same sections, wording and numbers.
 */

const buildCss = (assets: TReportAssets) => `
${assets.fontFaceCss}
:root {
  --accent: ${REPORT_PALETTE.accent};
  --accent-dark: ${REPORT_PALETTE.accentDark};
  --cyan: ${REPORT_PALETTE.cyan};
  --ink: ${REPORT_PALETTE.ink};
  --muted: ${REPORT_PALETTE.muted};
  --line: ${REPORT_PALETTE.line};
  --surface: ${REPORT_PALETTE.surface};
  --positive: ${REPORT_PALETTE.positive};
  --negative: ${REPORT_PALETTE.negative};
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; color: var(--ink); font-family: "Poppins", Arial, sans-serif; font-size: 10.5pt; line-height: 1.6; }
h2, h3, .kpi .value { font-family: "Red Hat Display", "Poppins", Arial, sans-serif; }
.page { width: 210mm; height: 297mm; padding: 16mm 16mm 14mm; position: relative; overflow: hidden; page-break-after: always; background: #fff; }
.page:last-child { page-break-after: auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8mm; }
.header h2 { margin: 0; font-size: 18pt; color: #fff; background: var(--accent-dark); padding: 3mm 6mm; text-transform: uppercase; letter-spacing: .03em; border-radius: 1mm; }
.header .number { font-size: 26pt; color: #b9c2e6; font-weight: 700; }
.chevrons { position: absolute; left: 0; right: 0; bottom: 0; }
.chevrons svg { width: 100%; height: auto; display: block; }
.footer { position: absolute; left: 16mm; right: 16mm; bottom: 20mm; display: flex; justify-content: space-between; font-size: 8.5pt; color: var(--muted); border-top: 1px solid var(--line); padding-top: 3mm; }
h3 { font-size: 13pt; margin: 6mm 0 2mm; color: var(--ink); }
p { margin: 0 0 3mm; }
p.prose { font-size: 10.5pt; line-height: 1.75; text-align: justify; }
ul { margin: 0 0 3mm; padding-left: 5mm; }
li { margin-bottom: 1.5mm; }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin-bottom: 5mm; }
.kpi { background: var(--surface); border-radius: 3mm; padding: 3.5mm; border-top: 3px solid var(--accent); }
.kpi .label { font-size: 8.5pt; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.kpi .value { font-size: 16pt; font-weight: 700; margin-top: 1mm; }
.kpi .change { font-size: 9pt; margin-top: 1mm; }
.up { color: var(--positive); }
.down { color: var(--negative); }
.flat { color: var(--muted); }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 4mm; }
th, td { text-align: left; padding: 1.8mm 2mm; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); font-weight: 600; background: var(--surface); }
td.num, th.num { text-align: right; white-space: nowrap; }
td.url { word-break: break-all; color: var(--muted); font-size: 8.5pt; }
.chart { margin: 2mm 0 5mm; }
.note { font-size: 9.5pt; color: var(--muted); font-style: italic; }
.callout { border-left: 3px solid var(--accent); background: var(--surface); padding: 3mm 4mm; border-radius: 0 2mm 2mm 0; margin-bottom: 4mm; }
.cards3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin-bottom: 5mm; }
.cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3mm; margin-bottom: 5mm; }
.card { background: var(--surface); border-radius: 3mm; padding: 3.5mm; border-top: 3px solid var(--accent); }
.card .label { font-size: 8.5pt; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.card .value { font-size: 16pt; font-weight: 700; margin-top: 1mm; }
.card .change { font-size: 9pt; margin-top: 1mm; }
.card-body { font-size: 9pt; margin: 2mm 0 0; line-height: 1.5; }
p.prose.lead { font-size: 12pt; line-height: 1.7; }
.cover { background: linear-gradient(160deg, #fff 55%, #e6f4ff 100%); }
.cover .lc-logo svg { width: 46mm; height: auto; display: block; }
.cover .cover-art { position: absolute; left: 0; right: 0; top: 118mm; bottom: 0; mix-blend-mode: multiply; overflow: hidden; }
.cover .cover-art svg { width: 100%; height: auto; display: block; }
.cover .dots { position: absolute; top: 6mm; right: 2mm; width: 92mm; }
.cover .dots svg { width: 100%; height: auto; display: block; }
.cover .client-logo img { max-height: 22mm; max-width: 70mm; display: block; }
.cover .client-logo .fallback { font-family: "Red Hat Display", sans-serif; font-size: 18pt; font-weight: 700; color: var(--accent-dark); }
.cover .monthly { display: inline-block; background: var(--accent-dark); color: #fff; font-family: "Red Hat Display", sans-serif; font-weight: 700; font-size: 44pt; padding: 2mm 5mm; border-radius: 2mm; margin-top: 10mm; }
.cover .report-word { font-family: "Red Hat Display", sans-serif; font-weight: 700; font-size: 44pt; color: var(--accent); margin: 1mm 0 0 0; }
.cover .rule { width: 60mm; height: 1.4mm; background: var(--cyan); margin-top: 4mm; border-radius: 1mm; }
.cover .brand { font-size: 18pt; font-weight: 700; color: var(--ink); }
.cover .brand span { color: var(--accent); }
.cover .eyebrow { margin-top: 60mm; font-size: 12pt; color: var(--muted); text-transform: uppercase; letter-spacing: .15em; }
.cover h1 { font-size: 46pt; margin: 2mm 0 0; color: var(--accent); line-height: 1.05; }
.cover .client { font-size: 20pt; margin-top: 8mm; font-weight: 600; }
.cover .period { font-size: 13pt; color: var(--muted); margin-top: 2mm; }
.closing-page { padding: 0; }
.closing { display: flex; flex-direction: column; justify-content: center; height: 297mm; color: #fff; padding: 22mm 18mm; }
.closing .lc-logo { display: inline-block; align-self: flex-start; background: #fff; padding: 4mm 5mm; border-radius: 2mm; }
.closing .lc-logo svg { width: 46mm; height: auto; display: block; }
.closing h2 { font-size: 40pt; color: #fff; margin: 14mm 0 8mm; letter-spacing: .02em; }
.closing .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 8mm; font-size: 11pt; }
.closing .legal { color: #cfd6f2; }
.legal { font-size: 8.5pt; color: var(--muted); margin-top: 10mm; max-width: 150mm; }
`;


const TONE_COLOR: Record<TKpiView["tone"], string> = {
  brand: REPORT_PALETTE.accent,
  cyan: REPORT_PALETTE.cyan,
  emerald: REPORT_PALETTE.positive,
  amber: "#f59e0b",
  neutral: REPORT_PALETTE.muted,
};

function page(number: string, title: string, body: string, footerLeft: string, pageNo: number, chevronsSvg: string): string {
  return `<section class="page">
<div class="header"><h2>${escapeHtml(title)}</h2><div class="number">${escapeHtml(number)}</div></div>
${body}
<div class="chevrons">${chevronsSvg}</div>
<div class="footer"><span>${escapeHtml(footerLeft)}</span><span>${pageNo}</span></div>
</section>`;
}

function kpiHtml(item: TKpiView): string {
  const change = item.change
    ? `<div class="change ${item.change.direction === "up" ? "up" : item.change.direction === "down" ? "down" : "flat"}">${escapeHtml(item.change.text)}</div>`
    : "";
  return `<div class="kpi" style="border-top-color:${TONE_COLOR[item.tone]}"><div class="label">${escapeHtml(item.label)}</div><div class="value">${escapeHtml(item.value)}</div>${change}</div>`;
}

function tableHtml(table: TTableView): string {
  if (table.rows.length === 0) return `<p class="note">${escapeHtml(table.emptyText)}</p>`;
  const head = table.headers.map((header, index) => `<th${index > 0 ? ' class="num"' : ""}>${escapeHtml(header)}</th>`).join("");
  const body = table.rows
    .map((row) => `<tr>${row.map((cell, index) => `<td${index === 0 ? ' class="url"' : ' class="num"'}>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function cardHtml(card: TCardView): string {
  const change = card.change ? `<div class="change ${card.change.direction === "up" ? "up" : card.change.direction === "down" ? "down" : "flat"}">${escapeHtml(card.change.text)}</div>` : "";
  return `<div class="card" style="border-top-color:${TONE_COLOR[card.tone]}"><div class="label">${escapeHtml(card.label)}</div><div class="value">${escapeHtml(card.value)}</div>${change}<p class="card-body">${escapeHtml(card.body)}</p></div>`;
}

function runsHtml(runs: TRichInline[]): string {
  return runs
    .map((run) => {
      const text = escapeHtml(run.text);
      const bold = run.bold ? `<strong>${text}</strong>` : text;
      return run.italic ? `<em>${bold}</em>` : bold;
    })
    .join("");
}

function richDocHtml(doc: TRichDoc): string {
  return doc
    .map((block) => {
      if (block.type === "heading") return `<h3>${runsHtml(block.runs)}</h3>`;
      if (block.type === "paragraph") return `<p class="prose lead">${runsHtml(block.runs)}</p>`;
      return `<ul>${block.items.map((item) => `<li>${runsHtml(item)}</li>`).join("")}</ul>`;
    })
    .join("");
}

function blockHtml(block: TBlockView): string {
  switch (block.type) {
    case "rich":
      return richDocHtml(block.doc);
    case "heading":
      return `<h3>${escapeHtml(block.title)}</h3>`;
    case "prose":
      return `${block.title ? `<h3>${escapeHtml(block.title)}</h3>` : ""}<p class="${block.variant === "lead" ? "prose lead" : "prose"}">${escapeHtml(block.body)}</p>`;
    case "cards":
      return `<h3>${escapeHtml(block.title)}</h3><div class="cards">${block.items.map(cardHtml).join("")}</div>`;
    case "kpis":
      return `<div class="kpis">${block.items.map(kpiHtml).join("")}</div>`;
    case "line":
      return `${block.charts.map((item) => `<div class="chart">${lineChartSvg(item.chart.dates, item.chart.series)}</div>`).join("")}${block.tables.map((named) => `<h3>${escapeHtml(named.title)}</h3>${tableHtml(named.table)}`).join("")}`;
    case "donut":
      return `<h3>${escapeHtml(block.title)}</h3><div class="chart">${barChartSvg(block.rows)}</div>`;
    case "table":
      return `<h3>${escapeHtml(block.title)}</h3>${tableHtml(block.table)}`;
    case "callout":
      return `<h3>${escapeHtml(block.title)}</h3><div class="callout">${escapeHtml(block.text)}</div>`;
    case "bullets":
      return `<h3>${escapeHtml(block.title)}</h3><ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    case "note":
      return `<p class="note">${escapeHtml(block.text)}</p>`;
  }
}

function sectionPage(section: TSectionView, pageNo: number, footer: string, assets: TReportAssets): string {
  const body = section.blocks.map(blockHtml).join("\n");
  return page(section.number, section.title, body, footer, pageNo, assets.chevronsSvg);
}

function coverPage(view: TReportView, assets: TReportAssets): string {
  const clientLogo = view.cover.clientLogoDataUri
    ? `<img alt="${escapeHtml(view.cover.clientName)}" src="${view.cover.clientLogoDataUri}" />`
    : `<div class="fallback">${escapeHtml(view.cover.clientName)}</div>`;
  return `<section class="page cover">
<div class="cover-art">${assets.coverArtSvg}</div>
<div class="dots">${assets.dotsSvg}</div>
<div class="lc-logo">${assets.lcLogoSvg}</div>
<div class="client-logo" style="margin-top:22mm">${clientLogo}</div>
<div class="monthly">MONTHLY</div>
<h1 class="report-word">REPORT</h1>
<div class="rule"></div>
<div style="margin-top:10mm;font-size:10pt;color:var(--muted)">${escapeHtml(REPORT_COPY.cover.dateLabel)}</div>
<div style="font-weight:600">${escapeHtml(view.cover.dateLabel)}</div>
<div style="margin-top:6mm;font-size:10pt;color:var(--muted)">${escapeHtml(REPORT_COPY.cover.preparedBy)}</div>
<div style="font-weight:600">${escapeHtml(REPORT_BRAND.name)}</div>
<div style="margin-top:4mm;font-size:10pt;color:var(--muted)">${escapeHtml(view.cover.periodLabel)}</div>
</section>`;
}

function closingPage(view: TReportView, assets: TReportAssets): string {
  const phones = view.contact.phones.map((phone) => `<div>${escapeHtml(phone)}</div>`).join("");
  const addresses = view.contact.addresses.map((address) => `<div>${escapeHtml(address)}</div>`).join("");
  return `<section class="page closing-page" style="background-image:url(${assets.contactBgDataUri});background-size:cover;background-position:center"><div class="closing">
<div class="lc-logo">${assets.lcLogoSvg}</div>
<h2>${escapeHtml(REPORT_COPY.cover.contactUs)}</h2>
<div class="grid">
  <div>${phones}</div>
  <div>${addresses}</div>
  <div>${escapeHtml(view.contact.email)}</div>
  <div>${escapeHtml(view.contact.website)}</div>
</div>
<p class="legal">${escapeHtml(view.legal)}</p>
</div></section>`;
}

/** Full print document for one report snapshot. */
export function renderReportHtml(snapshot: TReportSnapshotDto, assets: TReportAssets = EMPTY_REPORT_ASSETS): string {
  const view = buildReportView(snapshot);
  const footer = snapshot.project.name;
  const pages = [
    coverPage(view, assets),
    ...view.sections.map((section, index) => sectionPage(section, index + 1, footer, assets)),
    closingPage(view, assets),
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(view.title)}</title>
<style>${buildCss(assets)}</style>
</head>
<body>
${pages.join("\n")}
</body>
</html>`;
}
