**Upkeep:** edit this doc inline. Status changes must cite a source above. Re-check the status matrix before each review. No dates until the owner sets them.

## Table of contents

1. Product overview
2. Subscription tiers and credits
3. Crawllex platform: current modules (built)
4. Reports (planned)
5. DataForSEO integration (planned)
6. Crawllex Insight AI assistant
7. AI agent: Lens (in progress and planned)
8. AI agent: Radar (R&D pending)
9. AI agent: Compass (R&D pending)
10. AI agent: Connect (R&D pending)
11. Shared platform: access, data, integrations, security
12. Known gaps and technical debt
13. Decision and R&D register
14. Roadmap (no dates)
15. Sources and upkeep

## 1. Product overview

| Item | Value |
|---|---|
| Product | Crawllex: SEO operations platform for agencies and in-house SEO teams |
| Model | Subscription SaaS with tiers (section 2) |
| Users | Super Admin (platform), project owner, project member, client stakeholder |
| Core rule | One project = one client workspace. Clients never receive Google logins |
| Built today | Platform modules 1 to 10 and 12 (section 3) |
| Planned | Reports, DataForSEO modules, subscription billing, four AI agents |
| Stack today | Next.js 16, TypeScript, MongoDB (Mongoose), Cloudflare R2, transactional email, OpenRouter (AI assistant) |
| Stack planned | OpenAI API for the assistant and reports (pay per use, persistent chat history). R&D pending |
| Environments | Production: crawllex.com (Hostinger). Staging: crawllex-dev (Vercel). Local development |
| Audience | Developers, product owners, CTO (internal) |

Status words used in this document:

- **Built**: code exists and is in use on staging.
- **In progress**: code exists or work started. Not verified end to end.
- **Planned**: decided, no code yet.
- **R&D pending**: scope known, research not done. Technical details are left empty on purpose.

## 2. Subscription tiers and credits

Crawllex becomes a subscription product. **Status: Planned.** No billing, plan or credit code exists in the repo. Prices are not set. Tier names are proposals.

| Tier | Name (proposed) | Price | Projects | Agent credits per month | Who it is for |
|---|---|---|---|---|---|
| 1 | **Scout** | Free | 5 | 0 | Small teams that want analytics and SEO tracking only |
| 2 | **Ranger** (called Gold in the first brief) | TBD | up to 10 | 100 | Agencies that want agents and on-demand reports |
| 3 | **Pathfinder** | TBD | up to 30 | 300 | Larger agencies running agents across many clients |
| 4 | **Cartographer** | Custom | Custom | Custom | Large accounts. Custom plan with a discount on larger spend |

Names follow the crawling and exploration theme. Final names need a trademark and market check. R&D pending.

### 2.2 Feature matrix by tier

What each tier gets. Status column shows the state of the feature in code. Tier rules are proposals until the owner confirms them (see the decision register).

| Feature | Scout (1) | Ranger (2) | Pathfinder (3) | Cartographer (4) | Status |
|---|---|---|---|---|---|
| Projects | 5 | Up to 10 | Up to 30 | Custom | Planned |
| Analytics: GSC and GA4 cache, Excel export | Yes | Yes | Yes | Yes | Built |
| SEO activities tracking (blogs, backlinks, technical work) | Yes | Yes | Yes | Yes | Built |
| Leads (CSV import, manual, WordPress plugin) | Open (D9) | Yes | Yes | Yes | Built |
| Crawllex Insight AI assistant | Open (D9) | Yes | Yes | Yes | Built on staging and main. Model move to OpenAI planned |
| Automatic monthly report (30-day period, sent to project owner) | Yes | Yes | Yes | Yes | Planned |
| On-demand report: last 15 days, last 30 days, custom range | No | Yes | Yes | Yes | Planned |
| Extra report recipients from project users (Settings) | No | Yes | Yes | Yes | Planned |
| AI agents: Lens, Radar, Compass, Connect | No | Yes | Yes | Yes | Lens in progress. Radar, Compass, Connect R&D pending |
| Agent credits per month | 0 | 100 | 300 | Custom | Planned. Credit unit R&D pending (D10) |
| Extra credits, pay per use | No | Yes | Yes | Yes | Planned |
| DataForSEO modules (domain overview, keyword tracking, rank tracking, backlinks) | No | Paid tiers only | Paid tiers only | Paid tiers only | Planned. Not counted in the free project limit |
| Price | Free | TBD | TBD | Custom | Planned. Prices not set (D12) |

