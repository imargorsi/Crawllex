# Handoff: Crawllex full product plan (v2)

Read this first.

**Current (2026-10-29, 20:04):** local files in sync: `doc/source/product-plan-v2.md` (source, includes 10.5 Audit logging), `.docx`, `.odt`, `product-plan-v2-part3.md`. ClickUp published copy (doc.clickup.com/90182635700/d/h/2kzmvm5m-6978/c22c81154ca302c) was last updated 20:01 and lacks 10.5. Re-import the `.docx` to sync it. Rebuild with `doc/source/build-product-plan.sh`. Tickets go in `doc/source/tickets/`.

**SaaS pass (2026-10-29, 19:11):** added 2.4 market and positioning, 2.5 success metrics, 2.6 trial and onboarding, 10.6 billing and account model, 10.7 support and ops, 10.8 compliance outline. Verified OpenAI, Webflow and Shopify details against official docs. Remaining owner items: prices, payment provider confirmation, MongoDB region and R2 jurisdiction, support staffing, lawyer review, formal trademark search.

**Final (2026-10-29, 19:06):** v2 doc is final. Only prices (D12) are left for the owner. Launch checklist is in section 13.2. Appendix A is the v3 plan. Build: `build-product-plan.sh`.

**Previous (2026-10-29, v2 rebuild):** Doc now covers Crawllex v2 only. Sections 1 to 14 plus Appendix A (agents and credits, v3 parked). Decisions D8 to D40 in section 12. Open items are listed there. Tier names: Sprouta, Crestora, Peakra, Ranovia (proposed). Assistant name Oriel (proposed). Notifications in-house outbox (recommended). Mobile app: React Native with Expo, read only (recommended). Rebuild with `build-product-plan.sh`. Names still need formal trademark checks.

**Earlier state (kept for history):** The full plan (sections 1 to 15) was written locally. Use the local copy, not the Claude Docs artifact, for further edits:

- Markdown source: `/mnt/projects/Crawllex/doc/source/product-plan-v2.md`
- Word: `/mnt/projects/Crawllex/doc/source/product-plan-v2.docx`
- LibreOffice: `/mnt/projects/Crawllex/doc/source/product-plan-v2.odt`
- Section 11 to 15 source: `/mnt/projects/Crawllex/doc/source/product-plan-v2-part3.md`

Rebuild the .docx and .odt after edits: `/mnt/projects/Crawllex/doc/source/build-product-plan.sh` (uses `build-md2html.py` in the same folder).

The Claude Docs artifact (node `4c879c55-cef7`, rev 20) has sections 1 to 10 only. Its update calls failed because of a malformed call wrapper on my side. Do not continue there unless the wrapper issue is fixed.

Earlier notes below are kept for history.

## Where the doc is

- Claude Docs artifact: https://claude.ai/artifact/1GV5w73RWKkNVBqL7nyYHj
- Doc id: 022976ee-78b6-4b97-98c0-a4a8ddf5de36
- Node (content) id: 4c879c55-cef7. Tab id: 6be6626b-b679.
- Revision at handoff: rev 10. Now rev 19 (2.2, 2.3, sections 3 to 7 added).
- Sections 8 to 15 are NOT written. Session stopped at section 8 because the update call kept failing with a malformed-JSON error (wrapper key `__unparsedToolInput`). Use the plain parameters shown in the section 3 block, with no wrapper key. Content plan for 8 to 10 is in "Radar, Compass, Connect" above; keep technical sections empty.
- Old v1 sections are still below the v2 content, and the old title is still there. Not removed yet.
- Written so far: title line, table of contents (15 sections), section 1 (overview with status legend), section 2 (tiers, feature matrix, credits), section 3 (built modules 1 to 10 and 12, as 3.1 to 3.11), section 4 (Reports, planned), section 5 (DataForSEO, planned), section 6 (Crawllex Insight, built; OpenAI move planned).
- NOT written yet: sections 7 to 15.
- Edit tip: replace op needs target {"kind":"blocks","ids":["<session>.<clock>"]} with full id, ifRev, ifHash, and "with" (not "source"). Read the node first to get hashes.
- Old v1 sections (from the earlier status doc) are still below the new content. Remove them after the new sections are in. Also replace the old title ("Platform & AI Agents: Internal Product Status") with the v2 title.

