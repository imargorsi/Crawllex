# Architecture

## Shape

One Next.js app serves both UI and API. The client is a SPA-style dashboard. Pages are client
components that fetch `/api/v1` through TanStack Query with a Bearer token. There are no Server
Actions and no server-rendered data.

```
Browser (app/(dashboard) pages → sections/ → components/)
   │  features/*/…api.ts (TanStack Query) → lib/frontend/api/base.ts  (Bearer token from localStorage)
   ▼
app/api/v1/**/route.ts   withApiHandler → runApiGuards → (project access check) → Zod parse
   ▼
lib/<domain>/*.ts        business logic, serializers → DTOs (types/)
   ▼
models/ (Mongoose) → MongoDB        R2 (files)   Google APIs (sync only)   SMTP
```

External callers that don't use a user token:
- WordPress plugin → `/api/v1/leads/*` with a lead-source key
- Vercel Cron → `/api/v1/cron/analytics-sync` with `CRON_SECRET`
- Public onboarding page → `/api/v1/onboarding/[shareToken]`

## API Conventions

- `withApiHandler` (`lib/api/handler.ts`) catches errors and maps them through `handleApiError`.
  `HttpError` subclasses live in `lib/api/http-errors.ts`.
- `ApiResponse` (`lib/api/response.ts`): `success(data, message, status)`, `error(message, errors, status)`,
  `validation(...)` (422), and `paginated(items, pagination, filters)`. The pagination shape mirrors Laravel's.
- Messages are sentence case (see the copy rule in `AGENTS.md`).
- `connectDb()` caches the Mongoose connection on `global` (safe across hot reload and serverless).

## Authentication

- **Tokens:** opaque `"<tokenId>|<40 random chars>"`. Only the SHA-256 hash is stored (`AccessToken`).
  The TTL is 24h, and expired or legacy (null-expiry) tokens are deleted on lookup. The exception is
  service tokens (non-expiring, staging only, gated by `CRAWLEX_SERVICE_TOKENS_ENABLED`): see `doc/service-tokens.md`.
  There are no cookies.
  The client stores the token in `localStorage` (`auth_access_token`, plus `auth_user`).
- **Guards** (`lib/auth/run-api-guards.ts`): authenticate → active user → verified email (default on)
  → optional `superAdmin` / `permission` / `anyPermission` (platform perms only). Project perms are
  checked separately (see `doc/rbac.md`).
- **Email verification:** HMAC-signed URL keyed on `APP_KEY` (`lib/auth/signed-url.ts`) → `app/email/verify/[id]/[hash]`.
- **Password reset:** hashed token in `PasswordResetToken`, throttled and with an expiry.
  A reset revokes all of the user's tokens.
- **Google sign-in:** `/auth/google/redirect` → Google → `/auth/google/callback` (server) creates
  a one-time `OAuthLoginCode` (2 min, TTL index) → browser page `app/(auth)/auth/google/callback`
  → `POST /auth/google/exchange` → access token. `User.accountSource` records password vs Google.
- **Rate limiting** (`lib/auth/rate-limit.ts`) is an **in-memory Map**. It is per instance and resets
  on cold start, so it is weak on serverless.
- Deactivating or deleting a user revokes all of their tokens. Inactive users get 403 on every guarded route.

## Data Model (`models/`)