Open points that affect this table:

- D8: Scout's automatic report uses a 30-day period. The original brief says "30 months". Confirm.
- D9: Leads and the AI assistant on Scout. Include or not.
- D10: credit unit and cost per agent run.
- D11: unused credits roll over or expire.
- D12: prices for Ranger and Pathfinder.
- D13: tier names need a trademark and market check.

### 2.3 Agent credits

**Status: Planned.** No credit code exists.

- One credit equals one unit of agent work. The unit definition and the cost per run are R&D pending (D10).
- Each tier gets a monthly allowance (section 2.1). Extra credits are sold pay per use. Price TBD.
- Open: unused credits roll over or expire (D11).
- Open: which actions consume credits. Agent runs are the assumed case. Reports and DataForSEO calls are not yet decided.
- Scout has 0 credits. It has no agents, so it has no credit use.

## 3. Crawllex platform: current modules (built)

This section lists the platform modules that exist in code. Module numbers follow the original module doc (1 to 12). Module 11 (Reports) is planned and has its own section (4). Each module below gives what it does, its screens, its actions, its data, its permissions and its status. Status is checked against the code on the dev branch and the staging environment (crawllex-dev).

### 3.1 Authentication (Module 1)

- **What it does:** account registration, login and logout, email verification, forgot and reset password, and Google sign-in. Inactive users are blocked from signing in.
- **Screens:** sign-in, register, verify email, forgot password, reset password, email verification notice.
- **Actions:** register, log in, log out, verify email, request password reset, reset password, sign in with Google.
- **Data:** users. Tokens are opaque bearer tokens. Only the SHA-256 hash is stored. Token lifetime is 24 hours. A password reset revokes existing tokens.
- **Permissions:** open to visitors. No project permissions.
- **Status:** Built.

### 3.2 Project setup and onboarding (Module 2)

- **What it does:** creates a project through a three-step wizard: business details, project details, SEO details.
- **Screens:** create project wizard.
- **Actions:** create project. The creator becomes the project owner. The project starts in status `pending` unless a super admin creates it.
- **Data:** projects, project members.
- **Permissions:** any signed-in user who passes the create gate (`can-create-project`).
- **Status:** Built.

### 3.3 Project management (Module 3)

- **What it does:** list, view, edit and delete projects. Lifecycle changes and owner reassignment.
- **Screens:** projects list (card and table views), project detail, project edit, sidebar project selector.
- **Actions:** view, update, delete (project permissions). Approve, reject, activate and deactivate (super admin only). Reassign owner (super admin only). Lifecycle emails are sent on status changes.
- **Data:** projects.
- **Permissions:** `projects.view`, `projects.update`, `projects.delete`. Lifecycle actions are limited to super admin.
- **Status:** Built.

### 3.4 Roles, permissions and users (Module 4)

- **What it does:** platform administration of users and project roles.
- **Screens:** roles list, create role, edit role (permission matrix); users list, create user, edit user; membership editor for admin.
- **Actions:** create, edit and delete roles (only inactive custom roles can be deleted). Activate and deactivate users. Delete inactive users. Edit a user's project memberships.
- **Data:** roles, users, project members.
- **Permissions:** `admin.roles.*` and `admin.users.*`. Super admin only.
- **Role templates:** two system roles are seeded: `project_owner` and `project_user`. The permission catalog is fixed. Operators cannot add permission keys.
- **Status:** Built.

### 3.5 Project members (Module 5)

- **What it does:** invite people to a project by email. Invitees accept or decline.
- **Screens:** members card on project detail, invite quick-add, invitations banner on the dashboard.
- **Actions:** invite by email, remove member, accept invitation, decline invitation.
- **Data:** project members (`ProjectMember`: project, user, role, status).
- **Permissions:** `members.view`, `members.invite`, `members.remove`.
- **Status:** Built.