## How to write to the doc (what worked)

Use the update tool with these top-level parameters, no extra wrapper keys:

- ref: {"object": "node", "id": "4c879c55-cef7"}
- engine: "prose"
- container: {"kind": "project", "id": "022976ee-78b6-4b97-98c0-a4a8ddf5de36"}
- payload: {"ops": [{"op": "insert", "target": {"kind": "root"}, "side": "end", "source": {"as": "markdown", "from": {"kind": "inline", "content": "..."}}}]}

Write one section per call. Read the node first (object "node") to get block ids and the current rev before any replace or delete. Replace/delete need ifRev and ifHash from that read.

A failed call returned "could not be parsed as JSON". That happened when the call was wrapped in a stray `__unparsedToolInput` key. Do not use that key.

## Decisions taken (owner brief, 2026-10-29)

- Audience: internal team (developers, product owners, CTO). Not investors.
- Doc must be detailed, with a TOC and a proper section per module and per agent.
- Every module: what it does exactly, screens, actions, data, permissions, status.
- Any module with no research done: leave the technical section empty and say so.
- Branding: Crawllex. Doc must stay editable (Claude Docs).
- No timelines or dates in the roadmap. Use status and dependency order.
- Client Onboarding (old Module 13): DISCARD completely. Do not mention it anywhere.
- Reports (Module 11): IN SCOPE, planned. Details below.
- Crawllex Insight AI: planned move from OpenRouter to OpenAI API (pay per use, persistent chat history). R&D pending.
- Compass, Connect, Radar: treat as NOT STARTED (planned, R&D pending). Not "partial".
- Lens: every Lens feature is Planned or In progress. Never Done (not verified). Say "server", not "leocore".
- DataForSEO: planned integration as Crawllex modules, paid tiers only. Replaces Ahrefs use. Modules to define: domain overview, keyword tracking, rank tracking, backlinks. Create new modules where needed.
- Credits: 1 credit = 1 unit of agent work. Unit and cost per run: R&D pending.

## Subscription tiers (decided names, prices TBD)

| Tier | Name | Projects | Agent credits/mo | Notes |
|---|---|---|---|---|
| 1 | Scout | 5 | 0 | Free. Analytics + SEO activities tracking only. No agents. No on-demand reports. Automatic monthly report, 30-day period (interpreted from "30 months"; confirm, Decision D8). |
| 2 | Ranger (was "Gold") | up to 10 | 100 | Agents, reports on demand, extra credits pay per use. |
| 3 | Pathfinder | up to 30 | 300 | Same as Ranger, bigger allowances. |
| 4 | Cartographer | custom | custom | Custom plan. Discount for bigger spend. |

- DataForSEO: paid tiers only. Not counted in the 5 free projects.
- Leads and the Crawllex Insight AI assistant on Scout: open, Decision D9.
- Names need trademark and market check.
- No billing code exists in the repo. Status: Planned.

## Reports plan (Module 11, planned)

- Generated with AI, delivered as PDF, on a template.
- On demand for a chosen period: last 15 days, last 30 days, custom range.
- Automatic monthly report, sent to the project owner.
- Owner can add more recipients from the project's users in Settings.
- Content: analytics (GSC/GA4 cache), SEO activities, leads, and agent outputs.
- Narrative summary via the planned OpenAI integration. Needs R&D on prompt, cost, and whether a human approves before sending (open question from the old roadmap doc).
- Status: Planned. No report code exists. Old roadmap doc: /mnt/projects/Crawllex/doc/roadmap-automated-client-reporting.md (parked; superseded by this decision).
- Smaller first step option from old doc: templated PDF without AI narrative first.

## Existing facts (verified in code, 2026-10-29)

