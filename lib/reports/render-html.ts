import { REPORT_BRAND, REPORT_PALETTE } from "@/lib/reports/constants";
import { PARAGRAPH_BREAK } from "@/lib/reports/report-text";
import { EMPTY_REPORT_ASSETS, type TReportAssets } from "@/lib/reports/assets";
import { escapeHtml } from "@/lib/reports/escape";
import { REPORT_COPY } from "@/lib/reports/copy";
import { areaChartSvg, barChartSvg } from "@/lib/reports/svg-charts";
import { isSafeHref, type TRichDoc, type TRichInline } from "@/lib/reports/rich-text";
import { buildReportView, type TBlockView, type TCardView, type TKpiView, type TReportView, type TSectionView, type TSeriesView } from "@/lib/reports/view-model";
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
  --box-bg: linear-gradient(160deg, #ffffff 0%, #f3f8ff 100%);
  --box-line: #d3dff5;
  --box-shadow: 0 0.4mm 1.4mm rgba(10, 62, 197, 0.10);
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; color: var(--ink); font-family: "Poppins", Arial, sans-serif; font-size: 10.5pt; line-height: 1.6; }
h2, h3, .kpi .value { font-family: "Red Hat Display", "Poppins", Arial, sans-serif; }
.page { width: 210mm; height: 297mm; padding: 16mm 16mm 34mm; position: relative; overflow: hidden; page-break-after: always; background: #fff; display: flex; flex-direction: column; }
.page > .header { flex: none; }
.page > .body { flex: 1 1 0; min-height: 0; overflow: hidden; }
.page:last-child { page-break-after: auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6mm; }
.header h2 { margin: 0; font-size: 18pt; color: #fff; background: var(--accent-dark); padding: 3mm 6mm; text-transform: uppercase; letter-spacing: .03em; border-radius: 1mm; }
.header .number { font-size: 26pt; color: #b9c2e6; font-weight: 700; }
.chevrons { position: absolute; left: 0; right: 0; bottom: 0; }
.chevrons img { width: 100%; height: auto; display: block; }
.footer { position: absolute; left: 16mm; right: 16mm; bottom: 20mm; display: flex; justify-content: space-between; font-size: 8.5pt; color: var(--muted); border-top: 1px solid var(--line); padding-top: 3mm; }
h3 { font-size: 12.5pt; margin: 5mm 0 2.5mm; color: var(--accent-dark); border-left: 1.2mm solid var(--cyan); padding-left: 2.5mm; line-height: 1.2; }
p { margin: 0 0 3mm; }
p.prose { font-size: 10.5pt; line-height: 1.75; text-align: left; margin: 0 0 2.5mm; }
p.card-p { margin: 0 0 1.5mm; }
ul { margin: 0 0 3mm; padding-left: 5mm; }
li { margin-bottom: 1.5mm; }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin-bottom: 5mm; align-items: stretch; }
.kpi { background: var(--box-bg); border: 0.3mm solid var(--box-line); border-left: 1.2mm solid var(--tone, var(--accent)); border-radius: 1.2mm; padding: 3.5mm 4mm; box-shadow: var(--box-shadow); }
.kpi .label { font-size: 8.5pt; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.kpi .value { font-size: 20pt; font-weight: 700; margin-top: 1mm; color: var(--accent); }
.fig { color: var(--accent); font-weight: 700; }
.kpi .change { font-size: 9pt; margin-top: 1mm; }
.up { color: var(--positive); }
.down { color: var(--negative); }
.flat { color: var(--muted); }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 4mm; }
th, td { text-align: left; padding: 1.8mm 2mm; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); font-weight: 600; background: var(--surface); }
td.num, th.num { text-align: right; white-space: nowrap; }
td.url { word-break: break-all; color: var(--muted); font-size: 8.5pt; }
.chart { margin: 2mm 0 4mm; }
.chart svg { display: block; width: 100%; height: auto; }
.chart-card { background: var(--box-bg); border: 0.3mm solid var(--box-line); border-radius: 1.2mm; padding: 3mm 4mm; margin: 0 0 3mm; box-shadow: var(--box-shadow); }
.chart-card .chart-head h4 { margin: 0; font-size: 12pt; color: var(--ink); font-family: "Red Hat Display", "Poppins", Arial, sans-serif; }
.chart-card .chart-head { border-bottom: 1px solid var(--line); padding-bottom: 2mm; margin-bottom: 2.5mm; }
.chart-sub { margin: 0.6mm 0 2.5mm; font-size: 9pt; color: var(--muted); }
.chart-stats { display: flex; gap: 9mm; margin: 0 0 3mm; }
.chart-stats div { border-left: 1.2mm solid var(--cyan); padding-left: 2.5mm; }
.chart-stats span { display: block; font-size: 7.5pt; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.chart-stats strong { font-size: 16pt; font-weight: 700; color: var(--accent); font-family: "Red Hat Display", "Poppins", Arial, sans-serif; }
.chart-card .chart svg, .chart-card svg { margin-top: 1mm; }
.cards.summary-row .card-body { display: none; }
.note { font-size: 9.5pt; color: var(--muted); font-style: italic; }
.callout { border-left: 1.2mm solid var(--accent); background: var(--box-bg); border: 0.3mm solid var(--box-line); border-left: 1.2mm solid var(--accent); padding: 3mm 4mm; border-radius: 1.2mm; margin-bottom: 4mm; }
.cards3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin-bottom: 5mm; }
.cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3mm; margin-bottom: 5mm; align-items: stretch; }
.card { background: var(--box-bg); border: 0.3mm solid var(--box-line); border-left: 1.2mm solid var(--tone, var(--accent)); border-radius: 1.2mm; padding: 3.5mm 4mm; box-shadow: var(--box-shadow); }