| Model | Key fields | Notes |
|-------|-----------|-------|
| `User` | email (unique), password (nullable for Google), googleId, emailVerifiedAt, roles[] (`super_admin` only), status, accountSource, themePack, fontPack, profileImage | |
| `Role` | slug (unique), name (unique, case-insensitive), scope `platform`/`project`, isSystem, permissions[], status | System: `project_owner`, `project_user` |
| `Project` | business fields, seoGoals (enum), competitorUrls, status `pending`/`active`/`inactive`/`rejected`, createdBy, approved/rejected by/at | |
| `ProjectMember` | projectId+userId (unique), roleId, status (invite → active), invitedBy | Ownership = membership with the `project_owner` role |
| `ProjectIntegration` | projectId+provider+service (unique), service `gsc`/`ga4`, status, externalPropertyId, lastSyncedAt, lastError | |
| `AnalyticsDailyMetric` | projectId+date+source (unique), GSC and GA4 totals | Sync cache |
| `AnalyticsDimensionRow` | projectId, date, source, dimensionType (query/page/country/device/landing_page/channel_group/event_name), value, metrics, eventCount (GA4 events) | Top 100 per type per day. GA4 contact events (call, email, WhatsApp clicks) are always kept, even outside the top 100 |
| `SeoActivity` | projectId, activityType (`blogs`/`backlinks`/`technical_work`), url, occurredOn, title/anchorText/details, docUrl, pushedToWordpress, wpPostId, wpPostLink, wpPushedAt | Blog rows pushed to WordPress carry `pushedToWordpress` and the post link as `url` |
| `Lead` | projectId, names, email, phone, message, leadDate, extras (Mixed), normalizedEmail+normalizedPhone (unique per project), origin `csv_import`/`manual`/`wordpress`, leadSourceId, idempotencyKey | Dedupe on email+phone |
| `LeadSource` | projectId+provider (unique, so **1 per project** in the MVP), keyHash (unique), keyPrefix `clx_ls_`, keyCiphertext, siteUrl, wpUsername, wpAppPasswordUuid, wpAppPasswordCiphertext, wpCredentialsUpdatedAt, counters, lastError | Lead key is hashed for lookup and encrypted for reveal. The WordPress application password is encrypted and never returned |
| `Client` ({B} only) | Module 13 intake brief: business, contact, project types, features[], integrations, links[], files[] (R2), launch info, shareToken (unique, `clx_ob_` prefix), status | Platform scoped |
| `AssistantQueryHistory` | projectId, userId, query, intent | |
| `AccessToken`, `PasswordResetToken`, `OAuthLoginCode` | | Auth plumbing |

Dates for analytics, activities and leads are stored as `YYYY-MM-DD` strings (UTC).

## Analytics Pipeline (Module 8)

1. A member with `integrations.update` lists the properties the service account can see
   (`GET …/integrations/google/properties`) and connects a GSC site or GA4 property (`PUT …/google/[service]`).
   The client adds the service-account email as a user on their GSC/GA4 property. Clients never share logins.
2. Sync (`lib/integrations/sync-analytics.ts`) pulls daily totals plus top-N dimensions into the cache:
   - First sync: a 90-day backfill. GA4 events (`event_name`) have their own flag, `eventsBackfilledAt`: until it is set, each GA4 sync pulls 90 days of events, so projects connected before events existed get their history on the next sync. After that: from `lastSyncedAt` − 3 days (GSC revisions) up to yesterday (UTC).
   - Triggers: on connect (`after()`), manual refresh (`integrations.refresh`, 1h cooldown per project),
     and the nightly cron `syncAllConnectedProjects` (500 ms between projects).
   - Race guards: writes abort if the integration was disconnected or swapped mid-sync. A disconnect purges that service's cache.
   - Google calls go through `withGoogleBackoff`.
3. Reads (`lib/integrations/read-analytics.ts`): `overview` and `dimensions` endpoints, max 366-day range.
   Both read the cache only.
3b. GA4 events (`event_name`): `fetchGa4TopEventsByDay` pulls `eventName` + `eventCount` per day. `lib/analytics/event-summary.ts` classifies names by token (tel/phone/call, mailto/email, whatsapp, form/lead, visit, scroll/engagement, download, click; anything else is "other"). Dashboard chips: Calls, WhatsApp and Email Clicks (from events), plus Leads (from the leads table). Top Events card is on `/analytics`. Chips show "—" when GA4 is not connected.
4. UI: `sections/analytics-section.tsx` has summary cards, trend chart, traffic sources, top
   queries/pages, world choropleth (d3-geo + topojson in `public/maps`), and an Excel (SpreadsheetML) export.

## Client Reports (Module 11)

Full doc: `doc/reports.md`.

- **Build:** `lib/reports/collect.ts` reads the analytics cache, leads and SEO activities for the period
  and the previous period. `report-text.ts` fills fixed paragraph templates from the snapshot (no LLM).
  `view-model.ts` turns the snapshot into sections. `render-html.ts` builds the print document. Charts are inline SVG (`svg-charts.ts`).
- **Snapshot:** `reports` collection stores the collected data and a list summary, so a saved report does not change
  when the cache changes. The PDF is rendered on demand.
- **PDF:** `pdf-client.ts` posts the HTML to the renderer (`services/report-renderer`, separate Node service with
  Chromium). The app only knows `REPORT_RENDERER_URL` and `REPORT_RENDERER_TOKEN`.
- **Routes:** `api/v1/projects/[id]/reports/*` with `reports.view|create|delete`.
- **UI:** `/reports` (list: cards and table, create sheet). `/reports/[reportId]`: hero, section tabs, KPI tiles, charts, highlight cards and drilldown modals. The view is `lib/reports/view-model.ts`, shared with the PDF.