Platform modules built on dev/staging:
1. Authentication: register, login, logout, email verification, forgot/reset password (reset revokes tokens), Google sign-in, inactive users blocked. Token: opaque bearer, SHA-256 stored, 24 h TTL.
2. Project setup/onboarding: three-step wizard (business, details, SEO). Creator becomes owner; project starts pending.
3. Project management: list/detail/edit, approve/reject/activate/deactivate (super admin), owner reassignment, sidebar selector.
4. Roles, permissions, users: permission matrix, role templates (system: project_owner, project_user), user admin, membership editor. Fixed permission catalog.
5. Project members: invite by email, accept/decline, membership in project selector.
6. Project access control: project-scoped RBAC; project status gating (pending/inactive/rejected).
7. Dashboard: key result chips (leads, calls, WhatsApp, email clicks), SEO trend grid, Crawllex Insight panel.
8. Performance analytics: GSC + GA4 via service account. Daily cache, 90-day backfill, nightly sync (Vercel cron). Dimensions top 100 per type per day. Excel export. Top events card (GA4).
9. SEO activities: types blogs, backlinks, technical_work. Fields: url, occurredOn, title/anchorText/details, docUrl. Blogs can push a Google Doc to WordPress as a draft (drafts only by rule).
10. Leads: origin csv_import / manual / wordpress. Dedupe on normalized email + phone per project. CSV import wizard (5 steps). WordPress plugin ingest with lead source key. Limit: 1 lead source per project (MVP). NO lead status field in the code (the manual promises a status lifecycle; not built).
12. Settings: theme packs (default, glass-aurora, verdant-grove, lumen-slate), font packs, integrations panel, profile, photo, password.
11. Reports: NOT built (planned, see above).

Crawllex Insight (AI assistant):
- Live on crawllex-dev. On main since 2026-10-22. Behind ASSISTANT_AI_ENABLED and the LLM_* vars (OpenRouter removed 2026-11-09).
- Model: dots-studio/dots-3-note-preview:free (free, third-party). Gemini removed 2026-10-20.
- Four read-only tools: get_leads_count (counts only), get_analytics_overview, get_analytics_top_dimensions, get_seo_activity_counts.
- Fallback: rule-based Quick Lookup. Circuit breaker: 3 failures, 5 min off, per instance.
- No eval set, no per-project quota, no persistent chat history (AssistantQueryHistory stores queries only).

Known gaps and debt (from doc/migration.md):
- Rate limiter is in-memory per instance (weak on serverless).
- Lint: 48 problems (24 errors) in the React compiler rules.
- Lead sources: 1 per project (manual says multiple).
- Timezone and project settings (name, domain, branding per old module spec): not verified.
- .env.production.local and Vercel env differ in 13 values.
- WordPress push issues: app password not deleted on disconnect; timeouts can duplicate posts; Rank Math meta not sent; Arabic strings unreviewed.
- Test count: 1076 passing (dev, 2026-10-22).

## Lens (agent 1). Status: In progress or Planned. Never Done.

Code exists in /mnt/projects/crawllex-lens (TypeScript, not verified end to end):
- Safe reader: same-site only, DNS and target validation, robots.txt.
- UI audit: six viewports (360, 390, 768, 1024, 1280, 1920; owner to confirm), axe-core, small text, tap targets, overflow, console, failed resources.
- SEO checks: about 28 rule ids (titles, meta, headings, canonicals, images alt, structured data, indexability, redirects). Guidelines are not ranking rules.
- Crawl: budgets. Defaults maxPages 50, maxDiscovered 500, depth 6, requests 250, bytes 20 MB, duration 240 s. Gate 1 used a cap of 30.
- Storage: SQLite. Tables: projects, runs, findings, issues, issue_events, incidents, probes, probe_schedules, notifications (plus jobs queue).
- Issue lifecycle: open, resolved, reopened. Partial coverage never resolves an issue.
- Worker: one job at a time, leases.
- Local API on 127.0.0.1:3025 (token). Routes: /health, projects, runs, issues, incidents, notifications, report-fixed, schedule, jobs.
- Availability: homepage probe every 5 min. Incident after 2 failed probes, recovery after 2 passes.
- Fix verification: report-fixed then next complete run decides verified or fix_failed.
- Notifications: signed webhook only, off until configured. Only 2xx counts as sent. Email not built.
- Crawlex link: read-only service token, staging only. Project allowlist.
- Tests: 12 test files. Status note says 72 passing. NOT rerun for this doc.
- Gate 1: one site (argorsi.com). Owner to name two more. Found 3 colour-contrast violations (match manual check).