### 3.6 Project access control (Module 6)

- **What it does:** enforces project-scoped RBAC on every project route and on the frontend. Project status changes what a member can do.
- **Screens:** route guard, sidebar gating. No screen of its own.
- **Rule:** a member's access comes from the active role on their membership. Status gating:`active`: role permissions.
- `pending` and `inactive`: `projects.view`, `projects.update`, and the role's `members.*`.
- `rejected`: `projects.view` only.
- No active membership: 404 `Project Not Found.`

**Super admin:** full catalog on active, pending and inactive projects. On rejected projects, `projects.view` only.

**Status:** Built. The module README still shows partial. The code is complete.

### 3.7 Dashboard overview (Module 7)

- **What it does:** the project home page. Shows key results, an SEO trend grid and the Crawllex Insight assistant panel.
- **Screens:** dashboard home.
- **Key result chips:** Leads, Calls, WhatsApp, Email Clicks.
- **Actions:** read only, plus opening the assistant panel.
- **Data:** cached analytics, leads, SEO activities.
- **Permissions:** `dashboard.view` (project scope).
- **Status:** Built. The assistant part is described in section 6.

### 3.8 Performance analytics (Module 8)

- **What it does:** shows Google Search Console (GSC) and Google Analytics 4 (GA4) data per project. Pages read the cache only. Google is called only by sync.
- **Screens:** analytics page: cards, trend, sources, top queries and pages, top events card (GA4), world map, Excel export.
- **Actions:** connect a property, manual refresh, export to Excel. Connections use a service account. Clients never give Google logins.
- **Sync:** connect, manual refresh and a nightly cron (Vercel). Daily cache. 90-day backfill on connect. Top 100 dimensions per type per day.
- **Data:** analytics daily cache, per project.
- **Permissions:** `analytics.view` to read. `integrations.*` to connect, refresh or disconnect.
- **Status:** Built.

### 3.9 SEO activities (Module 9)

- **What it does:** logs SEO work done for the client. Work is entered by hand. There is no Google Sheets import.
- **Screens:** SEO activities page with tabs Blogs, Backlinks and Technical Work, a date filter, summary cards, quick add, CSV and Excel export.
- **Activity types:** `blogs`, `backlinks`, `technical_work`. The original name for Technical Work was Website Changes.
- **Fields:** url, occurredOn, title or anchorText or details, docUrl.
- **Blog push:** a blog activity can push a public Google Doc to the connected WordPress site as a draft. The UI shows a "Pushed As Draft" badge. Crawllex never publishes. Drafts only.
- **Permissions:** `seo_activities.view`, `seo_activities.create`, `seo_activities.update`, `seo_activities.delete`. The WordPress push uses the `integrations` permissions.
- **Status:** Built. Known push issues are listed in section 12.

### 3.10 Leads (Module 10)

- **What it does:** stores leads from three sources and lets the team work them.
- **Screens:** leads table, lead detail sheet, lead editor, CSV import wizard (5 steps), export.
- **Lead origins:** `csv_import`, `manual`, `wordpress`.
- **WordPress:** the Crawllex lead capture plugin (`crawllex-leads-capture/`) sends leads to `api/v1/leads/ingest`, using a lead source key. When the owner clicks Verify, the plugin creates its own WordPress application password.
- **Dedupe:** per project, on normalized email plus phone.
- **Limit:** one lead source per project in the MVP. The manual says more are allowed.
- **Missing:** there is no lead status field in the code. The manual describes a status lifecycle. It is not built. See decision D19.
- **Permissions:** `leads.view`, `leads.create`, `leads.update`, `leads.delete`, `leads.import`, `leads.export`. The system role `project_owner` is seeded with view and export only. The system role `project_user` is seeded with view plus export. Confirm this in code before relying on it.
- **Status:** Built.

### 3.11 Settings and profile (Module 12)

- **What it does:** personal profile, and per-project integrations.
- **Screens:** `/settings` (theme packs, font packs, integrations panel), `/edit-profile` (profile, photo, password).
- **Theme packs:** default, glass-aurora, verdant-grove, lumen-slate. Font packs are also available.
- **Actions:** change theme and font, edit profile, change photo, change password, manage project integrations (GSC, GA4, WordPress lead sources and WordPress draft push).
- **Permissions:** profile, password and preferences are open to any signed-in user. Integrations need `integrations.*`.
- **Status:** Built.

