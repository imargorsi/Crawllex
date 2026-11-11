# Service tokens (Crawllex Lens)

Non-expiring API tokens for an integration account. Added 2026-10-19 for the Crawllex Lens agent.
Staging only for now. Production (crawllex.com, Hostinger) does not enable them.

## Why

Normal access tokens expire after 24h (`ACCESS_TOKEN_TTL_MS`). Lens runs unattended, so it needs a
token that does not expire. A service token is still tied to a real user with project RBAC, and can
be revoked at any time.

## How it works

- `AccessToken.serviceToken = true` and `expiresAt = null` mark a service token.
- Issued only by `createServiceAccessToken()` in `lib/auth/tokens.ts`. Throws unless
  `CRAWLEX_SERVICE_TOKENS_ENABLED=true`.
- `findAccessToken()` accepts a service token only while the flag is `true`. With the flag off the
  token is rejected but **not deleted**, so turning the flag back on restores it.
- Normal tokens are unchanged: they still expire after 24h, and legacy null-expiry tokens are still
  deleted on lookup.
- Token format is the same as normal tokens: `Authorization: Bearer <tokenId>|<40 random chars>`.
  Only the SHA-256 hash is stored.

## Current setup (staging)

| Item | Value |
|---|---|
| Environment | `crawllex-dev` Vercel project, Production target (crawllex-dev.vercel.app). Not Preview |
| Flag | `CRAWLEX_SERVICE_TOKENS_ENABLED=true` (Vercel Production, `.env.local`) |
| Service user | `crawllex-lens@logicalcreations.net` (no password, email verified, `accountSource: admin`) |
| Project access | AR GORSI, id `6a901ebe9b0f0864d8c1e763`, role `project_user` (`analytics.view`, `leads.view`, `leads.export`) |
| Token | Issued 2026-10-19, token id `6ad61112d38e0c470618a847`. Plaintext lives only in `~/.config/crawllex/lens-service-token` (0600) and in Lens's server env |
| Verified | 200 on `/projects`, `/projects/<id>`, `analytics/overview`, `leads`. 401 without a token and 401 on crawllex.com |

Never write the token value into docs, chat, commits or the vault.

## Issue a token

Requires `.env.local` (dev DB) and the flag. The script refuses unless `APP_URL` is the staging host.

```bash
npm run service-token:issue -- --email <user@example.com> --project <projectId> --name <label> --out <file>
```

- Creates the user if missing and adds an active `project_user` membership on that project.
- Writes the token to `<file>` with mode 0600. Nothing is printed.

## Revoke

```bash
npm run service-token:revoke -- --id <accessTokenId>
```

Deletes only records with `serviceToken: true`. Also remove the project membership if the integration
no longer needs access.

## Enabling on another environment

Do not set the flag on production without a decision recorded here. Production runs on Hostinger from
`.env.production.local`, which must not contain `CRAWLEX_SERVICE_TOKENS_ENABLED`.

## Lens side (for reference)

Lens reads `CRAWLEX_BASE_URL`, `CRAWLEX_API_TOKEN` and `CRAWLEX_ALLOWED_PROJECT_IDS` from its server env,
then needs an administrator PUT of the connection in `live` mode and a sync. Lens docs:
`CRAWLEX-CONNECTORS.md` in the `crawlex-lens-agent` branch of `waqas.logicalcreations/crawllex-agents`.

## Testing environment (2026-10-28)

- Testing and local both use Atlas Cluster0 (`ac-fc3b7wm`), database `seo-dashboard`. This is the cluster behind Vercel `crawllex-dev` (Production target, alias `crawllex-dev.vercel.app`). Production is Hostinger on a separate cluster and is never used locally.
- Project AR GORSI (`6a901ebe9b0f0864d8c1e763`) was deleted from this database on 2026-10-28 and recreated with the same `_id`. Its analytics history was reattached. Members, integrations and leads were not restored.
- The Lens service token `6ad61112…` (issued 2026-10-19) is not in this database. It returns 401 on `crawllex-dev` and locally until re-issued here.
- Local Crawllex: `/mnt/projects/Crawllex` on `dev`, `.env.development.local` points at this cluster.