## Leads (Module 10)

- **Manual CRUD:** `leads.create/update/delete`.
- **CSV import:** `POST …/leads/import/preview` (papaparse, auto-maps columns through
  `lib/leads/column-aliases.ts`, flags duplicates) → `POST …/leads/import` (commit).
  Limits: 2 MB, 2,000 rows. The project must be Active. Unmapped columns go to `extras`.
  Sample: `public/resources/crawllex_sample_sheet.csv` (same headers as the Drive xlsx).
- **WordPress capture:** create a lead source under Settings → Integrations, then copy the key. The plugin
  (`crawllex-leads-capture/`, supports CF7, WPForms, Elementor and others) calls `POST /leads/ingest/verify`
  (test connection) and `POST /leads/ingest` with the key in a header or Bearer. Ingest is rate limited,
  body-size capped, and idempotent per `(leadSourceId, idempotencyKey)`. Plugin self-update:
  `GET /leads/plugin/update`. Public zip: `/resources/crawllex-lead-capture.zip`, rewritten by `proxy.ts`
  to `/api/v1/downloads`.

## WordPress Integration (`lib/integrations/wordpress/`)

Crawllex talks to a connected site's WordPress REST API. It does not depend on the lead flow.

- **Connection:** the plugin creates a WordPress application password for the admin who clicks Verify.
  It sends `{ username, applicationPassword, applicationPasswordUuid }` to `POST /leads/ingest/verify`
  once, over HTTPS. Crawllex stores the password encrypted (`lib/crypto/secret-box.ts`) in `LeadSource`
  (`lib/integrations/wordpress/wp-credentials.ts`). WordPress shows the password only once, so the plugin
  only creates a new one when none is recorded or Crawllex reports `wpCredentialsStored: false`.
- **Server-only access:** `wp-source.ts` loads the project's connected source (`wpConnectionForProject`) or a
  source by id (`wpConnectionForSource`). `wp-rest.ts` is the only code that calls WordPress:
  `users/me` (connection test), `posts` POST (draft), and `posts/{id}` DELETE (trash, used for cleanup).
- **Draft-only:** the post body always sends `status: "draft"`. A non-draft response is trashed and the call fails.
  Only `https://` sites are called, redirects are refused, and the timeout is 15 s.
- **Routes:** `GET …/lead-sources/[sourceId]/wp-connection` (`integrations.view`) and
  `POST …/lead-sources/[sourceId]/wp-drafts` (`integrations.update`, body `{ title, content, excerpt? }`).

### Blog Push From A Google Doc (Module 9)

`POST …/seo-activities` with `type: "blogs"` and `pushToWordpress: true` (plus `docUrl`, `title`, `occurredOn`).

1. Requires `seo_activities.create` and `integrations.update`. The URL field is not needed (WordPress returns it).
2. `lib/seo-activities/publish-blog-draft.ts` loads the project's WordPress connection, downloads the public
   Google Doc (`lib/seo-activities/google-doc.ts`: `docs.google.com/document/d/<id>/export?format=html`; private
   docs are refused), converts it with cheerio, and creates the WordPress draft.
3. The converter (`convertGoogleDoc`) keeps h1–h6, paragraphs (blank Doc lines become `<p>&nbsp;</p>`), ul/ol/li,
   bold, italic, underline, http(s) links and tables. Google redirects are unwrapped. Leading and trailing blank
   paragraphs are trimmed.
   - Alignment: `text-align` (left, right, center, justify, start, end) is kept on paragraphs, headings and list
     items. Values come from the Doc's class or inline style.
   - Colors and borders: cell `background-color`, `border-*`, `vertical-align` and `text-align` are kept on
     `td`/`th`. Span `color` and `background-color` are kept. Only values matching the allow-list in
     `google-doc.ts` (`KEPT_STYLE_VALUES`) pass. Default black text (`#000000`) and white background (`#ffffff`)
     are dropped, so the theme's own colors apply.
   - WordPress keeps `style` attributes only for users with `unfiltered_html`. Check that the application-password
     user is an administrator, or the colors and alignment are stripped on save.
   - Tables become `<figure class="wp-block-table" style="overflow-x:auto"><table>…</table></figure>`, so wide
     tables scroll on phones.
   - Monospace text (Courier, Consolas, Mono, Menlo, Source Code) becomes `<code>` inline. Consecutive monospace
     paragraphs, and one-cell code tables, become `<pre class="wp-block-code"><code>…</code></pre>`.
   - Embedded (base64) images become `<img src="crawllex-image:N">` placeholders. Remote images are dropped.
     Limits: 30 images, 5 MB each. The raw export is capped at 30 MB, the converted text at 5 MB.
