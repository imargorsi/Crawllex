# Crawllex

**Crawllex** — full-stack **Next.js** SEO operations platform for projects, analytics, activities, leads, and reports.

## Quick start

```bash
cp .env.example .env.local   # set MONGODB_URI, APP_KEY
npm install
npm run seed                 # super admin + RBAC role seeds
npm run dev                  # http://localhost:3000
npm test
```

### Env switch (local machine)

| Command | Env file | Use |
|---------|----------|-----|
| `npm run dev` | `.env.local` | Normal local development |
| `npm run dev:prod` | `.env.production.local` | Local app against production DB |
| `npm run seed` | `.env.local` | Seed local DB |
| `npm run seed:prod` | `.env.production.local` | Seed production DB |

Details: `doc/setup.md`. Prefer `npm run dev` day-to-day — `dev:prod` talks to the real production database.

## Documentation

Docs live in **`doc/`** and root **`AGENTS.md`** (committed; `CLAUDE.md` imports `AGENTS.md`).

| Start | Path |
|-------|------|
| Agent hub | `AGENTS.md` |
| Setup + environments | `doc/setup.md` |
| Architecture (incl. theming, mail, storage) | `doc/architecture.md` |
| RBAC model | `doc/rbac.md` |
| API reference | `doc/api.md` |
| Product modules (1–13) | `doc/modules/README.md` |
| Status tracker + known issues | `doc/migration.md` |
| Product spec (from Drive) | `doc/source/` |

## Repo structure

- **`app/(auth)/`** — Sign in, register, password flows
- **`app/(dashboard)/`** — Authenticated app shell and modules
- **`app/api/v1/`** — REST API
- **`crawllex-leads-capture/`** — WordPress Lead Capture plugin source (`npm run plugin:pack` writes the public zip)

## Principles

1. **Product spec first** — `doc/modules/` and `doc/rbac.md` define behavior.
2. **Next.js-native** — App Router, route handlers, Mongoose, TanStack Query.
3. **Port complete** — the Laravel reference (`laravel-old/`) was removed 2026-08-18; business rules now live in `lib/` and `doc/`.
4. **Project-scoped RBAC** — permissions via `project_members` + role templates; `super_admin` on `User.roles` only.

## Status (summary)

Modules 1–10, 12 and 13 are built; Module 11 (Reports) is out of scope.
See `doc/migration.md` for health, known issues and open work.
