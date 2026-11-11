# Status Tracker

Reports v1 (Module 11) is merged into `dev` as `8ba3fe5` (2026-11-04). Sending is manual: **Send Report** emails PDF + dashboard link to recipients after review (Preview HTML removed 2026-11-10). Shared view model drives the in-app report and the PDF. The PDF needs the renderer, which runs on logibox (tailnet only). See `doc/reports.md`.

Last checked 2026-11-02: `main` at `680beb8` (blog push styling + gitignore `/doc/`); `dev` at `ac93927` (main + service tokens + dev plugin zip + gitignore). `dev` is 7 commits ahead of `main`, 0 behind. Both pushed to origin.
The project went from a Laravel API to Next.js (`laravel-old/` was deleted 2026-08-18). The port
is complete. All modules are built. Reports (Module 11) is v1 on `dev` (see `doc/modules/README.md`).

Branch check 2026-11-09: main repo `/mnt/projects/Crawllex` switched to `feature/client-reports` (`4e848d7`, tree identical to `dev`) to finish reports work. `dev` is checked out in the worktree `/mnt/projects/Crawllex-client-reports` (git allows one checkout per branch). Work on `dev` there.

## Health (2026-10-22, dev)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ clean. Note: stale `.next/dev/types` makes tsc stop before semantic checks. Delete `.next/dev` before trusting a clean result |
| `npm test` | ✅ 1076 passed, 50 files (2026-10-22, dev). |
| `npm run lint` | 🔴 48 problems (24 errors, 24 warnings). Errors are almost all React-compiler rules from `eslint-config-next` 16: `set-state-in-effect` (~19), "Cannot create components during render" (3), "Cannot access refs during render" (1) |
| Vercel crawllex-dev | Latest Production build Ready 2026-10-20 (after `48cdb13`; matched by time, commit SHA not read) |

Full suite 2026-11-09: 59 files, 1144 tests pass. Lint on report files: 0 errors (2 warnings in `components/reports/report-card.tsx`, pre-existing `<img>` data URIs).

## Branches

- `dev`: active. Client Onboarding split out 2026-10-11 (old tip tagged `backup/dev-before-split-2026-10-11`). Reports v1 merged 2026-11-04 (`8ba3fe5`). Checked out in worktree `/mnt/projects/Crawllex-client-reports`.
- `feature/client-reports`: merged into `dev`. Safe to delete after one dev deploy check.
- `feature/oriel-retrieval`: Oriel retrieval + chat UI (`73f125c`). Not in `dev`. Not checked out since 2026-11-09 (main repo moved to `feature/client-reports`).
- `client-onboarding`: Module 13 only, parked. Rebase onto `dev` before resuming.
- `main`: 2026-10-22, `54722ae` (AI assistant + GA4 events). Deploy to Hostinger not confirmed.
- Stale (already merged): `client-onboarding`, `rbac-v2`, `feature/gsc-ga4-analytics`, `seo-activities`,
  `user-roles-and-permission-modules`, `project-detail-page`, `project-module-and-ui-fixes`, `project-modules`.

## Known Issues / Debt

1. ~~Assistant parser regression: "invite a user"~~ fixed 2026-10-20: write-action words route to unknown (`parse-query.ts`).
2. Lint errors from the React compiler rules. Most are `setState` inside `useEffect` for syncing props
   to state. Fix by deriving the state, using a `key` reset, or using event handlers.
3. The rate limiter is in-memory (`lib/auth/rate-limit.ts`). It is ineffective across serverless
   instances. Consider Mongo- or KV-backed limits for login, forgot-password, ingest and public onboarding.
4. ~~README stale~~ — fixed 2026-10-11 (doc links, module status, laravel-old refs).
5. `LEAD_SOURCE_MVP_MAX_PER_PROJECT = 1` and a unique index on `(projectId, provider)`. The Product
   Manual promises multiple lead sources per project (main site, landing pages, staging). Not built yet.
6. (Onboarding branch) Client Onboarding API is `superAdmin: true` only, so the `clients.*` keys are unused (and rejected by `isKnownPermission`).
7. `.env.production.local` and the Vercel env differ in 13 values. Decide which deployment is
   "production" and keep them documented in `doc/setup.md`.
