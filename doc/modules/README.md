# Product Modules

Numbering follows `doc/source/SEO Dashboard - By Modules.md` (1–12), plus Module 13 added in code.
Status is as of `main` @ `54722ae` (2026-10-22), checked against the code on 2026-10-22.

Legend: ✅ built · 🟡 partial · ⬜ not built · ⛔ out of scope

| # | Module | Status | UI | Server |
|---|--------|--------|----|--------|
| 1 | Authentication | ✅ | `app/(auth)/*`, `components/auth/*`, `app/email/verify` | `lib/auth/*`, `api/v1/auth/*` — register, login, logout, verify email, forgot/reset, Google OAuth, inactive-user block |
| 2 | Project Setup / Onboarding | ✅ | `/projects/create` (stepper: business → details → SEO), `components/forms/project-create-*` | `lib/projects/create-project.ts`, `schemas/project.ts` |
| 3 | Project Management | ✅ | `/projects`, `/projects/view/[id]`, `/projects/edit/[id]`, card/table views, sidebar selector | `lib/projects/*` — list/get/update/delete, approve/reject/activate/deactivate, owner reassignment, lifecycle mails |
| 4 | Admin Roles & Permissions (+ Users) | ✅ | `/roles`, `/roles/new`, `/roles/[id]/edit`, `/users`, `/users/new`, `/users/edit/[id]` | `lib/roles/*`, `lib/users/*`, `api/v1/admin/*`, `api/v1/users/*` — permission matrix, activate/deactivate, delete inactive, admin memberships editor |
| 5 | Project Members | ✅ | project detail members card, invite quick-add, invitations banner | `lib/projects/invite-member.ts`, `respond-to-invitation.ts`, `api/v1/projects/[id]/invites`, `api/v1/me/project-invitations` |
| 6 | Project Access Control | ✅ | `route-access-guard`, `project-access-context`, sidebar gating | `lib/projects/get-project-access.ts`, `lib/rbac/*` (README still says 🟡; the code is complete) |
| 7 | Dashboard Overview | ✅ | `/dashboard` → `dashboard-home-section`: Key Results chips (Leads, Calls, WhatsApp, Email Clicks), SEO trend grid, assistant panel | `lib/assistant/*`: Crawllex Insight (OpenRouter, read-only tools, `lib/assistant/ai/*`) with Crawllex Quick Lookup (rule-based NLP fallback) over analytics, leads, activities |
| 8 | Performance Analytics | ✅ | `/analytics` — cards, trend, sources, top queries/pages, Top Events card (GA4 events), world map, Excel export | `lib/integrations/*` — GSC/GA4 via service account, cached sync, nightly cron |
| 9 | SEO Activities | ✅ | `/seo-activities` — tabs Blogs/Backlinks/Technical Work, date filter, summary cards, quick add, CSV/Excel export. Blogs can push a public Google Doc to the connected WordPress site as a draft ("Pushed As Draft" badge) | `lib/seo-activities/*`, `lib/integrations/wordpress/*` |
| 10 | Leads | ✅ | `/leads` — table, detail sheet, editor, CSV import wizard, export. WordPress plugin creates its own application password on Verify | `lib/leads/*`, `lib/integrations/wordpress/*`, WordPress plugin `crawllex-leads-capture/`, `api/v1/leads/ingest*` |
| 11 | Reports | 🟡 v1 on `dev` (merged `8ba3fe5`, 2026-11-04) | `/reports`, `/reports/[reportId]` (list, create sheet, PDF download, manual Send Report to recipients; adding recipients does not send) | `lib/reports/*`, `services/report-renderer/`, `api/v1/projects/[id]/reports/*`, `models/Report.ts`. See `doc/reports.md` |
| 12 | Settings | ✅ | `/settings` (theme packs, font packs, integrations panel), `/edit-profile` (profile, photo, password) | `api/v1/me/*`, `api/v1/projects/[id]/integrations/*` |
| 14 | Oriel (Agents & AI) | 🟡 chat, merged to `dev` 2026-11-09 | `/oriel` chat with recent conversations, delete one or all. Dashboard shortcut (`Hi <name>`, question box, suggestions, recent chats) opens it. Retrieval and model details in `doc/oriel/` | `components/oriel/*`, `components/dashboard/dashboard-oriel-shortcut.tsx`, `lib/assistant/*`, `lib/oriel/*`, `api/v1/projects/[id]/oriel/*`, `api/v1/projects/[id]/assistant/*` |
| 15 | Lens (Agents & AI) | 🟡 UI on `feature/lens-dashboard` (demo data). Overview, SEO Health (All Issues; On-Page and Technical as type filters), Pages (own tab, Page Details sheet), View History (scan history and issue log), Uptime Monitoring | `/lens`, sidebar group Agents & AI — see `doc/lens.md` | `sections/lens-section.tsx`, `components/lens/*`, `features/lens/*`, `lib/lens/*`, `api/v1/projects/[id]/lens/*`. Lens service: `/mnt/projects/crawllex-lens` |
| 13 | Client Onboarding | 🅿️ parked on `client-onboarding` branch | Onboarding workspace: `/clients`, `/clients/create`, `/clients/view/[id]`, `/clients/edit/[id]`; public `/onboarding/[shareToken]` | `lib/clients/*`, `models/Client.ts`, `api/v1/clients/*`, `api/v1/onboarding/[shareToken]` — super admin only |

## Spec vs Original Module Doc

The 2026-07 module doc (`SEO Dashboard - By Modules`) predates several decisions that the Product
Manual (2026-08) and the code changed:

- Module 2 "Website & Marketing Access" (hosting and GA/GSC/GBP credentials collected at onboarding)
  became **service-account integrations**. Clients never hand over Google logins.
- Module 9 "Website Changes" was renamed **Technical Work** (`technical_work`). It is logged manually, with no Sheets import.
- Module 11 Reports is back in scope (2026-11-02) as a manual monthly report. Merged to `dev` 2026-11-04. Email goes to recipients on create. Scheduled automation is still parked (`roadmap-automated-client-reporting.md`).
- Module 12 "Project Settings (owner only)" moved into project edit plus Settings → Integrations.
