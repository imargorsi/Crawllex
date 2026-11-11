# API Reference (`/api/v1`)

Generated 2026-10-11 from `app/api/v1/**/route.ts` on `dev`; updated 2026-10-20 for the WordPress push (`wp-connection`, `wp-drafts`). "Guard" = what the handler checks beyond
`runApiGuards` (Bearer token + active user + verified email). Project perms are checked against the
caller's membership in `[id]` (see `doc/rbac.md`). Regenerate with the snippet at the bottom.

| Path | Methods | Guard |
|------|---------|-------|
| `/admin/permissions` | GET | super_admin |
| `/admin/roles/[id]/activate` | POST | admin.roles.update |
| `/admin/roles/[id]/deactivate` | POST | admin.roles.update |
| `/admin/roles/[id]` | GET,PATCH,DELETE | admin.roles.delete, admin.roles.update, admin.roles.view |
| `/admin/roles` | GET,POST | admin.roles.create, admin.roles.view |
| `/auth/email/verification-notification` | POST | — |
| `/auth/forgot-password` | POST | — |
| `/auth/google/callback` | GET | — |
| `/auth/google/exchange` | POST | — |
| `/auth/google/redirect` | GET | — |
| `/auth/login` | POST | — |
| `/auth/logout` | POST | — |
| `/auth/register` | POST | — |
| `/auth/reset-password` | POST | — |
| `/auth/user` | GET | — |
| `/client-errors` | POST | — |
| `/cron/analytics-sync` | GET,POST | CRON_SECRET |
| `/downloads` | function,function | — |
| `/leads/ingest` | POST | lead-source, key |
| `/leads/ingest/verify` | POST | lead-source, key |
| `/leads/plugin/update` | GET | lead-source, key |
| `/me/password` | PUT | — |
| `/me/preferences` | GET,PATCH | — |
| `/me/profile` | POST | — |
| `/me/project-invitations/[projectId]/accept` | POST | — |
| `/me/project-invitations/[projectId]/decline` | POST | — |
| `/me/project-invitations` | GET | — |
| `/ping` | GET | — |
| `/projects/[id]/access` | GET | — |
| `/projects/[id]/activate` | POST | super_admin |
| `/projects/[id]/analytics/dimensions` | GET | analytics.view |
| `/projects/[id]/analytics/overview` | GET | analytics.view, integrations.view |
| `/projects/[id]/approve` | POST | super_admin |
| `/projects/[id]/assistant/query` | POST | dashboard.view. Response has `source: "ai" \| "nlp"`; AI path only reads via server tools |
| `/projects/[id]/deactivate` | POST | super_admin |
| `/projects/[id]/integrations/google/properties` | GET | integrations.update |
| `/projects/[id]/integrations/google/[service]` | GET,PUT,DELETE | integrations.disconnect, integrations.update, integrations.view |
| `/projects/[id]/integrations/google/sync` | POST | integrations.refresh |
| `/projects/[id]/integrations/lead-sources` | GET,POST | integrations.update, integrations.view |
| `/projects/[id]/integrations/lead-sources/[sourceId]/key` | GET | integrations.update |
| `/projects/[id]/integrations/lead-sources/[sourceId]/wp-connection` | GET | integrations.view |
| `/projects/[id]/integrations/lead-sources/[sourceId]/wp-drafts` | POST | integrations.update |
| `/projects/[id]/integrations/lead-sources/[sourceId]/rotate` | POST | integrations.update |
| `/projects/[id]/integrations/lead-sources/[sourceId]` | DELETE | integrations.disconnect |
| `/projects/[id]/invites` | GET,POST | members.invite, members.view |
| `/projects/[id]/invites/[userId]` | DELETE | members.invite, members.remove |
| `/projects/[id]/leads/import/preview` | POST | leads.import |
| `/projects/[id]/leads/import` | POST | leads.import |
| `/projects/[id]/leads/[leadId]` | PATCH,DELETE | leads.delete, leads.update |
| `/projects/[id]/leads` | GET,POST | leads.create, leads.view |
| `/projects/[id]/reports` | GET,POST | reports.create (POST), reports.view (GET). See `doc/reports.md` |
| `/projects/[id]/reports/[reportId]` | GET,DELETE | reports.view (GET), reports.delete (DELETE) |
| `/projects/[id]/reports/[reportId]/pdf` | GET | reports.view. PDF from the renderer service (503 when not configured) |
| `/projects/[id]/reports/[reportId]/html` | GET | reports.view. Same document as the PDF, for the browser preview. Strict CSP |
| `/projects/[id]/reports/[reportId]/send` | POST | reports.create. Emails unsent recipients (PDF + dashboard link) |
| `/projects/[id]/assistant/query/stream` | POST | dashboard.view. Same answer as `/assistant/query`, as server-sent events: `token` (AI text as generated), `done` (final result), `error` |
| `/projects/[id]/assistant/threads` | GET,DELETE | dashboard.view. Own conversations only; DELETE removes all of them in the project |
| `/projects/[id]/assistant/threads/[threadId]` | GET,DELETE | dashboard.view. Own conversation only; 404 when not found or not yours |
| `/projects/[id]/reject` | POST | super_admin |
| `/projects/[id]` | GET,PATCH,DELETE | projects.delete, projects.update, projects.view |
| `/projects/[id]/seo-activities/[activityId]` | PATCH,DELETE | seo_activities.delete, seo_activities.update |
| `/projects/[id]/seo-activities` | GET,POST | seo_activities.create, seo_activities.view (+ integrations.update when `pushToWordpress`) |
| `/projects` | GET,POST | — |
| `/storage/image` | GET | — |
| `/users/[id]/activate` | POST | admin.users.update |
| `/users/[id]/deactivate` | POST | admin.users.update |
| `/users/[id]/memberships/[projectId]` | DELETE | admin.users.update |
| `/users/[id]/memberships` | PUT | admin.users.update |
| `/users/[id]` | GET,PATCH,DELETE | admin.users.delete, admin.users.update, admin.users.view |
| `/users/lookup` | GET | — |
| `/users` | GET,POST | admin.users.create, admin.users.view |