8. `components/migration/placeholder-page.tsx` is dead code (nothing imports it). Safe to delete.
9. WordPress blog push (2026-10-20): the plugin does not delete its application password on disconnect, and
   rotating the lead key does not revoke it. Delete both in WordPress by hand until a disconnect step exists.
10. WordPress blog push: if WordPress times out after creating the draft or an upload, Crawllex cannot know it and a
    retry duplicates the post or the media. Failed pushes clean up what Crawllex knows about, not timeouts. Check
    drafts and the media library in WordPress after errors.
11. WordPress blog push: no Elementor layout yet. Posts are WordPress HTML with core block classes. Images upload
    to the media library (WebP, max 1600 px). A host gateway 504 can still fail an upload; the retry covers one slow
    response, not a host that is down.
11a. Media left by pushes before 2026-10-26 (`doc-image-*` files, some with `-N` suffixes) may still be in the
     WordPress media library. Review and delete by hand.
11b. Rank Math title, meta description and focus keyword are not sent. A test push showed WordPress does not store
     them over REST. Register `rank_math_title`, `rank_math_description`, `rank_math_focus_keyword` for REST in the
     Crawllex plugin, release it, then add the meta to the draft body (`publish-blog-draft.ts`).
12. WordPress blog push: the Arabic strings for the push labels are a first draft. Have a native speaker review them.
13. Plugin zip per branch. Fixed 2026-11-02 (`d5fbf38` on `dev`): `dev` zip is stamped `https://crawllex-dev.vercel.app`, `main` zip is stamped `https://crawllex.com`. Never swap them. See `doc/setup.md` Release Checklist.

## Blog Push Styling and Alt Text (2026-11-01)

On `main` as `c253733` (feature) and `002cfd5` (fix: image placeholders inside styled paragraphs). Merged into `dev` as `b4dd797`. Live on Hostinger after the owner pulls and rebuilds `main`.

- Doc paragraph alignment (justify, center, right) is kept. Previously all alignment was lost.
- Table cell backgrounds, borders, vertical alignment and span text colors are kept. Default black text and white background are dropped.
- Image alt text comes from the Docs API (`GOOGLE_DOCS_API_KEY`). Restricted key in Cloud project `rclone-gdrive`. Set on Hostinger, Vercel `crawllex-dev` (all three environments) and locally.
- Tests: `tests/google-doc-styles.test.ts`. Full suite 52 files, 1097 tests passing at the time.

Open items:
- Not verified live: a real public Doc read with the API key, and a WordPress draft showing the alignment, colors and alt text. Check one push after deploy.
- Check the WordPress application-password user has `unfiltered_html`, or WordPress strips the `style` attributes.
- The "fine visuals preview" item from the team has no definition yet. Nothing in Crawllex matches it. Needs a description from the team.
- Docs and hub live in `/mnt/projects/Crawllex/` (`AGENTS.md`, `CLAUDE.md` at root, gitignored and local only; `doc/` gitignored). Old docs repo folder `crawllex/` removed 2026-11-02.

Branch check 2026-11-02: the blog push code is byte-identical on `main` (`002cfd5`) and `dev` (`d5fbf38`). The dev copies `868eb19` / `0b14ea3` are replays of `c253733` / `002cfd5` on a different parent, so their patch IDs differ. Nothing to port. Main is the tested source for blog push; do not change its blog code from dev.

## Assistant AI (2026-10-20)

Crawllex Insight (AI) runs on OpenRouter (`dots-studio/dots-3-note-preview:free`) since 2026-10-20, live on `crawllex-dev`. Gemini removed (free quota exhausted, latency over 25 s). Behind `ASSISTANT_AI_ENABLED`. Spec and open gaps: `doc/assistant-ai.md`.

On `main` since 2026-10-22 (`d11c56c`). Superseded 2026-11-09: OpenRouter removed. Production AI needs `ASSISTANT_AI_ENABLED=true` and the `LLM_*` vars, and the logibox gateway must be reachable from the host (not yet). Open items: free-model reliability, prompt-injection defence beyond prompt, no eval set, no integration test for AI→NLP switch, no per-project quota, and a data-policy decision for free models.

## Service Tokens (2026-10-19)

