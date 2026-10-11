# Product Modules

Numbering follows `doc/source/SEO Dashboard - By Modules.md` (1–12), plus Module 13 added in code.
Status is as of `dev` @ `08dbad0` (2026-08-31), checked against the code on 2026-10-11.

Legend: ✅ built · 🟡 partial · ⬜ not built · ⛔ out of scope

| # | Module | Status | UI | Server |
|---|--------|--------|----|--------|
| 1 | Authentication | ✅ | `app/(auth)/*`, `components/auth/*`, `app/email/verify` | `lib/auth/*`, `api/v1/auth/*` — register, login, logout, verify email, forgot/reset, Google OAuth, inactive-user block |
| 2 | Project Setup / Onboarding | ✅ | `/projects/create` (stepper: business → details → SEO), `components/forms/project-create-*` | `lib/projects/create-project.ts`, `schemas/project.ts` |
| 3 | Project Management | ✅ | `/projects`, `/projects/view/[id]`, `/projects/edit/[id]`, card/table views, sidebar selector | `lib/projects/*` — list/get/update/delete, approve/reject/activate/deactivate, owner reassignment, lifecycle mails |
| 4 | Admin Roles & Permissions (+ Users) | ✅ | `/roles`, `/roles/new`, `/roles/[id]/edit`, `/users`, `/users/new`, `/users/edit/[id]` | `lib/roles/*`, `lib/users/*`, `api/v1/admin/*`, `api/v1/users/*` — permission matrix, activate/deactivate, delete inactive, admin memberships editor |
| 5 | Project Members | ✅ | project detail members card, invite quick-add, invitations banner | `lib/projects/invite-member.ts`, `respond-to-invitation.ts`, `api/v1/projects/[id]/invites`, `api/v1/me/project-invitations` |
| 6 | Project Access Control | ✅ | `route-access-guard`, `project-access-context`, sidebar gating | `lib/projects/get-project-access.ts`, `lib/rbac/*` (README still says 🟡; the code is complete) |
| 7 | Dashboard Overview | ✅ | `/dashboard` → `dashboard-home-section`: SEO pulse, trend grid, assistant panel | `lib/assistant/*` (rule-based NLP Q&A over analytics, leads, activities) |
| 8 | Performance Analytics | ✅ | `/analytics` — cards, trend, sources, top queries/pages, world map, Excel export | `lib/integrations/*` — GSC/GA4 via service account, cached sync, nightly cron |
| 9 | SEO Activities | ✅ | `/seo-activities` — tabs Blogs/Backlinks/Technical Work, date filter, summary cards, quick add, CSV/Excel export | `lib/seo-activities/*` |
| 10 | Leads | ✅ | `/leads` — table, detail sheet, editor, CSV import wizard, export | `lib/leads/*`, WordPress plugin `crawllex-leads-capture/`, `api/v1/leads/ingest*` |
| 11 | Reports | ⛔ | — | Declared out of scope in `permission-catalog.ts`. See `doc/roadmap-automated-client-reporting.md` |
| 12 | Settings | ✅ | `/settings` (theme packs, font packs, integrations panel), `/edit-profile` (profile, photo, password) | `api/v1/me/*`, `api/v1/projects/[id]/integrations/*` |
| 13 | Client Onboarding | ✅ (dev only) | Onboarding workspace: `/clients`, `/clients/create`, `/clients/view/[id]`, `/clients/edit/[id]`; public `/onboarding/[shareToken]` | `lib/clients/*`, `models/Client.ts`, `api/v1/clients/*`, `api/v1/onboarding/[shareToken]` — super admin only |

## Spec vs Original Module Doc

The 2026-07 module doc (`SEO Dashboard - By Modules`) predates several decisions that the Product
Manual (2026-08) and the code changed:

- Module 2 "Website & Marketing Access" (hosting and GA/GSC/GBP credentials collected at onboarding)
  became **service-account integrations**. Clients never hand over Google logins.
- Module 9 "Website Changes" was renamed **Technical Work** (`technical_work`). It is logged manually, with no Sheets import.
- Module 11 Reports was dropped from scope.
- Module 12 "Project Settings (owner only)" moved into project edit plus Settings → Integrations.
