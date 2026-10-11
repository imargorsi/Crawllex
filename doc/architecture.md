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
  The TTL is 24h, and expired or legacy (null-expiry) tokens are deleted on lookup. There are no cookies.
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
| `AnalyticsDimensionRow` | projectId, date, source, dimensionType (query/page/country/device/landing_page/channel_group), value, metrics | Top 100 per type per day |
| `SeoActivity` | projectId, activityType (`blogs`/`backlinks`/`technical_work`), url, occurredOn, title/anchorText/details | |
| `Lead` | projectId, names, email, phone, message, leadDate, extras (Mixed), normalizedEmail+normalizedPhone (unique per project), origin `csv_import`/`manual`/`wordpress`, leadSourceId, idempotencyKey | Dedupe on email+phone |
| `LeadSource` | projectId+provider (unique, so **1 per project** in the MVP), keyHash (unique), keyPrefix `clx_ls_`, keyCiphertext, siteUrl, counters, lastError | Key is hashed for lookup and encrypted for reveal |
| `Client` | Module 13 intake brief: business, contact, project types, features[], integrations, links[], files[] (R2), launch info, shareToken (unique, `clx_ob_` prefix), status | Platform scoped |
| `AssistantQueryHistory` | projectId, userId, query, intent | |
| `AccessToken`, `PasswordResetToken`, `OAuthLoginCode` | | Auth plumbing |

Dates for analytics, activities and leads are stored as `YYYY-MM-DD` strings (UTC).

## Analytics Pipeline (Module 8)

1. A member with `integrations.update` lists the properties the service account can see
   (`GET …/integrations/google/properties`) and connects a GSC site or GA4 property (`PUT …/google/[service]`).
   The client adds the service-account email as a user on their GSC/GA4 property. Clients never share logins.
2. Sync (`lib/integrations/sync-analytics.ts`) pulls daily totals plus top-N dimensions into the cache:
   - First sync: a 90-day backfill. After that: from `lastSyncedAt` − 3 days (GSC revisions) up to yesterday (UTC).
   - Triggers: on connect (`after()`), manual refresh (`integrations.refresh`, 1h cooldown per project),
     and the nightly cron `syncAllConnectedProjects` (500 ms between projects).
   - Race guards: writes abort if the integration was disconnected or swapped mid-sync. A disconnect purges that service's cache.
   - Google calls go through `withGoogleBackoff`.
3. Reads (`lib/integrations/read-analytics.ts`): `overview` and `dimensions` endpoints, max 366-day range.
   Both read the cache only.
4. UI: `sections/analytics-section.tsx` has summary cards, trend chart, traffic sources, top
   queries/pages, world choropleth (d3-geo + topojson in `public/maps`), and an Excel (SpreadsheetML) export.

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

## Dashboard Assistant (Module 7)

`POST …/assistant/query` (needs `dashboard.view`). It is a deterministic NLP parser (`lib/assistant/nlp/*`,
wink-nlp + a custom lexicon, date/duration windows, typo correction), not an LLM. It parses intents
(analytics metric, leads, SEO activities…), then checks the per-intent permission (`analytics.view`,
`leads.view`, `seo_activities.view`), answers from the DB, and logs to `AssistantQueryHistory`.
Large test corpus: `tests/assistant-*.test.ts`.

## Client Onboarding (Module 13, `dev` branch)

A separate **Onboarding workspace** (sidebar workspace toggle, `lib/frontend/layout/workspace.ts`:
`seo` | `onboarding`). Super admins create client intake briefs (multi-step form: company → blueprint
→ features → assets/files → launch), upload files to R2, and share a public read-only page at
`/onboarding/[shareToken]` (`app/(public)`, IP rate limited at 30/min). API routes are currently
`superAdmin: true`. The `clients.*` permission keys exist in the catalog for future delegation.

## Frontend Shell

- Providers (`components/providers/app-providers.tsx`): React Query, next-themes (light/dark), theme
  pack, font pack, i18n, auth session sync, user preferences sync, hydration marker.
- `context/selected-project-context.tsx`: the selected project id (localStorage
  `dashboard-selected-project-id`). Project modules stay gated until a project is selected.
- `context/project-access-context.tsx`: loads `GET /projects/{id}/access` for that project's permissions.
- Route gating: `components/auth/auth-guard.tsx` + `route-access-guard.tsx` using
  `lib/frontend/layout/route-access.ts`. Nav is built in `lib/frontend/layout/build-sidebar-nav.ts`.
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
have their own validation and quota (`lib/clients/client-file-storage.ts`).