## Notes On Unlabelled Routes

- `auth/*`: public except `auth/user` and `auth/logout` (token) and `auth/email/verification-notification` (token, unverified allowed).
- `me/*`: any authenticated user. `me/profile` is a multipart POST.
- `projects` GET lists projects the caller is a member of (all of them for super admin). POST creates (gated by `can-create-project`).
- `projects/[id]/access`: the caller's roles and permissions for that project.
- `projects/[id]/analytics/overview`: checks `analytics.view` (and `integrations.view` for integration status) inline.
- `projects/[id]/invites/[userId]` DELETE: `members.invite` or `members.remove`.
- `projects/[id]/integrations/lead-sources/[sourceId]` DELETE: `integrations.disconnect`.
- `users/lookup`: invite search across verified users.
- `…/lead-sources/[sourceId]/wp-connection`: tests the stored WordPress application password (`GET users/me`).
- `…/lead-sources/[sourceId]/wp-drafts`: creates a WordPress draft (`{ title, content, excerpt? }`, always `status: draft`).
- `…/seo-activities` POST with `pushToWordpress: true`: blogs only; the body needs `docUrl` (public Google Doc) and no `url`. Embedded images are uploaded to the WordPress media library (shrunk to WebP, max 1600 px) with alt text from the Docs API when `GOOGLE_DOCS_API_KEY` is set; the route has `maxDuration = 60`. See `doc/architecture.md` → Blog Push.
- `downloads`, `ping`, `client-errors`, `storage/image`: public (rate limited where relevant).

## Client Onboarding Routes (`client-onboarding` branch only)

`/clients`, `/clients/[id]`, `/clients/[id]/activate|deactivate`, `/clients/[id]/files/[fileId]` (all super_admin),
and public `/onboarding/[shareToken]`.

## Lens Routes (`feature/lens-dashboard`)

Read-only proxies to the local Lens API, plus the manual check route. GET guard: `dashboard.view` on the project. POST guard: super admin. The Lens API must be reachable (`LENS_API` config); its URL and token never reach the browser.

| Route | Returns |
|---|---|
| `GET /api/v1/projects/[id]/lens/seo` | The whole SEO dashboard: `siteUrl`, `lastCheckAt`, `latestRunId`, `seo` (score, band, coverage, counts by severity), `issues` (one per rule, with catalog text, per-URL `pages`, lifecycle `tracking.events`), `pages` (per URL: meta title, state, counts, `ruleChecks` Pass / Finding / Not evaluated), `runs` (score and counts per run). Contract: `features/lens/lens.types.ts`. |
| `POST /api/v1/projects/[id]/lens/runs` | Queues a manual SEO check. Super admin only; project must be active. Returns `{jobId, status, created}`. Enrolls the project first if needed. |
| `GET /api/v1/projects/[id]/lens/uptime` | Uptime summary and daily values (rolling 30 days). Not used by the screen yet (uptime phase). |


## Regenerate

List every handler with: `grep -rnE "export (const|async function) (GET|POST|PUT|PATCH|DELETE|HEAD)" app/api/v1`.
Then check each route's guard by hand. The table above was built that way.