5. Images are uploaded (`BLOG_UPLOAD_IMAGES = true` in `publish-blog-draft.ts`). Each image is shrunk first
   (`lib/seo-activities/optimize-doc-image.ts`, `sharp`): max 1600 px wide, WebP quality 80, never enlarged. If
   `sharp` cannot decode an image, the original bytes are uploaded. Uploads run one at a time to
   `POST /wp/v2/media` (60 s timeout). A 502 or 504 from the WordPress host is retried twice (waits 2 s and 5 s).
   Filenames are `doc-<batch>-<n>.<ext>`, unique per push. The placeholders are then replaced with the WordPress URLs.
5a. Image alt text. The Doc export HTML has no alt text, so `fetchDocImageAlts` (`google-doc.ts`) calls the Docs API
   (`documents.get`, `fields=body,inlineObjects`) with `GOOGLE_DOCS_API_KEY`. Docs stores alt text (Image → Alt text)
   as the image's `description`, or `title`. Alt texts are matched to the exported `<img>` tags in document order.
   The match only applies when the counts are equal. Otherwise the export's own alt (usually empty) is kept. The
   call runs in parallel with the HTML download. Without the key, or on any API error, the push still works, with
   empty alt. The Doc must be public, and the key is restricted to the Google Docs API.
6. Crawllex saves the activity only after WordPress returns the draft. If the push or the save fails, the draft is
   trashed and the uploaded media is deleted (`force=true`), so a retry does not duplicate it. The table shows a
   "Pushed As Draft" badge.
7. Editing a pushed activity never pushes again. Only creation pushes.
8. The `seo-activities` POST route sets `maxDuration = 60` because uploads run before the draft is created.
9. Not sent yet: Rank Math title, meta description and focus keyword. The fields need REST registration on the
   WordPress site first (see `doc/migration.md`).

Elementor layout is not applied yet. The post body is WordPress HTML: core blocks classes, no Elementor.

## Oriel (Module 14) and the dashboard shortcut

The chat lives in the **Oriel** module: sidebar item `/oriel` in the **Agents & AI** group, page `sections/oriel-section.tsx`, components in `components/oriel/`.
The dashboard home (`sections/dashboard-home-section.tsx`) shows a shortcut panel (`components/dashboard/dashboard-oriel-shortcut.tsx`):
greeting, a question box, suggestion chips, and the five most recent chats. Every action there opens `/oriel`:
The shortcut passes a one-shot hand-off (question or conversation id) in `sessionStorage` (`lib/frontend/oriel/handoff.ts`, this tab only). The Oriel workspace reads it on mount and clears it. Nothing is stored server-side and no URL params are used.

`POST …/assistant/query` (needs `dashboard.view`) answers in two paths, both read-only:

1. **Crawllex Insight** (AI, `lib/assistant/ai/*`). When `ASSISTANT_AI_ENABLED=true` and the `LLM_*` variables
   are set, a local model (default `qwen3-8b` on logibox, `lib/assistant/ai/llm-client.ts`) answers through
   function calls to four read-only tools (`get_leads_count`, `get_analytics_overview`,
   `get_analytics_top_dimensions`, `get_seo_activity_counts`). Each tool runs the existing service with the
   caller's project and permission checks. Data is read in code (the model picks no tools). First questions get a code-built brief (no model call). Follow-ups get one model call with the last 4 exchanges, `max_tokens` 220, thinking off. Answers cached 5 min per user and question (first questions only). Model: Qwen3-4B Q4_K_M on logibox (only model there). Replies are grounding-checked before they show. Circuit breaker: 3 failures → AI off for 5 min per instance. The AI path runs when the rule parser does not recognize the question, or when the question asks for an explanation or advice.
2. **Crawllex Quick Lookup** (rule-based, `lib/assistant/nlp/*`, runs first). wink-nlp + custom lexicon,
   date/duration windows, typo correction. Answers recognized questions without the model. Also used when AI is off, fails, or times out.

