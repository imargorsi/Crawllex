import { REPORT_BRAND, REPORT_PALETTE } from "@/lib/reports/constants";
import { escapeHtml } from "@/lib/reports/escape";
import {
  formatInt,
  formatDuration,
  formatPercent,
  formatPosition,
  relativeChange,
  type TChange,
} from "@/lib/reports/format";
import { formatMonthTitle } from "@/lib/reports/period";
import { barChartSvg, lineChartSvg } from "@/lib/reports/svg-charts";
import type {
  TReportNarrativeSectionDto,
  TReportRankedRowDto,
  TReportSnapshotDto,
} from "@/types/reports.types";

/**
 * Builds the print-ready HTML document for a report snapshot. Pure function: no I/O.
 * The PDF renderer receives this HTML unchanged. All data and notes are escaped here.
 */

const CSS = `
:root {
  --accent: ${REPORT_PALETTE.accent};
  --accent-dark: ${REPORT_PALETTE.accentDark};
  --ink: ${REPORT_PALETTE.ink};
  --muted: ${REPORT_PALETTE.muted};
  --line: ${REPORT_PALETTE.line};
  --surface: ${REPORT_PALETTE.surface};
  --positive: ${REPORT_PALETTE.positive};
  --negative: ${REPORT_PALETTE.negative};
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; color: var(--ink); font-family: "Helvetica Neue", Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
.page { width: 210mm; height: 297mm; padding: 16mm 16mm 14mm; position: relative; overflow: hidden; page-break-after: always; background: #fff; }
.page:last-child { page-break-after: auto; }
.header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid var(--accent); padding-bottom: 6mm; margin-bottom: 8mm; }
.header h2 { margin: 0; font-size: 22pt; color: var(--accent); text-transform: uppercase; letter-spacing: .02em; }
.header .number { font-size: 28pt; color: #c7cbd1; font-weight: 700; }
.footer { position: absolute; left: 16mm; right: 16mm; bottom: 8mm; display: flex; justify-content: space-between; font-size: 8.5pt; color: var(--muted); border-top: 1px solid var(--line); padding-top: 3mm; }
h3 { font-size: 13pt; margin: 6mm 0 2mm; color: var(--ink); }
p { margin: 0 0 3mm; }
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
.cover { background: linear-gradient(160deg, #fff 45%, #fde7e5 100%); }
.cover .brand { font-size: 18pt; font-weight: 700; color: var(--ink); }
.cover .brand span { color: var(--accent); }
.cover .eyebrow { margin-top: 60mm; font-size: 12pt; color: var(--muted); text-transform: uppercase; letter-spacing: .15em; }
.cover h1 { font-size: 46pt; margin: 2mm 0 0; color: var(--accent); line-height: 1.05; }
.cover .client { font-size: 20pt; margin-top: 8mm; font-weight: 600; }
.cover .period { font-size: 13pt; color: var(--muted); margin-top: 2mm; }
.closing { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; height: 100%; }
.closing h2 { font-size: 26pt; color: var(--accent); margin: 0 0 8mm; }
.closing .line { font-size: 12pt; margin: 2mm 0; }
.legal { font-size: 8.5pt; color: var(--muted); margin-top: 10mm; max-width: 140mm; }
`;

function changeClass(change: TChange): string {
  if (change.direction === "up") return "up";
  if (change.direction === "down") return "down";
  return "flat";
}

function changeLabel(change: TChange): string {
  if (change.ratio == null) return "";
  const arrow = change.direction === "up" ? "▲" : change.direction === "down" ? "▼" : "■";
  return `${arrow} ${Math.abs(change.ratio * 100).toFixed(1)}% vs previous`;
}

function kpi(label: string, value: string, change?: TChange): string {
  const changeHtml = change && change.ratio != null
    ? `<div class="change ${changeClass(change)}">${escapeHtml(changeLabel(change))}</div>`
    : "";
  return `<div class="kpi"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div>${changeHtml}</div>`;
}

/** One printed page. `number` is the two-digit section number shown in the header. */
function page(number: string, title: string, body: string, footerLeft: string, pageNo: number): string {
  return `<section class="page">
<div class="header"><h2>${escapeHtml(title)}</h2><div class="number">${escapeHtml(number)}</div></div>
${body}
<div class="footer"><span>${escapeHtml(footerLeft)}</span><span>${pageNo}</span></div>
</section>`;
}

function paragraphs(items: string[]): string {
  return items.map((text) => `<p>${escapeHtml(text)}</p>`).join("\n");
}