Module 11 (Reports) is not built and is described in section 4.

## 4. Reports (Module 11)

**Status: Planned.** Decided by the owner (2026-10-29). Reports are in scope. No report code exists yet.

### 4.1 What a report is

- A PDF, generated for one project, built on a template.
- The content is assembled from Crawllex data. An AI model writes the narrative summary.
- Reports go to the project owner and to any extra recipients the owner adds.

### 4.2 Report types and triggers

| Type | Trigger | Period | Recipients |
|---|---|---|---|
| On demand | User clicks Generate | Last 15 days, last 30 days, or a custom range | The user, and any recipients the user picks |
| Automatic monthly | Scheduled, once a month | 30-day period (D8: confirm) | Project owner, plus extra recipients |

Extra recipients are chosen from the project's users in Settings. Scout (free tier) gets only the automatic monthly report. Ranger and higher get on-demand reports too (section 2.2).

### 4.3 Report content

- Analytics from the GSC and GA4 cache (section 3.8). Pages read cache only. Reports must do the same.
- SEO activities for the period (section 3.9).
- Leads for the period (section 3.10). Lead status is not in the data model yet (D19).
- Agent outputs, once agents exist (sections 7 to 10). Empty until then.
- Narrative summary: written by the planned OpenAI integration (section 6). R&D pending.

### 4.4 Permissions

- No report permission key exists. The permission catalog is fixed (`doc/rbac.md`), so a new key must be added before reports ship. Proposed key: `reports.view` and `reports.generate`. To be decided.
- The code (`permission-catalog.ts`) and `doc/rbac.md` still say reports are out of scope. This section replaces that decision. Update those files when reports start.

### 4.5 Delivery

- PDF attached to email, sent through the existing transactional email setup (Zoho SMTP).
- Report files: storage and retention not decided.

### 4.6 Open points

- D14: does a human approve the AI narrative before the report is sent? Needs R&D on prompt, cost and quality.
- Storage and retention of generated PDFs. Not decided.
- Smaller first step (from the old roadmap): ship a templated PDF with no AI narrative first. Then add the narrative. Not yet decided.

### 4.7 Build order

1. Data assembly and PDF template, no AI narrative.
2. Permission keys and on-demand generation.
3. Automatic monthly report.
4. AI narrative via OpenAI, after D14 and cost R&D.

The old roadmap doc `doc/roadmap-automated-client-reporting.md` is parked and superseded by this section.

## 5. DataForSEO integration (planned)

**Status: Planned.** Decided by the owner (2026-10-29). No code exists in any repo. Technical sections stay short until R&D (D16) is done.

### 5.1 Purpose

- DataForSEO data is added as Crawllex modules. It replaces the Ahrefs use the team relies on today.
- Only paid tiers get DataForSEO modules (section 2.2). Free Scout projects do not.
- DataForSEO projects do not count toward the free project limit.

### 5.2 Modules to define

| Module | Purpose | Status |
|---|---|---|
| Domain overview | Summary of a domain's search presence | Planned. Define data fields |
| Keyword tracking | Track chosen keywords for a project | Planned. Define data fields |
| Rank tracking | Track search positions over time | Planned. Define data fields |
| Backlinks | Backlink profile for a project's domain | Planned. Define data fields |

New Crawllex modules are created for each one. Each needs its own screens, actions, data, permissions and status, in the same form as section 3.

### 5.3 Open points

- D16: API cost and data coverage compared with Ahrefs. Research needed before pricing.
- Credit mapping: which DataForSEO calls use credits, and how many. Depends on D10 (credit unit).
- Caching: how often data is fetched and stored. Not decided. Pages should read cache only, as analytics does (rule 6 in the agent hub).
- Permissions: a new permission group is needed. Not decided.

### 5.4 Build order

After reports and billing (section 14). Not dated.

## 6. Crawllex Insight AI assistant

