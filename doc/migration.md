# Status Tracker

Last checked 2026-10-11 on `dev` @ `08dbad0` (2026-08-31). There has been no activity since then.
The project went from a Laravel API to Next.js (`laravel-old/` was deleted 2026-08-18). The port
is complete. All modules except Reports are built (see `doc/modules/README.md`).

## Health (2026-10-11)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ clean |
| `npm test` | 🟡 1 failed / 1015 passed / 21 skipped (41 files). Failing: `tests/assistant-query-variants.test.ts` › `'invite a user'`. The parser returns `analytics_metric` where the test expects `unknown` |
| `npm run lint` | 🔴 48 problems (24 errors, 24 warnings). Errors are almost all React-compiler rules from `eslint-config-next` 16: `set-state-in-effect` (~19), "Cannot create components during render" (3), "Cannot access refs during render" (1) |
| Vercel crawllex-dev | Last deploy ~2026-08-31 (Production target) |

## Branches

- `dev`: active. 5 commits ahead of `main` (Client Onboarding). `main` has 3 merge commits not on `dev`.
- `main`: last 2026-08-27. Merge `dev` → `main` when Module 13 is signed off.
- Stale (already merged): `client-onboarding`, `rbac-v2`, `feature/gsc-ga4-analytics`, `seo-activities`,
  `user-roles-and-permission-modules`, `project-detail-page`, `project-module-and-ui-fixes`, `project-modules`.

## Known Issues / Debt

1. Assistant parser regression: "invite a user" is classified as an analytics metric (failing test above).
2. Lint errors from the React compiler rules. Most are `setState` inside `useEffect` for syncing props
   to state. Fix by deriving the state, using a `key` reset, or using event handlers.
3. The rate limiter is in-memory (`lib/auth/rate-limit.ts`). It is ineffective across serverless
   instances. Consider Mongo- or KV-backed limits for login, forgot-password, ingest and public onboarding.
4. ~~README stale~~ — fixed 2026-10-11 (doc links, module status, laravel-old refs).
5. `LEAD_SOURCE_MVP_MAX_PER_PROJECT = 1` and a unique index on `(projectId, provider)`. The Product
   Manual promises multiple lead sources per project (main site, landing pages, staging). Not built yet.
6. Client Onboarding API is `superAdmin: true` only, so the `clients.*` keys are unused (and rejected by `isKnownPermission`).
7. `.env.production.local` and the Vercel env differ in 13 values. Decide which deployment is
   "production" and keep them documented in `doc/setup.md`.
8. `components/migration/placeholder-page.tsx` is dead code (nothing imports it). Safe to delete.

## Open Product Work (from the spec)

- Reports (Module 11), parked: `doc/roadmap-automated-client-reporting.md`.
- Multiple WordPress lead sources per project (spec §7.10).
- Merge Module 13 to `main` and deploy.

## Docs History

The original docs lived only on the old Windows machine, which is lost. Everything in `doc/` except
`roadmap-*` and `source/` was rebuilt from the code on 2026-10-11 and is canonical from then on.
