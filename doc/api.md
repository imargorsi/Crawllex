# API Reference (`/api/v1`)

Generated 2026-10-11 from `app/api/v1/**/route.ts` on `dev`. "Guard" = what the handler checks beyond
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
| `/clients/[id]/activate` | POST | super_admin |
| `/clients/[id]/deactivate` | POST | super_admin |
| `/clients/[id]/files/[fileId]` | GET | super_admin |
| `/clients/[id]` | GET,PATCH,DELETE | super_admin |
| `/clients` | GET,POST | super_admin |
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
| `/onboarding/[shareToken]` | GET | — |
| `/ping` | GET | — |
| `/projects/[id]/access` | GET | — |
| `/projects/[id]/activate` | POST | super_admin |
| `/projects/[id]/analytics/dimensions` | GET | analytics.view |
| `/projects/[id]/analytics/overview` | GET | analytics.view, integrations.view |
| `/projects/[id]/approve` | POST | super_admin |
| `/projects/[id]/assistant/history` | GET | dashboard.view |
| `/projects/[id]/assistant/query` | POST | dashboard.view |
| `/projects/[id]/deactivate` | POST | super_admin |
| `/projects/[id]/integrations/google/properties` | GET | integrations.update |
| `/projects/[id]/integrations/google/[service]` | GET,PUT,DELETE | integrations.disconnect, integrations.update, integrations.view |
| `/projects/[id]/integrations/google/sync` | POST | integrations.refresh |
| `/projects/[id]/integrations/lead-sources` | GET,POST | integrations.update, integrations.view |
| `/projects/[id]/integrations/lead-sources/[sourceId]/key` | GET | integrations.update |
| `/projects/[id]/integrations/lead-sources/[sourceId]/rotate` | POST | integrations.update |
| `/projects/[id]/integrations/lead-sources/[sourceId]` | DELETE | integrations.disconnect |
| `/projects/[id]/invites` | GET,POST | members.invite, members.view |
| `/projects/[id]/invites/[userId]` | DELETE | members.invite, members.remove |
| `/projects/[id]/leads/import/preview` | POST | leads.import |
| `/projects/[id]/leads/import` | POST | leads.import |
| `/projects/[id]/leads/[leadId]` | PATCH,DELETE | leads.delete, leads.update |
| `/projects/[id]/leads` | GET,POST | leads.create, leads.view |
| `/projects/[id]/reject` | POST | super_admin |
| `/projects/[id]` | GET,PATCH,DELETE | projects.delete, projects.update, projects.view |
| `/projects/[id]/seo-activities/[activityId]` | PATCH,DELETE | seo_activities.delete, seo_activities.update |
| `/projects/[id]/seo-activities` | GET,POST | seo_activities.create, seo_activities.view |
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
- `onboarding/[shareToken]`, `downloads`, `ping`, `client-errors`, `storage/image`: public (rate limited where relevant).

## Regenerate

List every handler with: `grep -rnE "export (const|async function) (GET|POST|PUT|PATCH|DELETE|HEAD)" app/api/v1`.
Then check each route's guard by hand. The table above was built that way.
