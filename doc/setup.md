# Setup & Environments

## Three Environments

| Env | Where | Database | Env source |
|-----|-------|----------|------------|
| Local | `npm run dev` | Whatever `.env.local` points at | `.env.local` |
| Dev / staging | Vercel project `ar-gorsis-projects/crawllex-dev` → https://crawllex-dev.vercel.app | crawllex-dev Mongo | Vercel env (Preview = Production, identical) |
| Production | Hostinger (Node hosting, LiteSpeed in front) | Production Mongo | Hostinger env; local mirror `.env.production.local` |

`.env.example` notes that production and dev share the same secrets. Only `MONGODB_URI` and
`APP_URL`/`FRONTEND_URL` should differ. In practice (checked 2026-10-11), `.env.production.local`
differs from Vercel in 13 values (URLs, OAuth redirect, service account, SMTP, Mongo, R2 bucket,
super admin). Treat them as separate deployments.

## Local Env Files

| File | Use |
|------|-----|
| `.env.example` | Committed template |
| `.env.local` | Local dev. Currently built from Vercel crawllex-dev (Production) minus Vercel system vars, so **local writes hit the crawllex-dev database** |
| `.env.production.local` | Real production. Used by every `*:prod` script |
| `.env.vercel.{production,preview,development}` | Raw `vercel env pull` output (2026-10-11). Development is empty apart from `VERCEL_OIDC_TOKEN` |

The repo is linked to Vercel (`.vercel/`, gitignored). Re-pull with:

```bash
vercel env pull .env.vercel.production --environment=production --yes
```

## Required And Optional Vars (`lib/config/env.ts`)

| Var | Required | Notes |
|-----|----------|-------|
| `MONGODB_URI` | yes | Throws `Missing required environment variable` |
| `APP_KEY` | yes | Signs email-verification URLs **and** derives the key that encrypts lead-source keys (`lib/leads/lead-source-key.ts`). Rotating it breaks "reveal key" for existing WordPress sources |
| `APP_URL`, `FRONTEND_URL` | no (localhost:3000) | Used in mail links and the OAuth redirect default. Must be publicly reachable so the mail logo loads |
| `BCRYPT_ROUNDS` | no (12) | |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` | no | Read by `npm run seed` |
| `MAIL_MAILER` | no (`log`) | `log` = print payload, no SMTP. `smtp` needs `MAIL_HOST`, `MAIL_USERNAME` and `MAIL_PASSWORD` (Zoho) |
| `MAIL_PORT`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | no | |
| `PASSWORD_RESET_EXPIRE`, `PASSWORD_RESET_THROTTLE`, `EMAIL_VERIFICATION_EXPIRE` | no | Minutes, seconds, minutes |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL` | for uploads | Profile images, project/client logos, client intake files |
| `CRON_SECRET` | for cron | `/api/v1/cron/*` returns 503 without it |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, or `GOOGLE_SERVICE_ACCOUNT_JSON` | for analytics | Key accepts PEM with `\n`, a quoted value, or base64 PEM (Hostinger) |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI` | for Google sign-in | Redirect must match the Cloud Console client exactly. Default `${APP_URL}/api/v1/auth/google/callback` |

**Local gotcha:** the Vercel values point `APP_URL`, `FRONTEND_URL` and `GOOGLE_OAUTH_REDIRECT_URI`
at `https://crawllex-dev.vercel.app/`. Locally, mail links and Google sign-in land on the deployed
site. To test those locally, override them to `http://localhost:3000` (the redirect URI must also
be registered in Google Cloud).

## Scripts

`scripts/with-env.mjs <envfile> <cmd>` loads a specific env file and then runs the command.

| Script | Env | What |
|--------|-----|------|
| `dev` / `build` / `start` | `.env.local` (Next default) | |
| `dev:prod`, `start:prod` | `.env.production.local` | **Real prod data** |
| `seed` / `seed:prod` | local / prod | Ensures system roles; backfills user status and account source; creates or updates the super admin from `SUPER_ADMIN_*`; **demotes and locks any other `super_admin` account** |
| `migrate:*` / `migrate:prod:*` | local / prod | One-off migrations: project-statuses, user-statuses, user-account-sources, seo-activity-types, drop-seo-activity-index, unset-business-hours |
| `plugin:pack` / `plugin:pack:prod` | local / prod | Builds the WordPress plugin zip into `public/resources/`, with the dashboard URL baked in |
| `test`, `test:watch` | — | Vitest |
| `lint`, `format`, `format:check` | — | ESLint 9, Prettier + tailwind plugin |

⚠️ `npm run seed` against a shared database with a different `SUPER_ADMIN_EMAIL` demotes the
existing super admin. Check which env file it will load before running it.

## Deploy

- **Vercel (crawllex-dev):** Node 24.x, Next.js preset. Last deploy was ~2026-08-31 to the Production target, by `imargorsi` (Git link not confirmed). `vercel.json` sets a daily cron at
  `0 6 * * *` UTC → `GET /api/v1/cron/analytics-sync` (Vercel sends `Authorization: Bearer $CRON_SECRET`).
  The route sets `maxDuration = 300`.
- **Hostinger (prod):** Node app. `next.config.ts` sets cache headers so LiteSpeed doesn't
  long-cache HTML (`no-store` on documents and APIs, immutable on `/_next/static`). Downloads use
  `must-revalidate`, not `no-store`, because Chrome's download manager fails on `no-store`. Cron on
  Hostinger needs an external scheduler calling the same route with `x-cron-secret`.

## Testing

`npm test` runs 41 files (~1,037 tests, ~2.5 min) against `mongodb-memory-server`, with R2 mocked
(`tests/mocks/r2-storage.ts`). `npm ci` warns that install scripts are blocked. That is harmless:
the Mongo binary downloads on first test run.