**Status: Built** on staging (crawllex-dev) and on the main branch since 2026-10-22. Production status is not confirmed. The model provider is planned to move from OpenRouter to the OpenAI API (see 6.5).

### 6.1 What it does

The assistant answers questions about one project's data, in the dashboard panel (section 3.7). Each answer carries a badge:

- **Crawllex Insight**: the AI path answered.
- **Crawllex Quick Lookup**: the rule-based fallback answered.

Both names are product names. Do not describe either one as an in-house model.

### 6.2 Flow

1. Route guard checks `dashboard.view`. The project comes from the route, never from model output.
2. The AI path runs only if the master switch is on and the circuit breaker is closed.
3. The model receives a system instruction (today's UTC date, plain text), the question, and the tool declarations.
4. The model calls read-only tools. The server runs each tool with the caller's project access.
5. The model answers from the tool results. Maximum 5 model turns per question.
6. Any failure sends the question to Quick Lookup. The response `source` is `ai` or `nlp`.

### 6.3 Tools (all read-only)

| Tool | Permission | Returns |
|---|---|---|
| `get_leads_count` | `leads.view` | Count of leads in a date range. No lead personal data |
| `get_analytics_overview` | `analytics.view` | GSC and GA4 totals for a date range |
| `get_analytics_top_dimensions` | `analytics.view` | Top rows (25 at most) of one dimension for one source |
| `get_seo_activity_counts` | `seo_activities.view` | Counts by activity type, optional range |

No write tools exist. Dates must be ISO, `from` must not be after `to`, and the span is at most 366 days.

### 6.4 Current provider and limits

- Provider: OpenRouter. Default model `dots-studio/dots-3-note-preview:free`, a third-party free model. Gemini was removed on 2026-10-20 (quota exhausted and latency over 25 s).
- Settings: temperature 0, 1024 max tokens, 25 s timeout per call, 60 s route limit.
- Circuit breaker: 3 consecutive failures turn the AI path off for 5 minutes. The breaker is per server instance.
- Data rule: lead records are never sent to the model. Analytics rows (search queries, page URLs, countries, devices) are sent. Free providers may log prompts.
- Config: `ASSISTANT_AI_ENABLED`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`.

### 6.5 Planned: move to OpenAI API

- Pay per use, instead of a shared free quota.
- Persistent chat history. Today only queries are stored (`AssistantQueryHistory`). No answers and no chat threads.
- Data policy of the paid API must be checked before client analytics data is sent. Pending (D15).
- Model choice, cost per question, and chat history design: R&D pending (D15).
- Quota per project or per user: not designed. Depends on credits (section 2.3).

### 6.6 Known gaps

- No evaluation set yet. Plan is 30 to 50 golden questions with expected numbers.
- No per-project or per-user AI quota. The free upstream quota is shared.
- Prompt-injection defence is prompt-level only. Search queries and page URLs in tool data can carry attacker text.
- Arabic answers are not reviewed.
- Answers are plain text. The UI does not render markdown.
- Free model reliability (rate limits, provider changes) is not measured beyond a few test calls.
- No integration test for the switch from AI to Quick Lookup.

### 6.7 Open points

- D15: OpenAI model, cost, data policy, and chat persistence design.
- Whether the assistant is on Scout (D9).

## 7. AI agent: Lens (in progress and planned)

**Status: In progress.** Every Lens feature is either In progress or Planned. None is Done, because none is verified end to end. Lens is a separate service with its own repo. It reads Crawllex through a read-only connector.

### 7.1 Purpose

Lens checks a client's website. It finds issues in the page content, the UI, the SEO setup, and the availability of the site. It reports the issues, tracks them over time, and checks whether fixes worked.

Lens rules: guidelines are not ranking rules. The checks follow published guidance and do not promise rankings.

### 7.2 Components (In progress)

| Component | What it does | Status |
|---|---|---|
| Safe reader | Reads only the client's own site. Same-site only. DNS and target checks. Obeys robots.txt | In progress |
| UI audit | Six viewports: 360, 390, 768, 1024, 1280, 1920 (owner to confirm, D2). Uses axe-core. Checks small text, tap targets, overflow, console errors, failed resources | In progress |
| SEO checks | About 28 rule IDs: titles, meta, headings, canonicals, image alt text, structured data, indexability, redirects | In progress. Ported and checked against the old analyzer on fixtures |
| Crawl engine | Budgets: 50 pages (default), 500 discovered, depth 6, 250 requests, 20 MB, 240 s. The Gate 1 cap is 30 pages (D3) | In progress |
| Storage | SQLite (schema v2). Tables: projects, runs, findings, issues, issue events, incidents, probes, probe schedules, notifications, jobs | In progress |
| Issue history | Issue states: open, resolved, reopened. A partial crawl never resolves an issue | In progress |
| Worker | One job at a time, with leases and retries. Runs queued checks, schedules and availability probes | In progress |
| Local API | Listens on 127.0.0.1:3025 with an admin token. Routes: health, projects, runs, issues, incidents, notifications, report-fixed, schedule, jobs. Every project route is checked against the project allowlist | In progress |
| Availability | Homepage probe every 5 minutes. Incident after 2 failed probes. Recovery after 2 good probes | In progress |
| Fix verification | `report-fixed` marks an issue as fixed. The next complete run decides verified or fix_failed | In progress |
| Notifications | Outbox. Signed webhook only, off until configured. Counted as sent only on a 2xx response | In progress. Webhook endpoint and secret needed (D6) |
| Crawllex connector | Read-only client for Crawllex, with a project allowlist. Uses a service token. Staging only | In progress. Verified against testing data |

### 7.3 Crawllex side (In progress)

- Service-token code is on `dev` and gated off by default. Staging deploy is `crawllex-dev`.
- Dashboard section inside Crawllex to show Lens results: Planned. Needs owner approval to change Crawllex UI (D4).
- The Crawllex consent step does not exist yet. Lens relies on its own allowlist. Crawllex developer to confirm (see section 12).

### 7.4 Planned, not started

- AI review of findings: pluggable and off by default.
- Email alerts: not built. Webhook only.
- Subdomain `lens.crawllex.com`: not created (D5).
- Hermes profile on the server: documentation only. Not deployed.
- Phase 2 (dashboard), phase 3 (hardening), phase 4 (deployment). See section 14.

### 7.5 Gate 1

- Gate 1 is the first real-site test. Only one site is checked: argorsi.com.
- Owner must name two more sites (D1), or accept a one-site Gate 1.
- Three colour-contrast violations were confirmed in the browser on argorsi.com. Owner's site, not yet fixed.
- The test database also holds a site (scentnsplendor.com). Owner must confirm whether it is real (D7).

### 7.6 Tests

- The Lens test suite has 12 files. The last status note says 72 tests pass. Not rerun for this document.

### 7.7 Known limits

- UI findings are grouped per viewport. One issue can appear six times.
- Word count counts `<main>` text with hidden content removed. Raw counts differ. Not aligned with other tools.

## 8. AI agent: Radar (R&D pending)

**Status: R&D pending.** Not started. No code. Technical details are left empty on purpose.

- **Scope:** competitor discovery, keyword movement, new competitor pages, backlinks, outreach suggestions.
- **Dependency:** needs a competitor data source. This may overlap with DataForSEO (section 5). Decide with D17.
- **Feeds:** Compass (section 9).
- **Permissions, screens, data model, and cost:** not defined.

## 9. AI agent: Compass (R&D pending)

**Status: R&D pending.** Not started. No code. Technical details are left empty on purpose.

- **Scope:** a weekly action plan built from website findings (Lens), competitors (Radar), analytics, and leads.
- **Dependencies:** Lens (section 7) and Radar (section 8). Compass cannot be built before both have data.
- **Permissions, screens, data model, and cost:** not defined.

## 10. AI agent: Connect (R&D pending)

**Status: R&D pending.** Not started. No code. Technical details are left empty on purpose.

- **Scope:** auto-acknowledge inquiries (only if the project owner allows it), ask qualifying questions, send follow-ups, and hand over to a human.
- **Needs before design:** an email channel (D18), a lead status model (D19, see section 3.10), and a consent process for contacting people.
- **Permissions, screens, data model, and cost:** not defined.