Lens planned (not started): dashboard inside Crawllex (needs owner OK), Hermes profile on server (docs only), AI decision review (pluggable, off), subdomain lens.crawllex.com (not created), email alerts, Crawllex consent step (Crawllex developer to confirm).

## Radar, Compass, Connect (agents 2-4). Status: NOT STARTED. R&D pending.

- No code. Leave technical sections empty and mark R&D pending.
- Radar: competitor discovery, keyword movement, new pages, backlinks, outreach suggestions. Needs a competitor data source (may overlap DataForSEO).
- Compass: weekly action plan from website findings, competitors, analytics, leads. Depends on Lens and Radar.
- Connect: auto-acknowledge inquiries (owner permission), qualifying questions, follow-ups, handover to human. Needs email channel, lead status model, consent.

## Other planned items

- DataForSEO modules (planned, paid-only): domain overview, keyword tracking, rank tracking, backlinks. Need R&D: API cost, coverage, credit mapping.
- AI search visibility (from the agent feature list): not assigned to the four agents. Decide where it goes.
- Subscription billing: no code.
- OpenAI API move for the assistant and reports: R&D (cost, model, persistence, data policy).

## Decision and R&D register (open)

- D1 Lens Gate 1: two more owner sites.
- D2 Viewport list confirm.
- D3 Crawl page cap: keep 30 or raise.
- D4 Allow Lens dashboard work in Crawllex UI.
- D5 Deploy timing, lens subdomain.
- D6 Webhook endpoint and secret for alerts.
- D7 Is "Zohiab Butt" in the test DB real?
- D8 Free tier monthly report: is "30 months" a 30-day period? (Assumed 30-day.)
- D9 Scout: include Leads and the AI assistant or not?
- D10 Credit unit and cost per agent run (R&D).
- D11 Unused credits: roll over or expire.
- D12 Prices for Ranger, Pathfinder.
- D13 Tier names: trademark and market check.
- D14 Reports: AI narrative needs human approval before send?
- D15 OpenAI move: model, cost, data policy, chat persistence design (R&D).
- D16 DataForSEO: API cost and coverage vs Ahrefs (R&D).
- D17 Radar competitor data source (R&D).
- D18 Connect email channel and lead status model (R&D).
- D19 Lead status lifecycle: build or drop from the manual.
- D20 Untracked AGENTS.md and CLAUDE.md in Crawllex repo.

## Roadmap order (no dates)

1. Lens Phase 1 (local, In progress): finish Gate 1.
2. Crawllex hardening: rate limiter, lint, lead status decision, prod env reconciliation.
3. Reports (planned): data assembly + PDF template first, then AI narrative.
4. Subscription billing and tiers (planned).
5. DataForSEO modules (planned, paid only).
6. Crawllex Insight move to OpenAI with chat persistence (planned, R&D).
7. Lens Phase 2 dashboard, Phase 3 hardening, Phase 4 deploy (planned).
8. Radar, then Compass (needs Lens and Radar), then Connect (planned, R&D first).

## Sources

- /mnt/projects/Crawllex (branch dev): code.
- /mnt/projects/Crawllex/doc/ (modules/README.md, architecture.md, rbac.md, api.md, assistant-ai.md, migration.md, service-tokens.md, roadmap-*.md).
- /mnt/projects/Crawllex/doc/source/SEO Dashboard - By Modules.md (original module spec).
- /mnt/projects/crawllex-lens (docs/STATUS.md, PLAN-COMPLETE.md, GATE1.md, DECISIONS.md, HERMES.md, TESTING-ENV.md; src/).
- /mnt/projects/docs/gdocs-context/: crawllex-product-manual.txt, crawllex-v2-features.txt, crawllex-lens-doc.txt.