.more { margin: 2mm 0 0; font-size: 9pt; }
.more a { color: var(--accent); font-weight: 700; text-decoration: none; border-bottom: 0.3mm solid var(--cyan); }
.card .label { font-size: 8.5pt; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.card .value { font-size: 20pt; font-weight: 700; margin-top: 1mm; color: var(--accent); }
.card .change { font-size: 9pt; margin-top: 1mm; }
.card-body { font-size: 9pt; margin: 2mm 0 0; line-height: 1.5; }
p.prose.lead { font-size: 12pt; line-height: 1.7; }
.cover { background: linear-gradient(160deg, #fff 55%, #e6f4ff 100%); display: block; }
.cover .lc-logo img { width: 46mm; height: auto; display: block; }
.cover .cover-art { position: absolute; left: 0; right: 0; top: 118mm; bottom: 0; overflow: hidden; }
.cover .cover-art img { width: 100%; height: auto; display: block; }
.cover .dots { position: absolute; top: 6mm; right: 2mm; width: 92mm; }
.cover .dots img { width: 100%; height: auto; display: block; }
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
.closing .lc-logo img { width: 46mm; height: auto; display: block; }
.closing h2 { font-size: 40pt; color: #fff; margin: 14mm 0 8mm; letter-spacing: .02em; }
.closing .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 8mm; font-size: 11pt; }
.closing .legal { color: #cfd6f2; }
.legal { font-size: 8.5pt; color: var(--muted); margin-top: 10mm; max-width: 150mm; }
`;


/** Countries listed in the PDF. The dashboard shows the full top list. */
const PDF_TOP_COUNTRIES = 3;

const TONE_COLOR: Record<TKpiView["tone"], string> = {
  brand: REPORT_PALETTE.accent,
  cyan: REPORT_PALETTE.cyan,
  emerald: REPORT_PALETTE.positive,
  amber: "#f59e0b",
  neutral: REPORT_PALETTE.muted,
};

/**
 * Paragraphs split the way the dashboard splits them, with figures in blue, so the numbers stand out
 * when a client skims the page. Years are left as plain text.
 */
function emphasisHtml(text: string, className = "prose"): string {
  return text
    .split(PARAGRAPH_BREAK)
    .filter((paragraph) => paragraph.trim().length > 0)
    .map((paragraph) => {
      const parts = paragraph.split(/(\d+(?:,\d{3})*(?:\.\d+)?%?)/g).map((part) => {
        if (!/^\d/.test(part)) return escapeHtml(part);
        const isYear = /^(19|20)\d{2}$/.test(part);
        return isYear ? escapeHtml(part) : `<strong class="fig">${escapeHtml(part)}</strong>`;
      });
      return `<p class="${className}">${parts.join("")}</p>`;
    })
    .join("");
}

function kpiHtml(item: TKpiView): string {
  const change = item.change
    ? `<div class="change ${item.change.direction === "up" ? "up" : item.change.direction === "down" ? "down" : "flat"}">${escapeHtml(item.change.text)}</div>`
    : "";
  return `<div class="kpi" style="--tone:${TONE_COLOR[item.tone]}"><div class="label">${escapeHtml(item.label)}</div><div class="value">${escapeHtml(item.value)}</div>${change}</div>`;
}

function cardHtml(card: TCardView): string {
  const change = card.change ? `<div class="change ${card.change.direction === "up" ? "up" : card.change.direction === "down" ? "down" : "flat"}">${escapeHtml(card.change.text)}</div>` : "";
  return `<div class="card" style="--tone:${TONE_COLOR[card.tone]}"><div class="label">${escapeHtml(card.label)}</div><div class="value">${escapeHtml(card.value)}</div>${change}<div class="card-body">${emphasisHtml(card.body, "card-p")}</div></div>`;
}

function runsHtml(runs: TRichInline[]): string {
  return runs
    .map((run) => {
      const text = escapeHtml(run.text);
      const bold = run.bold ? `<strong>${text}</strong>` : text;
      const linked = run.href && isSafeHref(run.href) ? `<a href="${escapeHtml(run.href)}">${bold}</a>` : bold;
      return run.italic ? `<em>${linked}</em>` : linked;
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

/** Boxed chart with its own subtitle. The subtitle says what the numbers mean. */
function chartCardHtml(subtitle: string, svg: string, head = ""): string {
  return `<div class="chart-card">${head}${subtitle ? `<p class="chart-sub">${escapeHtml(subtitle)}</p>` : ""}${svg}</div>`;
}

/** One daily metric: title, subtitle, total / average / best-day figures, then the area chart. */
function dailyChartHtml(item: { title: string; subtitle: string; chart: TSeriesView }, index: number): string {
  const stats = item.chart.stats
    .map((stat) => `<div><span>${escapeHtml(stat.label)}</span><strong>${escapeHtml(stat.value)}</strong></div>`)
    .join("");
  const series = item.chart.series[0];
  const svg = areaChartSvg({
    id: `${index}-${item.title.replace(/\W+/g, "")}`,
    dates: item.chart.dates,
    values: series?.values ?? [],
    color: series?.color ?? REPORT_PALETTE.accent,
    peakIndex: item.chart.peakIndex,
  });
  const head = `<div class="chart-head"><h4>${escapeHtml(item.title)}</h4></div>`;
  return `<div class="chart-card">${head}<p class="chart-sub">${escapeHtml(item.subtitle)}</p><div class="chart-stats">${stats}</div>${svg}</div>`;
}

function blockHtml(block: TBlockView): string {
  switch (block.type) {
    case "rich":
      return richDocHtml(block.doc);
    case "heading":
      return `<h3>${escapeHtml(block.title)}</h3>`;
    case "prose":
      return `${block.title ? `<h3>${escapeHtml(block.title)}</h3>` : ""}${emphasisHtml(block.body, block.variant === "lead" ? "prose lead" : "prose")}`;
    case "cards":
      // Compact for the PDF: one row of short cards. Full text and the item lists are in the dashboard.
      const columns = Math.min(Math.max(block.items.length, 1), 4);
      return `<h3>${escapeHtml(block.title)}</h3><div class="cards summary-row" style="grid-template-columns:repeat(${columns},1fr)">${block.items.map(cardHtml).join("")}</div>`;
    case "kpis":
      return `<div class="kpis">${block.items.map(kpiHtml).join("")}</div>`;
    case "line":
      // Charts only. Ranked tables (top queries, pages, landing pages) are in the dashboard.
      // Each chart carries its own heading, so the block title is not repeated here.
      return block.charts.map((item, index) => dailyChartHtml(item, index)).join("");
    case "donut":
      return `<h3>${escapeHtml(block.title)}</h3>${chartCardHtml("", barChartSvg(block.rows))}${
        block.list ? `<h3>${escapeHtml(block.list.title)}</h3>${chartCardHtml("", block.list.rows.length ? barChartSvg(block.list.rows.slice(0, PDF_TOP_COUNTRIES)) : `<p class="note">${escapeHtml(block.list.emptyText)}</p>`)}` : ""
      }`;
    case "table":
      // Full tables live in the dashboard; the PDF links there from the section footer.
      return "";
    case "callout":
      return `<h3>${escapeHtml(block.title)}</h3><div class="callout">${emphasisHtml(block.text, "card-p")}</div>`;
    case "bullets":
      return `<h3>${escapeHtml(block.title)}</h3><ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    case "note":
      return `<p class="note">${escapeHtml(block.text)}</p>`;
  }
}

/** Link under each section: the PDF shows a summary, the dashboard tab shows the full breakdown. */
function sectionMoreHtml(sectionId: string, dashboardUrl: string | undefined): string {
  if (!dashboardUrl) return "";
  const href = `${dashboardUrl}&section=${encodeURIComponent(sectionId)}`;
  return `<p class="more"><a href="${escapeHtml(href)}">View the full breakdown in your dashboard &rarr;</a></p>`;
}

/**
 * A section as a flow of units, one direct child per unit. The browser script (assets/paginate.js)
 * places the units on A4 pages and moves what does not fit to the next page.
 */
function sectionSource(section: TSectionView, footer: string, dashboardUrl: string | undefined): string {
  const body = `${section.blocks.map(blockHtml).join("\n")}\n${sectionMoreHtml(section.id, dashboardUrl)}`;
  return `<div class="section-source" data-id="${escapeHtml(section.id)}" data-number="${escapeHtml(section.number)}" data-title="${escapeHtml(section.title)}" data-footer="${escapeHtml(footer)}">${body}</div>`;
}

function coverPage(view: TReportView, assets: TReportAssets): string {
  const clientLogo = view.cover.clientLogoDataUri
    ? `<img alt="${escapeHtml(view.cover.clientName)}" src="${view.cover.clientLogoDataUri}" />`
    : `<div class="fallback">${escapeHtml(view.cover.clientName)}</div>`;
  return `<section class="page cover">
<div class="cover-art"><img alt="" src="${assets.coverArtUri}" /></div>
<div class="dots"><img alt="" src="${assets.dotsUri}" /></div>
<div class="lc-logo"><img alt="" src="${assets.lcLogoUri}" /></div>
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
<div class="lc-logo"><img alt="" src="${assets.lcLogoUri}" /></div>
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

export type TReportHtmlOptions = {
  /** Dashboard link for this report (`reportDashboardUrl`). Section links are added to it. */
  dashboardUrl?: string;
};

/** Full print document for one report snapshot. The same HTML is used for the browser preview and the PDF. */
export function renderReportHtml(snapshot: TReportSnapshotDto, assets: TReportAssets = EMPTY_REPORT_ASSETS, options: TReportHtmlOptions = {}): string {
  const view = buildReportView(snapshot, { nextSteps: true });
  const footer = snapshot.project.name;
  const sources = view.sections.map((section) => sectionSource(section, footer, options.dashboardUrl)).join("\n");
  const pages = [coverPage(view, assets), `<div id="sources" class="sources">${sources}</div>`, closingPage(view, assets)];
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
<template id="chevrons-tpl"><div class="chevrons"><img alt="" src="${assets.chevronsUri}" /></div></template>
<script>${assets.paginateJs}</script>
</body>
</html>`;
}