Response carries `source: "ai" | "nlp"`. The Oriel UI badge shows the path (`components/oriel/oriel-answer.tsx`).
Conversations are stored per user and project (`AssistantQueryHistory`, `threadId`). Users delete one
conversation or all of them from the Oriel sidebar (`DELETE …/assistant/threads/[threadId]`, `DELETE …/assistant/threads`).
Spec, data rules and known gaps: `doc/assistant-ai.md`. Tests: `tests/assistant-*.test.ts`, `tests/oriel.test.ts`.

## Client Onboarding (Module 13, `client-onboarding` branch only, not in `dev`)

A separate **Onboarding workspace** (sidebar workspace toggle, `lib/frontend/layout/workspace.ts`:
`seo` | `onboarding`). Super admins create client intake briefs (multi-step form: company → blueprint
→ features → assets/files → launch), upload files to R2, and share a public read-only page at
`/onboarding/[shareToken]` (`app/(public)`, IP rate limited at 30/min). API routes are currently
`superAdmin: true`. The `clients.*` permission keys exist in the catalog for future delegation.

## Lens (SEO health and uptime, `feature/lens-dashboard`)

- UI: `/lens` in the **Agents & AI** sidebar group, next to Oriel (`sections/lens-section.tsx`, `components/lens/*`). Tabs: Overview, SEO health (All issues, On-page, Technical, Pages), Uptime monitoring, plus View history for scan history. Full layout and rules: `doc/lens.md`.
- Data: phase 1 uses demo data (`features/lens/lens.demo.ts`). Phase 3 replaces the hook with the proxy API (`features/lens/lens.api.ts`, `api/v1/projects/[id]/lens/*`, see `doc/api.md`).
- Engine and storage: separate service at `/mnt/projects/crawllex-lens` (Node, SQLite). Its rules and decisions: `docs/SEO-RULES.md`, `docs/DECISIONS.md`.
- Theme: Lens cards are no-fill glass with a soft shadow; colors from theme tokens only.

## Frontend Shell

- Providers (`components/providers/app-providers.tsx`): React Query, next-themes (light/dark), theme
  pack, font pack, i18n, auth session sync, user preferences sync, hydration marker.
- `context/selected-project-context.tsx`: the selected project id (localStorage
  `dashboard-selected-project-id`). Project modules stay gated until a project is selected.
- `context/project-access-context.tsx`: loads `GET /projects/{id}/access` for that project's permissions.
- Route gating: `components/auth/auth-guard.tsx` + `route-access-guard.tsx` using
  `lib/frontend/layout/route-access.ts`. Nav is built in `lib/frontend/layout/build-sidebar-nav.ts`. Groups in order: General, Reporting, Agents & AI (Oriel, Lens), Settings. Group ids in `lib/frontend/layout/sidebar-nav.ts`.
- Pattern per module: `app/(dashboard)/<module>/page.tsx` → `sections/<module>-section.tsx` →
  `components/<module>/*` + `hooks/use-<module>-table-columns.hook.tsx` + `features/<module>/<module>.api.ts`.
- A 401 mid-session dispatches `auth:session-expired`, which clears the query cache and logs out.
- Client errors are reported to `POST /api/v1/client-errors`.

## Theming

- **Theme packs:** `default`, `glass-aurora`, `lumen-slate`, `verdant-grove`. CSS variables in
  `styles/themes/<id>.css` (template: `_pack-template.css`), registry in `lib/frontend/theme/theme-packs.ts`,
  ids and aliases in `lib/theme/pack-ids.ts`. Each pack has light and dark variants.
- **Font packs:** next/font variables on `<html>`, selected by `data-font` (`lib/frontend/theme/font-packs.ts`).
- The choice is stored in localStorage and persisted to the user via `PATCH /me/preferences`.
- Typography uses utility classes (`type-body`, `type-caption`, `type-overline` for `StatusChip` only).
- i18n: `locales/en.ts`, `locales/ar.ts` (RTL).

## Mail

`lib/mail/client.ts` (nodemailer). HTML templates in `lib/mail/templates/*` (verification, reset,
invite, project created/approved/rejected/activated/deactivated/deleted, user activated/deactivated)
share a layout that loads `${APP_URL}/crawllex-dark.png`. With `MAIL_MAILER=log`, mail is printed instead of sent.

## Storage

Cloudflare R2 through `aws4fetch` (`lib/storage/r2-client.ts`). Images (≤5 MB, jpeg/png/webp/gif) go
through `blob-image-storage.ts` and are served via `GET /api/v1/storage/image`. Client intake files
have their own validation and quota (`lib/clients/client-file-storage.ts`, onboarding branch).
