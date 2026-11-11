# Client Reports (Module 11)

**Status:** v1 merged to `dev` (`8ba3fe5`, 2026-11-04). Manual create, email to recipients on create. No cron, no scheduled sending. Checked 2026-11-09: tsc clean, 1139 tests pass across 59 files.
Spec: `source/SEO Dashboard - By Modules.md` (Module 11). Automation idea (parked): `roadmap-automated-client-reporting.md`.

## What it does

The SEO team picks a project and a month, optionally writes any section (executive summary, search performance, website traffic, engagement and leads, work logged) and writes the required **Next steps**. Crawllex collects that month's cached analytics, leads and logged work, builds the report text from fixed templates (or uses the written text where provided), and stores a **snapshot**. The same snapshot drives two views:

- **In-app report** (`/reports/[reportId]`): hero, section tabs, KPI tiles, charts, highlight cards and drilldown modals.
- **PDF** (Download PDF): A4 summary from the same view model. Sections 01–06, including 06 Next steps (written text, added 2026-11-10). Each section ends with a link to its dashboard tab for the full breakdown.

Period: calendar month (`1 Sep 2026 - 30 Sep 2026`). Comparison: previous calendar month. Other ranges accepted by the API (max 366 days).
Data is read from the cache only. Google is never called when a report is built.

## Data layers (one path for both views)

| Layer | File | Role |
|-------|------|------|
| Collect | `lib/reports/collect.ts` | Reads GSC/GA4 cache, leads, SEO activities (blogs, backlinks, technical work) for period and previous period |
| Text | `lib/reports/report-text.ts` | Fixed paragraph templates filled from the snapshot (no LLM). Paragraphs are separated by `PARAGRAPH_BREAK` |
| Written text | `lib/reports/rich-text.ts` | Block model for hand-written text: heading, paragraph, bullets, bold, italic. Stored as blocks, never HTML |
| Wording | `lib/reports/copy.ts` | Section titles, labels, table headers (English) |
| View model | `lib/reports/view-model.ts` | Sections, blocks (KPIs, cards, charts, tables, bullets, rich text), built from the snapshot. Pure |
| Snapshot | `lib/reports/report-service.ts` | Creates, lists, reads, deletes reports. Stores `snapshot`, `notes` and the list `summary` |
| PDF | `lib/reports/render-html.ts` + `pdf-client.ts` | Renders the view model as HTML and posts it to the renderer |
| In-app | `components/reports/report-view/*` | Renders the same view model with UI components |
| Create form | `app/(dashboard)/reports/new`, `sections/reports-create-section.tsx`, `components/reports/report-create-form.tsx`, `rich-text-editor.tsx` | Month dropdown, optional section editors, required Next steps |

Rules:
- Report wording goes in `report-text.ts`. Report structure goes in `view-model.ts`. Renderers only render blocks.
- Views never compute wording or numbers themselves.
- Written text replaces the generated paragraph of its own section only. Other sections keep the generated text.
- Hand-written text is never rendered as HTML. The editor, the schema (`schemas/reports.ts`) and the renderers all work on blocks.

## Sections

Tabs run in this order. The first tab is active by default. Each overview paragraph is the written text when provided, else the generated one.

1. **Executive summary:** overview (written *Executive summary* or generated intro), then **Key highlights**: *Leads and contacts* cards (Leads, Calls, Email clicks, WhatsApp clicks) above *Content* cards (Blog posts, Backlinks, Technical tasks).
2. **Search performance:** overview (written *Search performance* or generated), 4 KPI tiles, daily clicks and daily impressions charts side by side, chips for Top search queries and Top search pages (modal tables).
3. **Website traffic:** overview (written *Website traffic* or generated), 4 KPI tiles, daily sessions chart beside *Traffic by channel* (donut and top 5 countries under it). The row has a fixed height on large screens so both cards match. Chip for Top landing pages (modal table).
4. **Engagement and leads:** overview (written *Engagement and leads* or generated), Leads card (opens the leads modal), Engagement KPIs, *Top events overall* as up to 5 bullets written by `describeEvent`.
5. **Work logged:** overview (written *Work logged* or generated), three cards (Blog posts, Backlinks, Technical tasks). Each opens a modal with every item: title, URL, date, notes.