Non-expiring integration tokens for Crawllex Lens, staging only. Details and revoke steps: `doc/service-tokens.md`.
Committed on `dev` (`10657d8`). `tests/service-tokens.test.ts` is still untracked in `/mnt/projects/Crawllex`.

## Client Reports (Module 11, merged to `dev` 2026-11-04 as `8ba3fe5`)

- Permission rule (owner decision as built): only super admins and roles granted `reports.create` in `/roles` can create reports. Project owners can view and delete. Project users can view only.
- `migrate:owner-report-create` (local) cleans dev DB only. Prod owner role never had `reports.create`. See `doc/reports.md` Permissions. Do not run the prod script blind.

- Built: data collection, snapshot storage, rule-based report text, HTML report (5 tab sections), PDF via `services/report-renderer`, UI (`/reports`), RBAC keys `reports.view|create|delete`, email on create (PDF attached, dashboard link, per-recipient delivery status), tests (7 files, 42 tests).
- Open:
  1. Renderer runs on logibox, public at `https://render.logicalcreations.cloud` via Cloudflare tunnel `logibox` (2026-11-09). Vercel and Hostinger can reach it with the bearer token. Set `REPORT_RENDERER_URL` / `REPORT_RENDERER_TOKEN` in each app env that needs PDFs and email. Target for shared envs still undecided. Leocore is not the host.
  1a. `services/report-renderer/` is tracked on `dev`. Its `node_modules` in the main repo is untracked, so `git status` shows `?? services/`. Harmless.
  1b. PDF is a summary by design (2026-11-09): tables and modal detail live in the dashboard; each section links there. Artwork fixed (transparent PNG). Preview HTML and manual Send Report added. Creating a report no longer emails anyone.
  1c. PDF visual check done on dev DB report and on Wafaiyah September 2026 (production data, read-only preview). Still to check: Arabic output.
  1d. Renderer change (`window.reportReady` wait in `services/report-renderer/server.mjs`) is in the code but NOT deployed to logibox. Deploy before any PDF goes through it.
  2. Confirm brand email and phone (`REPORT_BRAND`). Values copied from the sample PDF.
  3. Arabic UI strings in `locales/ar.ts` need a native speaker review.
  4. Top-N rankings are approximate by design (daily top 100 summed).
  5. Missing dimensions to add later: session source/medium, first-user source, page titles.
  6. Custom project roles need `reports.*` added in `/roles`. System roles are backfilled.
  7. No cron, no scheduled sending. Email goes out on create only. Monthly automation is a later decision.
  8. Dev DB test project (AR GORSI) has no integration docs, leads or activities. Use a real connected project to check end to end.

## Open Product Work (from the spec)

- GA4 events (Top Events card, event-based dashboard chips): on `main` (`54722ae`). Existing projects get a one-time 90-day event backfill on the next sync (`eventsBackfilledAt`). Until then event history is partial; check Wafaiyah after the nightly run.
- Reports (Module 11), parked: `doc/roadmap-automated-client-reporting.md`.
- WooCommerce store KPIs (after plugin connect), parked: `doc/roadmap-woocommerce-store-kpis.md`.
- Multiple WordPress lead sources per project (spec §7.10).
- WordPress blog push: Elementor layout, pushed-post edits, and an option to publish (today drafts only, by rule).
- Client reports: monthly schedule, missing GA4 dimensions, Arabic report output, PDF layout parity (see `doc/reports.md`).
- Resume Module 13 on the `client-onboarding` branch, rebase it onto `dev`, then merge.

## Docs History

The original docs lived only on the old Windows machine, which is lost. Everything in `doc/` except
`roadmap-*` and `source/` was rebuilt from the code on 2026-10-11 and is canonical from then on.

## Vercel env TODO (kept on purpose)

- DONE 2026-11-09: `REPORT_RENDERER_URL=https://render.logicalcreations.cloud` and `REPORT_RENDERER_TOKEN` (matches logibox) set on Vercel Production and Preview and in `.env.local` and `.env.production.local`. Redeployed Production (`dpl_9ZdneufJM1bjgXEGoDgBLNuxFRkx`). PDF checked: renderer public path 200 with token, 401 without. Hostinger production env still to set by hand.
- Vercel cleaned 2026-11-09: `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `ASSISTANT_AI_ENABLED` removed from Production. AI stays off on Vercel (no `LLM_*` there).
