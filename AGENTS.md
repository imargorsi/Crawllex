# Crawllex — Agent Hub

> **Canonical docs.** The project is managed only from this Linux workstation
> (`/mnt/projects/Crawllex`) since 2026-10-11. The old Windows machine and its local docs are gone
> for good. These docs were rebuilt from the code on `dev` and are now the source of truth.
> Keep them updated whenever behavior changes. Where docs and code disagree, fix the docs.

## What It Is

Multi-client SEO operations platform for agencies. One **project** = one client website
workspace. The team logs SEO work, reads cached GSC/GA4 analytics, and tracks leads per
project, with project-scoped RBAC. Module 13 (Client Onboarding: intake briefs shared publicly by
token) is parked on the `client-onboarding` branch and is **not** in `dev`.

Product spec: `doc/source/Crawllex — Product Manual.md` (canonical) and
`doc/source/SEO Dashboard - By Modules.md` (original module breakdown, 1–12).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · MongoDB via Mongoose 9 ·
TanStack Query 5 · Zod 4 · react-hook-form · Tailwind 4 + shadcn · Recharts + d3-geo ·
i18next (en, ar) · googleapis (GSC/GA4 via service account) · Cloudflare R2 via aws4fetch ·
nodemailer (Zoho SMTP) · wink-nlp (dashboard assistant, rule-based, no LLM) · Vitest +
mongodb-memory-server.

## Run It

```bash
npm install
npm run dev        # .env.local  → http://localhost:3000
npm test           # vitest, in-memory Mongo
npx tsc --noEmit
npm run lint
```

Env files, environments, seeding and migrations: `doc/setup.md`.

## Docs Index

| Doc | What |
|-----|------|
| `doc/setup.md` | Env files, the three environments, scripts, seed, migrations, deploy |
| `doc/architecture.md` | Layers, request flow, auth, data model, analytics sync, lead ingest, assistant, onboarding, frontend shell, theming |
| `doc/rbac.md` | Platform vs project authority, permission catalog, status gating, route rules |
| `doc/api.md` | Every `/api/v1` route with its guard |
| `doc/modules/README.md` | Modules 1–13: what exists, where it lives |
| `doc/migration.md` | Status tracker, known issues, open work |
| `doc/roadmap-automated-client-reporting.md` | Parked idea: automated branded reports |
| `doc/source/` | Drive originals (.docx/.xlsx) + markdown conversions |

## Where Code Lives

| Path | Role |
|------|------|
| `app/api/v1/**/route.ts` | REST handlers. Thin: guard → parse (Zod) → call `lib/` → `ApiResponse` |
| `lib/<domain>/` | Server business logic (projects, leads, integrations, users, roles, assistant, auth, rbac, mail, storage) |
| `lib/frontend/` | Client-only helpers (API client, session, layout/nav, table/query utils, theme, export) |
| `models/` | Mongoose models (re-exported from `models/index.ts`) |
| `schemas/` | Zod request/query schemas shared by API and forms |
| `types/` | DTO types (`T*Dto`) |
| `features/<domain>/*.api.ts` | TanStack Query hooks wrapping `/api/v1` |
| `app/(auth)`, `app/(dashboard)`, `app/(public)` | Route groups: auth screens, authed shell, public onboarding page |
| `sections/` | Page-level composites mounted by `app/**/page.tsx` |
| `components/` | UI by domain; `components/ui/` = shadcn primitives |
| `context/` | Selected project, project access, sidebar, breadcrumbs |
| `styles/themes/*.css` | Theme pack tokens |
| `locales/{en,ar}.ts` | i18n strings |
| `crawllex-leads-capture/` | WordPress plugin (PHP). `npm run plugin:pack` → `public/resources/crawllex-lead-capture.zip` |
| `scripts/` | Seed, one-off migrations, plugin packer, `with-env.mjs` |
| `tests/` | Vitest suites (API-level, in-memory Mongo; R2 mocked) |

## Rules (Must Follow)

1. **Product spec first.** Behavior comes from the Product Manual and `doc/rbac.md`.
2. **Project isolation.** Every project-scoped query filters by `projectId`, and every
   project route checks `requireProjectPermission` / `getProjectAccessForUser`.
3. **`super_admin` lives only on `User.roles`.** Never in the `roles` collection or admin UI.
   Project roles live in `Role` docs and attach through `ProjectMember.roleId`.
4. **Keep Client Onboarding off `dev`.** It lives on the `client-onboarding` branch. When it returns, `clients` stays
   platform-scoped and never goes into `PROJECT_MODULE_SLUGS`.
5. **SEO activities are manual.** No Google Sheets import.
6. **Analytics pages read the cache only.** Google is called by sync (connect, manual refresh,
   nightly cron), never on page view.
7. **API envelope.** Success `{ success, message, data }`; error `{ success:false, message, errors }`;
   validation is 422. Wrap handlers in `withApiHandler`.
8. **Icons: Hugeicons free Stroke Rounded only**, through `Icons` in
   `lib/frontend/icons/app-icons.ts`. No Lucide, react-icons or Heroicons. Brand SVGs only for
   Google auth and GSC/GA4 logos. (`.cursor/rules/icons.mdc`)
9. **Copy case.** Title Case for labels, buttons, headings, tabs, field labels. Sentence case for
   descriptions, empty-state bodies, toasts and API `message` strings. Toasts go through
   `notify.*()` (`lib/frontend/feedback/notify.ts`). No CSS `uppercase` on labels.
   (`.cursor/rules/title-case.mdc`)
10. **Theme tokens, not hex.** Colors come from `styles/themes/*.css` variables. The only allowed
    hex is the preview swatches in `lib/frontend/theme/theme-packs.ts`.
11. **No `laravel-old/`.** It was deleted 2026-08-18.
12. **Secrets.** `.env*` is gitignored except `.env.example`. Never commit keys
    (`scripts/_hostinger-sa-key.b64.txt` is ignored for that reason).

## Branches

| Branch | Purpose |
|--------|---------|
| `dev` | Active work. Module 13 removed 2026-10-11 (history rewritten; old tip tagged `backup/dev-before-split-2026-10-11`) |
| `client-onboarding` | Module 13 only: `b686bfb`, `36b46e1` + cherry-picked "fixed onboarding". Based on `7cda477`, so rebase onto `dev` when you return to it |
| `main` | Last release merge (2026-08-27). Merge `dev` → `main` to release |

Other remote branches are older feature branches from July and early August, already merged.