## Create form and written text (`/reports/new`, full page, two steps)

Steps use the projects create form pattern: stepper, one card, Previous / Next footer. 1 Report (month and send-to), 2 Content (written sections, then next steps).

- Month: custom dropdown (`Input type="select"`). Covers the calendar month.
- Written text (optional): executive summary, search performance, website traffic, engagement and leads, work logged. Empty means "use the generated text".
- Next steps (required, last field of the Content step): saved in `snapshot.notes.nextSteps`. Not rendered anywhere yet.
- Send to (optional, same row as the month): Crawllex users chosen with the project invite select. The project owner is added by default. Saved as `notes.recipientUserIds`. Recipients get the report email only when someone clicks **Send Report** (see Sending).
- Editor: bold, italic, heading (H2), subheading (H3), paragraph, bullet list. Links: select text, Link, address (https:// is added when no scheme is typed). Only https, http and mailto links are saved. Pasted text is plain. No colours or images.
- Validation: `createReportSchema` (`schemas/reports.ts`). Blocks are a closed set. Text max 30,000 characters per document, at most 200 blocks.

## In-app page (`components/reports/report-view/`)

- `report-hero.tsx`: client logo when the snapshot has one, else the client name badge. Month, period chip, created date, Download PDF and Delete.
- `report-detail-view.tsx`: section tabs and the generic block renderer. Groups blocks into rows (chart + donut, stacked chart cards) and renders drilldown buttons (`row` and `chip` variants) that open `components/ui/modal.tsx` with `ReportTable`.
- `report-view-blocks.tsx`: `ReportKpi`/`ReportKpiGrid`, `ChangeText` (trend colour), `Emphasis` (paragraphs, bold figures), `RichDoc` (written text), `ReportAreaChart` (recharts), `ReportDonut`, `ReportTable`, `ReportNote`, `ReportCallout`, and `REPORT_ICON` (icon per report icon key).

## Limits

| Constant | Value | Used for |
|----------|-------|----------|
| `REPORT_TOP_ROWS` | 10 | Top queries, pages, countries, landing pages (from collect) |
| `REPORT_MAX_ACTIVITY_ROWS` | 100 | Blog, backlink, technical and lead rows per period |
| `REPORT_MAX_TOP_EVENTS` | 5 | Top events bullets |
| `REPORT_MAX_TOP_COUNTRIES` | 5 | Countries under the channel donut |

## Permissions

| Key | Used by |
|-----|---------|
| `reports.view` | list, detail, PDF download |
| `reports.create` | create |
| `reports.delete` | delete |

Defaults: `project_owner` gets `reports.view` and `reports.delete` (not create). `project_user` gets `reports.view` only. Nobody gets `reports.create` by default: admins grant it in `/roles`. Super admins have all three in code. Custom roles: add in `/roles`.

Only the dev DB (and any local DB) ever got `reports.create` on `project_owner`, from an unmerged commit on the reports branch. Production never had it, because Reports was never on `main`. So `migrate:owner-report-create` (local) cleans the dev DB. `migrate:prod:owner-report-create` is a no-op on prod unless the owner role there was changed by hand. Check the owner role in prod before running it.

## PDF layout, charts and pagination (2026-11-09)

- Pages: cover, one flow per section (01 to 05), closing page. Every section page has a header, body and footer. Footer shows the project name and page number.
- Pagination is measured in the browser (`lib/reports/assets/paginate.js`, inlined into the HTML). Each section is a flow of units (a heading plus the block after it, or one block). A unit that does not fit moves to a new page, with the header marked `(cont.)`. The dashboard link stays with the unit before it.
- The script sets `window.reportReady = true` and `data-report-check` on `<html>`, e.g. `{"units":22,"placed":22,"pages":7,"oversized":[]}`. `placed` must equal `units`. `oversized` lists any unit taller than a full page. Check this value before sending.
- The renderer waits for `window.reportReady` before printing (`services/report-renderer/server.mjs`). A renderer without that wait can print before pagination finishes.
- Charts (`lib/reports/svg-charts.ts`): daily area charts with total, daily average and best day above each chart; ranked bars show value and share. Days without data plot as 0 (`dayRange` / `filledDaily` in `view-model.ts`). Plain SVG only: no filters or blend modes.
- Figures in paragraphs and cards are blue and bold (`emphasisHtml`). Paragraphs split on `PARAGRAPH_BREAK`, as on the dashboard.
- Boxes: soft gradient, fine outline, small radius (`--box-*` tokens in `render-html.ts`).
- Preview HTML was removed from the UI on 2026-11-10. The `/html` route remains (server-side only), not linked from the app.
- Full breakdown: each section ends with **View the full breakdown in your dashboard**, linking to `/reports/[id]?project=[projectId]&section=<summary|search|traffic|engagement|work>`. The dashboard opens that tab.
- Links use `APP_URL` (`env.frontendUrl`). Set it to the public URL where clients log in. A localhost value makes the links useless for clients.
- Artwork is PNG with a transparent background (`lib/reports/assets/*.png`). The old SVG files rendered black in Chrome PDF (feColorMatrix filters and `mix-blend-mode`), so they were removed.
- The PDF shows KPI cards without the long explanation text, and charts without ranked tables. The full text and tables stay in the dashboard.

- Each PDF section ends with **View the full breakdown in your dashboard**. It links to `/reports/[id]?project=[projectId]&section=<summary|search|traffic|engagement|work>`, and the dashboard opens that tab.
- Links use `APP_URL` (`env.frontendUrl`). Set it to the public URL where clients log in. A localhost value makes the links useless for clients.
- Artwork is PNG with a transparent background (`lib/reports/assets/*.png`). The old SVG files rendered black in Chrome PDF (feColorMatrix filters and `mix-blend-mode`), so they were removed.
- The PDF shows KPI cards without the long explanation text, charts without ranked tables. The full text stays in the dashboard. Summary rows: 4 per line.

## Storage

Collection `reports` (`models/Report.ts`): `projectId`, `periodFrom/To`, `previousFrom/To`, `title`, `summary` (first paragraph for list cards: the written executive summary when provided), `notes` (written text and next steps), `snapshot` (Mixed), `createdBy`, timestamps. `minimize: false` keeps empty objects.
Snapshots are frozen. A report shows the data it was created with. Reports created before a field existed show that field empty (for example lead rows and activity detail lists, or written text). Regenerate the report to get them.
PDFs render on demand, not stored.

## Sending (manual)

- Creating a report sends nothing. **Send Report** on the report page emails the recipients (`notes.recipientUserIds`): the current PDF attached and an "Open Report" button to the live report (`/reports/[id]?project=[projectId]`). The page selects that project for the reader.
- Send runs in the request (`POST .../send`, `reports.create`) through `sendReport` and `lib/reports/report-delivery.ts`. It renders the PDF, then emails each recipient not yet marked `sent`. Click Send again after a failure: sent recipients are skipped.
- Template: `lib/mail/templates/report-ready.ts` (shared layout, Crawllex branding).
- Each recipient gets an entry in `notes.deliveries` with `sent`, `not_sent` (SMTP not configured, nothing sent), `failed` (PDF or SMTP error, message stored) or `skipped` (user inactive or no email).
- Idempotent: a recipient already marked `sent` on the report is skipped, so the same report is never emailed twice to the same person.
- Delivery details (`deliveries`, `recipientCount`) are returned only to users with `reports.create`. Other roles never receive them (list and detail routes; the PDF route never includes them).
- Reports page: a status chip per card and table row: `Not Sent` before the first send, `Sent` when every recipient has `sent`, `N Sent · M Failed` when some failed or only some were sent, `No Recipients` when none are set. Clicking it opens the per-recipient list (name, email, status, time, error).
- SMTP verified on dev 2026-11-09: Zoho (`MAIL_*` in `.env.local`) sent a report with PDF to a real inbox. Status `sent`. Production SMTP not verified.
- Needs SMTP (`MAIL_*`) and the renderer (`REPORT_RENDERER_URL`, `REPORT_RENDERER_TOKEN`). Without the renderer, no email is sent and each recipient is stored as `failed` with "PDF not rendered" (`lib/reports/report-delivery.ts`). Without SMTP (`MAIL_MAILER` unset or no host), `sendMail` logs and returns false, so the status is `not_sent`.
- No automatic retry. A failed recipient stays `failed` until Send Report is clicked again.

## API

Under `/api/v1/projects/[id]/reports`:
- `GET` list (summary, KPIs) · `POST` create (`periodFrom`, `periodTo`, `written`, `nextSteps`)
- `GET /[reportId]` detail with snapshot · `DELETE /[reportId]`
- `GET /[reportId]/pdf` PDF (503 when renderer not configured), `reports.view`
- `GET /[reportId]/html` same document as the PDF, for the browser preview (`reports.view`). Served with a strict Content-Security-Policy.
- `POST /[reportId]/send` emails unsent recipients (`reports.create`).

## PDF renderer (separate service)

`services/report-renderer/`: standalone Node service (puppeteer-core + Chromium). Imports nothing from the app.

| Env (Crawllex app) | Meaning |
|--------------------|---------|
| `REPORT_RENDERER_URL` | Renderer base URL: `https://render.logicalcreations.cloud` (public, tunnel) |
| `REPORT_RENDERER_TOKEN` | Shared Bearer secret |

| Env (renderer) | Meaning |
|----------------|---------|
| `REPORT_RENDERER_TOKEN` | Must match the app |
| `CHROME_PATH` | Chromium/Chrome binary (`/usr/bin/chromium` locally; `/usr/bin/google-chrome` on logibox) |
| `HOST`, `PORT`, `MAX_CONCURRENT_PAGES`, `RENDER_TIMEOUT_MS` | Optional |

Contract: `POST /render` (`text/html`, max 5 MB) → `application/pdf`. `GET /health`. All page network requests are blocked. The renderer waits for `window.reportReady` (set by the report script) before printing, up to `RENDER_TIMEOUT_MS`.

**Current state:**
- Local dev: renderer runs on `127.0.0.1:8788`; `.env.local` has the two variables (git-ignored).
- Renderer host is **logibox** (Google Chrome at `/usr/bin/google-chrome`), public as `https://render.logicalcreations.cloud` through the Cloudflare tunnel `logibox` (since 2026-11-09). Bearer token required (401 without). Tailnet address `100.90.184.0:8788` still works for local dev. Tunnel setup: logibox dossier SETUP_LOG 2026-11-09. Vercel `crawllex-dev` and production use the public URL. Hostinger production env still needs the same two vars set by hand.
- `.env.local` (dev) points `REPORT_RENDERER_URL` at logibox.

## Known gaps

- PDF is a summary by design: ranked tables, countries and modal detail are only in the dashboard. Each section links there.
- Next steps are stored but not shown anywhere yet (by design for now).
- Top-N rankings are approximate (sum of daily top-100 rows).
- Missing GA4 dimensions (session source/medium, first-user source, page titles).
- No cron, no scheduled sending. Email only on Send Report.
- Send runs inside the request. If the server restarts mid-send, the recipients not yet marked `sent` stay unsent. Click Send Report again. Check `notes.deliveries` in the Reports page.
- Editor toolbar labels are English. Report text (generated) is English.
- Brand email and phone in `REPORT_BRAND` need confirmation before client send.
- Custom project roles need `reports.*` added in `/roles`.

## Tests

`tests/reports-period.test.ts`, `reports-schema.test.ts` (create validation, next steps, written text), `reports-rich-text.test.ts`, `reports-render.test.ts` (escaping), `reports-written-render.test.ts` (written text in render), `reports-service.test.ts` (data, snapshot, summary, RBAC), `reports-delivery.test.ts` (email on create, recipient status, idempotency).
The editor's DOM serialisation has no unit test (no DOM test environment in the repo). It was checked manually in the browser.