function sectionByKey(
  sections: TReportNarrativeSectionDto[],
  key: TReportNarrativeSectionDto["key"],
): TReportNarrativeSectionDto | undefined {
  return sections.find((section) => section.key === key);
}

function rankedTable(
  headers: string[],
  rows: TReportRankedRowDto[],
  columns: (row: TReportRankedRowDto) => string[],
  emptyText: string,
): string {
  if (rows.length === 0) return `<p class="note">${escapeHtml(emptyText)}</p>`;
  const head = headers
    .map((header, index) => `<th${index > 0 ? ' class="num"' : ""}>${escapeHtml(header)}</th>`)
    .join("");
  const body = rows
    .map((row) => {
      const cells = columns(row)
        .map((cell, index) => {
          const cls = index === 0 ? ' class="url"' : ' class="num"';
          return `<td${cls}>${escapeHtml(cell)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function ctrText(value: number | null): string {
  return formatPercent(value);
}

function coverPage(snapshot: TReportSnapshotDto): string {
  return `<section class="page cover">
<div class="brand">${escapeHtml(REPORT_BRAND.name.split(" ")[0])}<span> ${escapeHtml(REPORT_BRAND.name.split(" ").slice(1).join(" "))}</span></div>
<div class="eyebrow">Monthly SEO report</div>
<h1>${escapeHtml(formatMonthTitle(snapshot.period.from))}</h1>
<div class="client">${escapeHtml(snapshot.project.name)}</div>
<div class="period">${escapeHtml(snapshot.period.label)}</div>
<div class="period">${escapeHtml(snapshot.project.websiteUrl)}</div>
</section>`;
}

function summaryBody(snapshot: TReportSnapshotDto): string {
  const { gsc, ga4, leads, activities, narrative } = snapshot;
  const cards = [
    kpi("Search clicks", formatInt(gsc.current.clicks), relativeChange(gsc.current.clicks, gsc.previous.clicks)),
    kpi("Impressions", formatInt(gsc.current.impressions), relativeChange(gsc.current.impressions, gsc.previous.impressions)),
    kpi("Sessions", formatInt(ga4.current.sessions), relativeChange(ga4.current.sessions, ga4.previous.sessions)),
    kpi("Users", formatInt(ga4.current.totalUsers), relativeChange(ga4.current.totalUsers, ga4.previous.totalUsers)),
    kpi("Leads", formatInt(leads.total), relativeChange(leads.total, leads.previousTotal)),
    kpi("Blog posts", formatInt(activities.current.blogs), relativeChange(activities.current.blogs, activities.previous.blogs)),
    kpi("Avg position", formatPosition(gsc.current.position)),
    kpi("Click-through rate", ctrText(gsc.current.ctr)),
  ].join("");

  const findings = narrative.keyFindings.length
    ? `<h3>Key findings</h3><ul>${narrative.keyFindings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";

  return `<div class="kpis">${cards}</div>
<h3>Executive summary</h3>
<ul>${narrative.executiveSummary.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
${findings}`;
}

/** Body and title of one page. Page numbers are assigned in order by `renderReportHtml`. */
type TPageSpec = { title: string; body: string };

function searchPages(snapshot: TReportSnapshotDto): TPageSpec[] {
  const section = sectionByKey(snapshot.narrative.sections, "search");
  const { gsc, sources } = snapshot;
  const dates = gsc.series.map((point) => point.date);
  const chart =
    sources.gsc && gsc.series.length > 1
      ? `<div class="chart">${lineChartSvg(dates, [
          { name: "Clicks", color: REPORT_PALETTE.series[0], values: gsc.series.map((p) => p.clicks) },
          { name: "Impressions", color: REPORT_PALETTE.series[1], values: gsc.series.map((p) => p.impressions) },
        ])}</div>`
      : `<p class="note">No daily search data for this period.</p>`;

  const cards = sources.gsc
    ? `<div class="kpis">${[
        kpi("Clicks", formatInt(gsc.current.clicks), relativeChange(gsc.current.clicks, gsc.previous.clicks)),
        kpi("Impressions", formatInt(gsc.current.impressions), relativeChange(gsc.current.impressions, gsc.previous.impressions)),
        kpi("CTR", ctrText(gsc.current.ctr)),
        kpi("Avg position", formatPosition(gsc.current.position)),
      ].join("")}</div>`
    : "";

  const searchColumns = (row: TReportRankedRowDto) => [
    row.value,
    formatInt(row.clicks),
    formatInt(row.impressions),
    ctrText(row.ctr),
    formatPosition(row.position),
  ];
  const headers = ["Query", "Clicks", "Impressions", "CTR", "Position"];

  return [
    {
      title: "Search performance",
      body: `${cards}${paragraphs(section?.paragraphs ?? [])}${chart}
<h3>Top search queries</h3>
${rankedTable(headers, gsc.topQueries, searchColumns, "No search queries for this period.")}`,
    },
    {
      title: "Top search pages",
      body: `<h3>Top search pages</h3>
${rankedTable(headers.map((h) => (h === "Query" ? "Page" : h)), gsc.topPages, searchColumns, "No search pages for this period.")}`,
    },
  ];
}

function trafficPages(snapshot: TReportSnapshotDto): TPageSpec[] {
  const section = sectionByKey(snapshot.narrative.sections, "traffic");
  const { ga4, sources } = snapshot;
  const dates = ga4.series.map((p) => p.date);
  const chart =
    sources.ga4 && ga4.series.length > 1
      ? `<div class="chart">${lineChartSvg(dates, [
          { name: "Sessions", color: REPORT_PALETTE.series[0], values: ga4.series.map((p) => p.sessions) },
        ])}</div>`
      : `<p class="note">No daily traffic data for this period.</p>`;

  const channels = ga4.channels.filter((row) => (row.sessions ?? 0) > 0).slice(0, 6);
  const channelChart = channels.length
    ? `<h3>Traffic by channel</h3><div class="chart">${barChartSvg(
        channels.map((row) => ({ label: row.value, value: row.sessions ?? 0 })),
      )}</div>`
    : "";

  const cards = sources.ga4
    ? `<div class="kpis">${[
        kpi("Sessions", formatInt(ga4.current.sessions), relativeChange(ga4.current.sessions, ga4.previous.sessions)),
        kpi("Users", formatInt(ga4.current.totalUsers), relativeChange(ga4.current.totalUsers, ga4.previous.totalUsers)),
        kpi("New users", formatInt(ga4.current.newUsers), relativeChange(ga4.current.newUsers, ga4.previous.newUsers)),
        kpi("Organic sessions", formatInt(ga4.current.organicSessions), relativeChange(ga4.current.organicSessions, ga4.previous.organicSessions)),
      ].join("")}</div>`
    : "";

  return [
    {
      title: "Website traffic",
      body: `${cards}${paragraphs(section?.paragraphs ?? [])}${chart}${channelChart}`,
    },
    {
      title: "Audience and landing pages",
      body: `<h3>Top countries</h3>
${rankedTable(["Country", "Sessions"], ga4.countries, (row) => [row.value, formatInt(row.sessions)], "No country data for this period.")}
<h3>Top landing pages</h3>
${rankedTable(["Page", "Sessions"], ga4.topPages, (row) => [row.value, formatInt(row.sessions)], "No page data for this period.")}`,
    },
  ];
}

function engagementPage(snapshot: TReportSnapshotDto): TPageSpec {
  const section = sectionByKey(snapshot.narrative.sections, "engagement");
  const { ga4, events } = snapshot;
  const contactCards = [
    kpi("Calls", formatInt(events.contacts.call)),
    kpi("Email clicks", formatInt(events.contacts.email)),
    kpi("WhatsApp clicks", formatInt(events.contacts.whatsapp)),
  ].join("");

  const cards = snapshot.sources.ga4
    ? `<div class="kpis">${[
        kpi("Engagement rate", formatPercent(ga4.current.engagementRate)),
        kpi("Avg time on site", formatDuration(ga4.current.avgSessionDuration)),
        kpi("Page views", formatInt(ga4.current.pageViews)),
        kpi("Engaged sessions", formatInt(ga4.current.engagedSessions)),
      ].join("")}</div>`
    : "";

  const highlights = events.highlights.length
    ? `<h3>Tracked actions</h3><table><thead><tr><th>Action</th><th class="num">Count</th></tr></thead><tbody>${events.highlights
        .map((item) => `<tr><td>${escapeHtml(item.label)}</td><td class="num">${escapeHtml(formatInt(item.count))}</td></tr>`)
        .join("")}</tbody></table>`
    : "";

  return {
    title: "Engagement and contact actions",
    body: `${cards}<div class="cards3">${contactCards}</div>${paragraphs(section?.paragraphs ?? [])}${highlights}`,
  };
}

function leadsPage(snapshot: TReportSnapshotDto): TPageSpec {
  const leadsSection = sectionByKey(snapshot.narrative.sections, "leads");
  const contentSection = sectionByKey(snapshot.narrative.sections, "content");
  const { leads, activities } = snapshot;

  const origins = Object.entries(leads.byOrigin ?? {})
    .filter(([, count]) => count > 0)
    .map(([origin, count]) => `<tr><td>${escapeHtml(origin)}</td><td class="num">${escapeHtml(formatInt(count))}</td></tr>`)
    .join("");

  const activityRows = [
    ["Blog posts", activities.current.blogs, activities.previous.blogs],
    ["Backlinks", activities.current.backlinks, activities.previous.backlinks],
    ["Technical tasks", activities.current.technical_work, activities.previous.technical_work],
  ]
    .map(
      ([label, current, previous]) =>
        `<tr><td>${escapeHtml(String(label))}</td><td class="num">${escapeHtml(formatInt(Number(current)))}</td><td class="num">${escapeHtml(formatInt(Number(previous)))}</td></tr>`,
    )
    .join("");

  const blogs = activities.blogs.length
    ? `<h3>Published blog posts</h3><table><thead><tr><th>Title</th><th class="num">Date</th></tr></thead><tbody>${activities.blogs
        .map((blog) => `<tr><td>${escapeHtml(blog.title)}</td><td class="num">${escapeHtml(blog.occurredOn)}</td></tr>`)
        .join("")}</tbody></table>`
    : "";

  return {
    title: "Leads and content",
    body: `<div class="kpis">${[
      kpi("Leads", formatInt(leads.total), relativeChange(leads.total, leads.previousTotal)),
      kpi("Blog posts", formatInt(activities.current.blogs), relativeChange(activities.current.blogs, activities.previous.blogs)),
      kpi("Backlinks", formatInt(activities.current.backlinks), relativeChange(activities.current.backlinks, activities.previous.backlinks)),
      kpi("Technical tasks", formatInt(activities.current.technical_work)),
    ].join("")}</div>
${paragraphs(leadsSection?.paragraphs ?? [])}
${origins ? `<h3>Leads by source</h3><table><tbody>${origins}</tbody></table>` : ""}
<h3>Work logged</h3>
<table><thead><tr><th>Type</th><th class="num">This period</th><th class="num">Previous period</th></tr></thead><tbody>${activityRows}</tbody></table>
${paragraphs(contentSection?.paragraphs ?? [])}
${blogs}`,
  };
}

function notesPage(snapshot: TReportSnapshotDto): TPageSpec {
  const { notes } = snapshot;
  const highlights = notes.highlights.length
    ? `<h3>Highlights</h3><ul>${notes.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
  const translation = notes.translationStatus
    ? `<h3>Website translation</h3><div class="callout">${escapeHtml(notes.translationStatus)}</div>`
    : "";
  const closing = notes.closingNote ? `<h3>Next steps</h3><p>${escapeHtml(notes.closingNote)}</p>` : "";
  const content = highlights + translation + closing;
  return {
    title: "Notes and next steps",
    body: content || `<p class="note">No additional notes for this period.</p>`,
  };
}

function closingPage(): string {
  return `<section class="page"><div class="closing">
<h2>Contact us</h2>
<div class="line">${escapeHtml(REPORT_BRAND.phone)}</div>
<div class="line">${escapeHtml(REPORT_BRAND.email)}</div>
<div class="line">${escapeHtml(REPORT_BRAND.website)}</div>
<p class="legal">Figures come from Google Search Console and Google Analytics as cached by Crawllex. Minor differences from the source dashboards can occur due to data sampling and the ranking of top rows.</p>
</div></section>`;
}

/** Full print document for one report. Pages are numbered in order. */
export function renderReportHtml(snapshot: TReportSnapshotDto): string {
  const title = `${snapshot.project.name} — ${formatMonthTitle(snapshot.period.from)}`;
  const footer = snapshot.project.name;

  const specs: TPageSpec[] = [
    { title: "Executive summary", body: summaryBody(snapshot) },
    ...searchPages(snapshot),
    ...trafficPages(snapshot),
    engagementPage(snapshot),
    leadsPage(snapshot),
    notesPage(snapshot),
  ];

  const pages = [
    coverPage(snapshot),
    ...specs.map((spec, index) =>
      page(String(index + 1).padStart(2, "0"), spec.title, spec.body, footer, index + 1),
    ),
    closingPage(),
  ];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>${CSS}</style>
</head>
<body>
${pages.join("\n")}
</body>
</html>`;
}
