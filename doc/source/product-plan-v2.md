# Crawllex: Full Product Plan (v2)

Internal: developers, product owners, CTO. Date: 2026-10-29. Scope: Crawllex v2 only. AI agents are v3 and are parked in Appendix A.

## Table of contents

1. Product overview
2. Subscription tiers and feature matrix
3. Crawllex platform: current modules (built)
4. Reports (planned)
5. DataForSEO and local SEO (planned)
6. Crawllex Insight AI assistant
7. Notifications (planned)
8. Mobile app, read only (planned)
9. Lead integrations (planned)
10. Shared platform: access, data, integrations, security
11. Known gaps and technical debt
12. Decision register (v2)
13. Roadmap (v2, no dates)
14. Sources and upkeep
15. Appendix A. Agents and credits (v3 plan)

## 1. Product overview

| Item | Value |
|---|---|
| Product | Crawllex: SEO operations platform for agencies and in-house SEO teams |
| Model | Subscription SaaS with tiers (section 2) |
| Users | Super Admin (platform), project owner, project member, client stakeholder |
| Core rule | One project = one client workspace. Clients never receive Google logins |
| Built today | Platform modules 1 to 10 and 12 (section 3) |
| Planned | Reports, DataForSEO modules, notifications, mobile app (read only), lead integrations, subscription billing. AI agents are v3 (Appendix A) |
| Stack today | Next.js 16, TypeScript, MongoDB (Mongoose), Cloudflare R2, transactional email, OpenRouter (AI assistant) |
| Stack planned | OpenAI API for assistant fallback and AI report narrative (pay per use). Chat history stored in MongoDB |
| Environments | Production: crawllex.com (Hostinger). Staging: crawllex-dev (Vercel). Local development |
| Audience | Developers, product owners, CTO (internal) |

Status words used in this document:

- **Built**: code exists and is in use on staging.
- **Planned**: decided and scheduled for v2, no code yet.

## 2. Subscription tiers and feature matrix

**Status: Planned.** No billing or plan code exists in the repo yet. Tier names are decided. Prices are set by the owner and are the only business input this document leaves to the owner.

### 2.1 Tiers

| Tier | Name | Price | Projects | Who it is for |
|---|---|---|---|---|
| 1 | **Sprouta** | Free | 5 | Small businesses starting SEO. Analytics, SEO activities, leads and all lead integrations, assistant, automatic monthly report |
| 2 | **Crestora** | Set by owner | Up to 10 | Agencies and in-house teams. Adds DataForSEO data, on-demand reports, keyword tracking |
| 3 | **Peakra** | Set by owner | Up to 30 | Larger agencies. Bigger keyword and report allowances |
| 4 | **Ranovia** | Custom | Custom | Large accounts. Custom plan with a discount on larger spend |

The names are invented words, chosen so they do not collide with generic terms. A knockout search on 2026-10-29 found no software using Sprouta, Crestora, Peakra or Ranovia. Before launch, a formal trademark search is run for every tier name and the assistant name (launch checklist, section 13.2).

### 2.2 Feature matrix by tier

| Feature | Sprouta (1) | Crestora (2) | Peakra (3) | Ranovia (4) | Status |
|---|---|---|---|---|---|
| Projects | 5 | Up to 10 | Up to 30 | Custom | Planned |
| Analytics: GSC and GA4 cache, Excel export | Yes | Yes | Yes | Yes | Built |
| SEO activities (blogs, backlinks, technical work) | Yes | Yes | Yes | Yes | Built |
| Leads: CSV import, manual, WordPress | Yes | Yes | Yes | Yes | Built |
| Lead integrations: WordPress, generic webhook, Webflow, Shopify | Yes | Yes | Yes | Yes | Planned (section 9) |
| Lead sources per project | 2 | 5 | 15 | Unlimited | Planned |
| Crawllex Insight assistant: data and procedure answers | Yes | Yes | Yes | Yes | Built (single question). Chat planned |
| Assistant AI fallback (OpenAI) | 30 answers per project per month | 300 per project per month | 1,000 per project per month | Custom | Planned (6.6) |
| Automatic monthly report (30-day period, AI narrative) | Yes | Yes | Yes | Yes | Planned |
| On-demand report: last 15 days, last 30 days, custom range | No | Yes | Yes | Yes | Planned |
| DataForSEO: domain overview, keyword volume, backlinks, on-page audit, local (GBP), AI visibility | No | Yes | Yes | Yes | Planned (section 5) |
| Keyword tracking, daily rank | No | Up to 100 keywords per project | Up to 300 keywords per project | Custom | Planned (5.3) |
| Mobile app, read only | Yes | Yes | Yes | Yes | Planned (section 8) |
| Notifications: in app and email | Yes | Yes | Yes | Yes | Planned (section 7) |
| Price | Free | Set by owner | Set by owner | Custom | Owner decision |

### 2.3 Credits and agents

Agent credits and AI agents are v3. They are not sold in v2. See Appendix A.

### 2.4 Market and positioning

**Who buys.** Three customer types, in order of priority:

1. **SEO and digital agencies** with 5 to 30 client sites. Need one workspace per client, a clean activity log for billing and reporting, and reports they can send without writing them. Crestora and Peakra.
2. **In-house marketing teams** at small and mid-size businesses. Need analytics, leads and reports in one place, without learning a research suite. Crestora.
3. **Freelance SEOs and small businesses** starting SEO. Need a free workspace with analytics and lead capture. Sprouta.

**Position.** Crawllex is the client workspace for ongoing SEO work: analytics, activity log, leads, reports and an assistant, in one place per client. Research suites (Semrush, Ahrefs) are built for research and are priced per seat. Reporting tools (AgencyAnalytics) focus on dashboards. Crawllex joins the work, the data and the client report.

**Competitor price anchors** (list prices from secondary sources, checked 2026-10-29; re-check on each vendor's site before use):

| Product | Lowest paid plan | Mid plan | Top plan | Where Crawllex differs |
|---|---|---|---|---|
| Semrush | USD 139.95 per month (annual billing USD 117.33) | Guru USD 249.95 | Business USD 499.95 | Per-client workspace. Extra seats are a common complaint. Crawllex does not charge per seat for read-only members (see 10.6) |
| Ahrefs | USD 129 per month (Lite) | USD 249 (Standard) | USD 449 (Advanced) | Research-first. Crawllex is operations-first |
| SE Ranking | USD 103 per month (annual) | Pro USD 179 | Agency Pack add-on USD 69 | Closest all-in-one competitor. Crawllex adds lead capture, WordPress integration and the AI report |
| AgencyAnalytics | Priced per client or per user, calculator-based | n/a | n/a | Reporting-first. Crawllex adds SEO activities, leads and the assistant |
| Local tools (Local Falcon, BrightLocal) | Pricing not verified | n/a | n/a | Crawllex covers local (GBP read and map rank) inside the client workspace. It does not replace a dedicated local-citation tool |

**Market size signal.** A common agency retainer is about USD 3,200 per month (secondary survey, 2026). SaaS SEO work is quoted at USD 3,000 to USD 25,000 per month. Crawllex's data cost is about USD 4.80 per Crestora project per month (5.7). Software is a small share of what an agency charges the client, so price is not the main barrier. Workflow fit is.

**Distribution.** The WordPress lead-capture plugin (built) can be listed in the WordPress plugin directory. Each install is a lead for the Crawllex trial. Blog and case-study content is the second channel.

**Positioning risks.** Crowded SEO-tool market. Crawllex's name is close to several crawler names (launch checklist, 13.2). Free tier must not become a support burden (2.5).

### 2.5 Success metrics

Initial targets. Review after 90 days of live use. All targets are proposals for the owner to confirm.

| Area | Metric | Initial target |
|---|---|---|
| Activation | Projects with GSC or GA4 connected and data synced within 24 hours of creation | 70% |
| Activation | Time from sign-up to first project with data | Under 30 minutes |
| Trial | Trial to paid conversion (Crestora, Peakra) | 10% |
| Retention | Monthly paid-account retention (agencies) | 95% |
| Retention | Monthly paid-account retention (in-house) | 92% |
| Engagement | Weekly active projects (at least one report, lead action or activity log entry) | 60% of paid projects |
| Revenue | Net revenue retention | 100% or more |
| Unit economics | Gross margin after data and AI costs | 70% or more |
| Unit economics | DataForSEO and OpenAI cost per paid project | 10% or less of the tier price |
| Product quality | Scheduled sync success rate | 98% or more |
| Product quality | Report delivery success rate | 99% or more |
| Product quality | AI report number mismatches sent (4.8) | Zero |
| Support | First response, paid tiers (10.7) | Meets the response target 95% of the time |

### 2.6 Trial and onboarding

**Trial.**
- Sprouta is free for ever, with no card required.
- Crestora and Peakra: 14-day full-feature trial, no card required. Keyword tracking and DataForSEO data run in trial with the Crestora limits.
- When the trial ends without payment, the account moves to Sprouta. Projects over the Sprouta limit are kept read-only until the owner archives extra projects. No data is deleted.

**First-run path (target: first useful screen in under 10 minutes).**
1. Sign up (email or Google sign-in, existing).
2. Create the first project (three steps, existing wizard).
3. Connect GSC and GA4 (existing service-account flow). Show "sync in progress" with an estimated time.
4. Add the first lead source: WordPress plugin, generic webhook, Webflow or Shopify (section 9).
5. Show a first-value card: the top queries, the first lead count, and a prompt to generate the first report.
6. Assistant prompt with three example questions from the procedure docs (6.4).

**Onboarding help.** In-app procedure answers (assistant, step 2 of 6.3). No live onboarding call for Sprouta. Crestora and Peakra get one onboarding call, scheduled through the support queue.

**Measures.** Drop-off per onboarding step, time to first sync, time to first report. Reviewed with the metrics in 2.5.

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
- **Status:** Built. Known push issues are listed in section 11.

### 3.10 Leads (Module 10)

- **What it does:** stores leads from three sources and lets the team work them.
- **Screens:** leads table, lead detail sheet, lead editor, CSV import wizard (5 steps), export.
- **Lead origins:** `csv_import`, `manual`, `wordpress`.
- **WordPress:** the Crawllex lead capture plugin (`crawllex-leads-capture/`) sends leads to `api/v1/leads/ingest`, using a lead source key. When the owner clicks Verify, the plugin creates its own WordPress application password.
- **Dedupe:** per project, on normalized email plus phone.
- **Limit:** one lead source per project in the MVP. The manual says more are allowed.
- **Integrations:** WordPress is built. Webflow, Shopify and a generic webhook are planned (section 9). Lead sources are limited to one per project today.
- **Missing:** there is no lead status field in the code. The manual describes a status lifecycle. It is planned in section 9.7.
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

## 4. Reports

**Status: Planned.** Reports are written by AI and sent automatically. No human approves them. No report code exists yet.

### 4.1 What a report is

- A PDF for one project, on one template.
- Numbers come from the database. An AI model writes the narrative text around them (4.4).
- Each report is saved (4.5). The owner and any extra recipients receive it.

### 4.2 Report types and triggers

| Type | Trigger | Period | Recipients | Plan |
|---|---|---|---|---|
| Automatic monthly | Scheduled, once a month | Last 30 days | Project owner, plus extra recipients | Sprouta and up |
| On demand | User clicks Generate | Last 15 days, last 30 days, or a custom range | The user, plus chosen recipients | Crestora and up |

Extra recipients are chosen from the project's users in Settings.

### 4.3 Report content

- Analytics from the GSC and GA4 cache (section 3.8).
- SEO activities for the period (section 3.9), including backlink checks (section 5.2).
- Leads for the period (section 3.10), with status counts (section 3.10 and section 9.7).
- DataForSEO data when the plan includes it: domain overview, keyword rank and volume, backlinks, on-page audit, local (section 5), AI visibility.

### 4.4 How the narrative is written

1. The server collects all numbers and facts for the period from the database. The fact set is stored with the report (4.5).
2. The model receives the fact set and writes the narrative text only.
3. Every number in the narrative is checked against the fact set. A mismatch triggers one regeneration. If it still fails, the report is sent with the template-only narrative and the failure is logged.
4. The model never fetches data itself.

### 4.5 Storage and retention

- Every report a user creates is stored, for each project and each user. Automatic reports are stored too.
- PDF files are stored in Cloudflare R2, which is already used for uploads. Report metadata, fact set and narrative text are stored in MongoDB.
- The stored fact set shows an old report exactly as it was sent, even after the data changes.
- Reports are kept while the project is active. The project owner can delete a single report. Deleting a project deletes all its reports.
- When a subscription ends, reports stay available read only for 12 months, then are deleted. The owner gets an email 30 days before deletion.

### 4.6 Permissions

- `reports.view`: read and download reports. Owner and project user.
- `reports.generate`: create an on-demand report. Owner by default.
- `reports.delete`: delete a single report. Owner by default.
- Automatic reports run for the project and need no permission.
- The permission catalog (`doc/rbac.md`) gets these three keys before reports ship.

### 4.7 Delivery

- Email with a link to the PDF, sent through the notification service (section 7).
- Every PDF download checks permissions. Links are not public.

### 4.8 Quality gate

The AI narrative is switched on only when all of these pass:

- An eval set of 30 to 50 past reports, with known correct numbers.
- Zero number mismatches across the eval set after step 3 of 4.4.
- A written prompt and a fixed model choice (section 6.6 for the model class).
- Cost per report measured in staging.

Until the gate passes, reports use the template-only narrative.

### 4.9 Cost

- Pay per use, billed to Crawllex's OpenAI account. No subscription line.
- Planning figure: about USD 0.01 per report (fact set around 10,000 input tokens, narrative around 1,500 output tokens, at a small-model rate of USD 0.20 input and USD 1.20 output per million tokens, with headroom).
- Confirmed in staging before the gate (4.8).

### 4.10 Build order

1. Fact set and PDF template, template-only narrative.
2. Storage in R2 and MongoDB, permission keys, on-demand generation.
3. Automatic monthly report and email delivery.
4. AI narrative, after the quality gate.

## 5. DataForSEO and local SEO

**Status: Planned.** The scope, data sources, caching rules and prices below are final for v2. Prices are list prices from DataForSEO's public pages, checked 2026-10-29. The planning basis for each price is stated in 5.7.

DataForSEO is the data source. Crawllex is the product. DataForSEO data goes into the existing screens where a user would look for it. Only the keyword tracking list is a new module (5.3), because it has its own list, schedule and cost.

Paid tiers only (section 2.2). DataForSEO data does not count toward the free project limit.

### 5.1 Scope for v2

1. **Domain overview:** traffic estimate, keyword count, history, competitors.
2. **Keyword tracking:** tracked list with daily rank checks and SERP features.
3. **Keyword volume check:** search volume, CPC, competition and trend.
4. **Backlinks:** summary, new and lost links, referring domains, anchors.
5. **On-page audit:** DataForSEO On-Page API, basic crawl.
6. **AI visibility:** how often the brand and domain appear in AI answers (LLM Mentions).
7. **Local SEO:** Google Business Profile (GBP) data, reviews and local map rank.

Merchant and App Data are not part of Crawllex.

### 5.2 Where each data type goes

| Data (DataForSEO API) | Where in Crawllex |
|---|---|
| Domain overview: traffic estimate, keyword count (Labs domain_rank_overview) | Analytics (3.8), "Market visibility" card |
| Traffic and rank history (Labs historical_rank_overview) | Analytics, "Market visibility" trend |
| Competitors and domain overlap (Labs competitors_domain, domain_intersection) | Analytics, "Competitors" tab |
| Backlink profile (Backlinks API) | Analytics, "Links" tab |
| Logged link work checked against backlink data | SEO activities (3.9): each backlink row shows found, live or lost |
| Keyword volume, CPC, competition, trend (Keywords Data, Google Ads) | "Keywords and Rankings" module (5.3) |
| Keyword ideas and related keywords (Labs keyword_ideas, related_keywords) | "Keywords and Rankings", research view |
| Tracked keyword rank and SERP features (SERP API, Google organic) | "Keywords and Rankings", tracked list |
| Ranking keyword discovery (Labs ranked_keywords) | "Keywords and Rankings", "Discovered" view |
| Search intent per keyword (Labs search_intent) | "Keywords and Rankings", intent column |
| On-page audit (On-Page API, basic crawl) | Analytics, "On-page" tab |
| AI visibility (LLM Mentions) | Analytics, "AI visibility" tab |
| GBP profile and reviews (Business Data) | Analytics, "Local" card, for projects with a GBP |
| Local map rank per keyword and location (SERP API, Google Maps) | Analytics, "Local" card |

### 5.3 Keywords and Rankings module

This is the only new DataForSEO module.

- **Purpose:** research keywords, keep one tracked list per project, and watch rank and SERP features over time.
- **Screens:** research (search, filters for volume, competition, intent, trend), tracked list, keyword detail (rank history, SERP features, who ranks above), discovered keywords (what the domain already ranks for).
- **Actions:** add or remove tracked keywords, run research, export, trigger a manual refresh (within the daily limit, 5.5).
- **Data:** tracked keywords per project, rank history per keyword, normalized keyword metrics, cache timestamps. Every row is filtered by `projectId`.
- **Permissions:**
  - `keywords.view`: read the tracked list, research results and rank history. Owner and project user.
  - `keywords.manage`: add or remove tracked keywords, run research, trigger a refresh. Owner by default.
  - Analytics tabs use the existing `analytics.view`. No new key.

### 5.4 Analytics link

- **Rank versus clicks.** Each tracked keyword shows the DataForSEO rank next to the GSC position and clicks for the same query. A large gap is flagged. Example: DataForSEO rank 4, GSC average position 11. The gap is a finding.
- **Volume versus impressions.** DataForSEO volume sits next to GSC impressions. High volume with low impressions shows demand the site is not reaching.
- **Estimated traffic is labelled "estimated".** The DataForSEO traffic estimate never joins a total with GSC or GA4 clicks. Both are shown side by side, each with its source.
- **Backlinks and logged work.** A backlink logged in SEO activities is matched by URL to the backlink data. The activity shows found, live or lost, with the date seen.

### 5.5 Caching policy

Pages read cache only. DataForSEO is called only by scheduled jobs and by manual refresh.

| Data | Refresh | Cache rule | History kept |
|---|---|---|---|
| Domain overview (Labs) | weekly | 7 days | Every weekly snapshot, 24 months |
| Historical rank | monthly | 30 days | Full series returned by DataForSEO |
| Competitors and intersection | monthly | 30 days | Latest snapshot |
| Keyword volume and CPC | monthly | 30 days | Latest value and the previous 12 values |
| Keyword research (ideas, related) | on demand | 30 days per query | Latest per query |
| Tracked keyword rank | daily (nightly job) | Until next run | 400 days |
| Ranked keyword discovery | weekly | 7 days | Latest snapshot |
| Backlinks summary, new and lost | weekly | 7 days | Each weekly diff, 24 months |
| Backlinks list, referring domains, anchors | monthly | 30 days | Latest snapshot |
| On-page audit | monthly | 30 days | Each monthly result, 12 months |
| AI visibility | weekly | 7 days | Each weekly result, 12 months |
| GBP profile and reviews | weekly | 7 days | Each weekly snapshot, 24 months |
| Local map rank | weekly | 7 days | Each weekly result, 24 months |

Rules for all jobs:

- Store normalized fields and `fetchedAt`. Keep the raw DataForSEO response for 7 days, for debugging only.
- Manual refresh: one per data type per project per day. Manual refresh is not charged in v2. Its cost is covered by the daily limit.
- A failed job keeps the last good cache and shows the cache date. A partial result never replaces a full snapshot.
- Nightly jobs use the Standard queue, not Live, to keep cost low. Standard queue turnaround is up to 45 minutes, fine for a nightly job.

### 5.6 Local SEO: Google Business Profile

GBP drives the local map pack and "near me" results. For a business with a physical location it is one of the main ranking and lead sources.

- **Read in v2 (DataForSEO Business Data API and SERP API):**
  - Profile data: name, category, address, phone, hours, website, status.
  - Reviews: count, average rating, new reviews, review text.
  - Local map rank: where the business shows for each tracked keyword and location.
- **Not in v2: writing to GBP.** Replying to reviews, editing the profile and posting updates need the Google Business Profile API with the owner's Google login. Crawllex does not ask clients for Google logins (section 1). GBP writes are a v3 topic, if a design with owner-approved OAuth is accepted.
- **Who sees it:** projects with a GBP ID set in project settings. Projects without one show nothing in the Local card.

### 5.7 Cost estimate: single project

Planning basis: one domain, 100 tracked keywords (Crestora), list prices, USD, before any discount. Monthly figures.

| Job | Frequency | Unit cost used (USD) | Units per month | Cost per month (USD) |
|---|---|---|---|---|
| Domain overview (Labs domain_rank_overview) | weekly | 0.012 + 0.00012 per item | 4.3 tasks, 1 item each | 0.05 |
| Historical rank (Labs historical_rank_overview) | monthly | 0.012 + 0.00012 per item | 1 task, about 36 items | 0.02 |
| Competitors and domain intersection (Labs) | monthly | 0.012 + 0.00012 per item | 2 tasks, about 110 items | 0.04 |
| Keyword volume check (Google Ads search_volume, Standard queue) | monthly, up to 1000 keywords per task | 0.06 per task | 1 task | 0.06 |
| Keyword ideas (Labs keyword_ideas, 1000 items) | 4 runs per month | 0.012 + 0.12 = 0.132 per run | 4 runs | 0.53 |
| Tracked keyword rank (SERP organic, Standard queue) | daily, 100 keywords | 0.0006 per SERP | 3,000 SERPs | 1.80 |
| Ranked keywords discovery (Labs ranked_keywords) | weekly, up to 1000 items | 0.012 + 0.12 = 0.132 per run | 4.3 runs | 0.57 |
| Backlinks summary | weekly | 0.024 per task | 4.3 tasks | 0.10 |
| New and lost backlinks | weekly, up to 1000 rows | 0.024 + 0.036 = 0.06 per task | 4.3 tasks | 0.26 |
| Backlinks list, referring domains, anchors | monthly, up to 1000 rows each | 0.06 per task | 3 tasks | 0.18 |
| On-page audit (On-Page API, basic crawl) | monthly, 50 pages | 0.00015 per page | 50 pages | 0.01 |
| AI visibility (LLM Mentions) | weekly, 100 rows per request | 0.10 per task + 0.001 per row | 4.3 tasks | 0.86 |
| Local: GBP profile (Business Data) | weekly | 0.0015 per profile | 4.3 tasks | 0.01 |
| Local: GBP reviews (Business Data Google Reviews) | monthly, 200 reviews | 0.00075 per 10 reviews | 20 blocks | 0.02 |
| Local: map rank (SERP Google Maps, Standard queue) | weekly, 100 keywords | 0.0006 per SERP | 430 SERPs | 0.26 |
| **Total, Crestora config (100 keywords)** | | | | **4.77** |

Results:

- **Crestora, 100 tracked keywords:** about **USD 4.80 per project per month**.
- **Peakra, 300 tracked keywords (daily rank, weekly map rank):** about **USD 8.90 per project per month**.
- **Live mode instead of Standard queue, 100 keywords daily:** about USD 6.00 for rank alone. The nightly job uses Standard queue for this reason.
- **Scale:** 10 Crestora projects is about USD 48 a month. 30 Peakra projects is about USD 267 a month. Pay as you go. DataForSEO asks for a USD 50 top-up to start.

Planning prices used, and their source:

- **Labs** (USD 0.012 per task + USD 0.00012 per item): DataForSEO's stated Labs price. Used for every Labs endpoint.
- **Keyword ideas and related keywords:** same Labs price. Keyword ideas accepts up to 200 seed keywords and returns up to 1000 items per call. Adding clickstream data doubles the price. Clickstream is not used.
- **Keyword volume** (USD 0.06 per task, Standard queue, up to 1000 keywords per task): Google Ads endpoint page. One task covers any number of keywords up to 1000.
- **SERP organic and Maps** (USD 0.0006 per SERP, Standard queue): SERP API and Google Maps SERP pricing pages. Pay-as-you-go, USD 50 minimum top-up.
- **Backlinks** (USD 0.024 per task + USD 0.000036 per row): Backlinks pricing page, July 2026 price.
- **On-page** (USD 0.00015 per page, basic): On-Page pricing page. The help center lists a lower USD 0.000125. The pricing page is the planning basis. Add-ons (JavaScript loading, browser rendering, screenshots) are not used.
- **LLM Mentions** (USD 0.10 per task + USD 0.001 per row): LLM Mentions pricing page. Billed for setting the task and for each row. ChatGPT and Google AI Overviews are both covered by the same endpoints. Earlier third-party figures (USD 0.02 per request, USD 0.00003 per row) are not used.
- **GBP profile** (USD 0.0015 per profile, Standard queue) and **Google Reviews** (USD 0.00075 per 10 reviews, Standard queue): Business Data pricing. The regular reviews endpoint has no task fee. The extended endpoint is not used.

### 5.8 Decisions

- **On-page audit:** DataForSEO On-Page now, monthly basic crawl, in the "On-page" tab. Lens (Appendix A) takes over on-page analysis in v3, after its own build. Both store findings in the same shape so the switch is simple.
- **AI visibility:** an "AI visibility" tab in v2, data from LLM Mentions. It is data, not an agent, so it is in v2.
- **Local:** a "Local" card in v2 for projects with a GBP. Read only (5.6).
- **Merchant and App Data:** not part of Crawllex.
- **Permissions and caching:** as in 5.3 and 5.5.
- **Limits per tier:** Crestora 100 tracked keywords per project, Peakra 300. Rank checked daily. Domain data weekly. Map rank weekly.
- **Keyword volume history:** 12 months per keyword, as shown on the product page. Used for the volume trend column.
- **Historical SERP data:** starts 2021-08-01, per the live endpoint documentation (checked 2026-10-29).

### 5.9 Build order

1. Analytics tabs that reuse the analytics page: market visibility, competitors, links.
2. On-page tab (monthly crawl).
3. Keywords and Rankings module.
4. Local card: GBP read, then map rank.
5. AI visibility tab.

## 6. Crawllex Insight AI assistant

**Status: Built** (single question, dashboard panel). **Planned** for v2: chat channel, answer routing, procedure docs and the OpenAI fallback. The chat is the same in the web app and the mobile app.

Today's build is on staging (crawllex-dev) and on the main branch since 2026-10-22. Production status is not confirmed.

### 6.1 Product

Crawllex Insight becomes a dedicated chat channel, like an LLM chat product:

- Users chat with it over long sessions, with saved threads and history.
- It answers questions about projects and SEO data: analytics, leads, SEO activities, reports and DataForSEO data (section 5).
- It generates reports on request through the Reports module (section 4).
- It answers how-to and procedure questions about Crawllex: adding a project, connecting GSC or GA4, importing leads, adding a lead integration, logging an activity, and so on.
- It answers general questions too, such as "what is SEO", from the OpenAI model (6.3).
- Answers about Crawllex data are project-scoped. A user sees only the projects they have access to (section 3.6).
- It is included on every tier (section 2.2). On Sprouta the OpenAI fallback is capped (6.6).

### 6.2 Name

The assistant is named **Oriel**. The name is short, easy to say in English and Arabic, and an architectural term for a window, which fits "insight". A knockout search on 2026-10-29 found no software product named Oriel. The formal trademark search is in the launch checklist (section 13).

Rejected after checks: Rexa (Rexa.ai, a voice-agent platform), Vira and Nimbo (existing AI products), Lumi (several existing AI products).

### 6.3 Answer routing

Every question goes through the same steps. A step runs only when the previous one finds nothing.

1. **Data.** The question is matched to a read-only tool (6.5) with a match score of at least 0.7. If matched, the tool runs and the answer comes from stored data only. Simple lookups need no model call.
2. **Procedures.** The question is matched to a documented Crawllex procedure (6.4) with a score of at least 0.7. If matched, the answer is the procedure text, with the steps and a link to the page where the task is done.
3. **Nothing found: OpenAI.** If neither step matches, the question is general. Example: "what is SEO" has no Crawllex data and no Crawllex procedure, so it goes to the OpenAI model. The model answers with the same read-only tools, and the answer is labelled "general answer, not from your data".

"Nothing found" means: no tool match at 0.7 or above, and no procedure match at 0.7 or above. The 0.7 threshold is set at build and tuned on the eval set (6.8).

Most questions are answered from Crawllex's own data and procedures at no model cost. OpenAI is used only for general questions and for questions outside the procedures.

### 6.4 Procedure docs

- Written in markdown in the repo under `doc/procedures/`, one file per task.
- First set: add a project, invite a member, connect GSC, connect GA4, import leads by CSV, set up the WordPress lead source, add a lead integration (webhook, Webflow, Shopify), log an SEO activity, generate a report, archive a lead.
- Owner: the product team. Each change to a module updates its procedure in the same change.
- Indexed at build time for step 2 of 6.3.

### 6.5 Tools (read-only, built)

| Tool | Permission | Returns |
|---|---|---|
| `get_leads_count` | `leads.view` | Count of leads in a date range, by status. No lead personal data |
| `get_analytics_overview` | `analytics.view` | GSC and GA4 totals for a date range |
| `get_analytics_top_dimensions` | `analytics.view` | Top rows (25 at most) of one dimension for one source |
| `get_seo_activity_counts` | `seo_activities.view` | Counts by activity type, optional range |

Tools added in v2 as their modules ship: report list, DataForSEO summaries (section 5), notifications. Every tool is read-only. No write tools exist. Dates must be ISO, `from` must not be after `to`, and the span is at most 366 days.

### 6.6 Model, caps and cost

- **Model class:** a small, low-cost model. Confirmed on OpenAI's pricing page (checked 2026-10-29): gpt-5.6-luna at USD 0.20 input, USD 0.02 cached input, USD 1.20 output per million tokens. The pricing page does not state zero data retention, so ZDR is requested through the account (10.8).
- **Model setting:** the model name is set in configuration (`OPENAI_MODEL`), so it can change without a code change.
- **Planning cost:** about USD 0.002 per answer (about 3,000 input tokens and 500 output tokens at USD 0.20 input and USD 1.20 output per million tokens, with headroom). Pay per use.
- **Caps per project per month:**

| Tier | OpenAI answers per project per month | Planning cost per project per month |
|---|---|---|
| Sprouta | 30 | about USD 0.06 |
| Crestora | 300 | about USD 0.60 |
| Peakra | 1,000 | about USD 2.00 |
| Ranovia | Custom | Custom |

- Answers from data and procedures (steps 1 and 2) are not capped. They use no model call.
- When a project reaches its cap, general questions get a clear message with the cap date. Data and procedure answers keep working.
- **Data use:** only the OpenAI API is used. Crawllex data is not used for model training. Zero data retention is requested from OpenAI where the account allows it.
- Only the question, the matched tool results and the procedure text go to the model. Lead personal data never goes to the model.

### 6.7 Chat channel: retention and visibility

- **Threads:** each user has threads per project. A thread stores the messages, the tools used and the source of each answer (data, procedure, or general).
- **Retention:** threads are kept for 90 days after the last message, then deleted. Users can delete a thread at any time, and deletion is immediate. Deleting a project deletes its threads.
- **Anonymous usage metrics** (question category, answer source, cap hits) are kept for 24 months without user ID or message text.
- **Visibility:** a thread is private to the user who started it. Project owners and members cannot read other people's threads. Crawllex staff have no access to thread text. A support request can give temporary access only with the user's consent, and each access is logged.
- **Notice:** the chat shows that messages are stored for 90 days and can be deleted at any time.
- **Mobile:** the same rules apply (section 8).

### 6.8 Quality and known limits

- **Eval set:** 30 to 50 questions with expected answers. It covers data, procedure and general questions. The routing thresholds and the quality gate for reports (4.8) use the same process.
- **Prompt injection:** the model is instructed to treat tool results and page text as data. Tool outputs are checked for instruction-like text before they reach the model. Search queries and page URLs are the highest-risk inputs.
- **Arabic:** answers are tested in Arabic before the Arabic UI ships.
- **Formatting:** the chat renders markdown (headings, lists, tables), with the links checked.
- **Cost checks:** the cost per answer is measured in staging and compared with 6.6.
- **Fallback:** if the model provider fails, the circuit breaker turns the model path off for 5 minutes per instance, and the user sees the data or procedure answer or a clear "try again later" message.

## 7. Notifications

**Status: Planned.** Decided design: an in-house notification module on an outbox pattern. Today there are only lifecycle emails (project approve, reject, activate and invite) sent through Zoho SMTP with nodemailer.

### 7.1 Events

| Event | Who gets it | Channels |
|---|---|---|
| Report ready or failed | Report owner and recipients | In app, email |
| New lead received | Project owner and members with `leads.view` | In app, email (daily digest option), mobile push |
| Lead integration failed or disconnected | Project owner | In app, email |
| SEO data refresh failed (GSC, GA4, DataForSEO) | Project owner | In app, email |
| Project status changed (approve, reject, activate, deactivate) | Project owner | Email (already sent), in app |
| Member invited or removed | Invitee, project owner | Email, in app |
| Chat report or long task finished | Requesting user | In app, mobile push |

### 7.2 Channels

- **In app:** bell in the web and mobile apps. Stored in MongoDB, with read state per user.
- **Email:** Zoho SMTP through nodemailer. Used for reports, failures and invitations.
- **Mobile push:** Expo Push (section 8), which uses FCM for Android and APNs for iOS.
- **Signed webhook to customer systems:** same signing as the lead webhook (section 9.1).

### 7.3 Design

- **Outbox:** each event writes a `notifications` record with a unique event ID. A worker sends each pending record through its channel.
- **Worker:** the existing nightly cron pattern (Vercel cron), plus a run every five minutes for urgent items. Retries with backoff. After five failures an item is marked failed and shown to the owner.
- **Idempotency:** the event ID prevents duplicate sends on retry.
- **Preferences:** per user, per event, per channel. An email digest option for leads.
- **Logging:** delivery status per item (sent, failed, retried). Message bodies with personal data are not logged.
- **Retention:** notification records are kept 90 days.

Why in-house: volume is small, data already sits in MongoDB, and email is already set up. An external service adds a vendor and a second copy of the data.

### 7.4 Providers

| Channel | Provider | Notes |
|---|---|---|
| Email | Zoho SMTP (existing) | No change |
| Mobile push | Expo Push | Wraps FCM and APNs |
| In app | MongoDB | Part of this module |

Novu was reviewed as an alternative. It is not used in v2. It is the first option to revisit if channels and templates grow beyond this list.

## 8. Mobile app, read only

**Status: Planned.** A small native mobile app, built in v2, read only. It lets users read all data, chat with the assistant and view reports. It cannot change anything.

### 8.1 Scope

- **Dashboard:** key results and SEO trend.
- **Analytics:** GSC and GA4 cards, trend, top queries and pages, and the DataForSEO tabs in the plan (section 5.2).
- **Leads:** list and detail, with status and archive view. Read only, so no status change.
- **SEO activities:** list and detail.
- **Reports:** list, view and download PDF. Generation stays on the web app, because it is an action.
- **Assistant:** chat, answers only. The tools are the same read-only tools as the web app (section 6.5).
- **Notifications:** in-app list. A push opens the matching screen.
- **Projects:** list and switch project.

Not in the app: create, edit, delete, invite, approve, integration setup, report generation, settings that change data, billing changes.

### 8.2 Framework

- **React Native with Expo, TypeScript.** One codebase for iOS and Android. The same language and API types as the web app. Expo Push for notifications.
- Swift and Kotlin were considered. Two codebases cost more and are not needed for a read-only app.
- Store accounts: Apple Developer and Google Play Console, held by the company (launch checklist).

### 8.3 Security and read-only enforcement

- **Read-only is enforced on the server, not only in the app.** Mobile sessions carry view-only permission keys (`dashboard.view`, `analytics.view`, `leads.view`, `seo_activities.view`, `reports.view`). Any write route returns 403 for these tokens, even if the app is modified.
- **Sessions:** the access token lasts 1 hour. The refresh token lasts 30 days, rolling, and is revoked on logout. Web sessions keep their current 24-hour tokens.
- **Storage:** tokens in the iOS Keychain and Android Keystore, never in plain storage.
- **Transport:** HTTPS only. Certificate pinning is not used in v2.
- **Assistant:** same rules as the web app (section 6.7). Lead personal data is not sent to the model.

### 8.4 API

- Reuses the existing `GET` routes under `/api/v1`. No new write routes are added for the app.
- One added endpoint: a mobile profile that returns the project list and permissions, to keep the app light.
- Lists are paginated, to limit mobile data use.

### 8.5 Release

- App name, icon and store listings: prepared with the launch checklist.
- Pages read cache only, so the app adds no DataForSEO or Google calls.

## 9. Lead integrations

**Status: Planned.** Today the only lead source is the WordPress plugin (section 3.10). v2 adds a generic webhook, Webflow and Shopify. All integrations are available on every tier, including Sprouta.

### 9.1 Generic webhook (first)

- **Endpoint:** `POST /api/v1/leads/webhook/{leadSourceKey}`. The source key is stored encrypted with `lib/crypto/secret-box.ts`, the same model as the WordPress lead source key.
- **Signing:** HMAC-SHA256 over the raw request body, with a per-source secret. The signature goes in a header. A missing or wrong signature is rejected and logged without the body.
- **Field mapping:** the owner maps the sender's fields to Crawllex fields (name, email, phone, message, source page) in a small UI. Unmapped fields go into a `details` object.
- **Dedupe:** the same rule as today (normalized email plus phone per project).
- **Rate limit:** per source key, in a shared store (section 11).
- Covers any platform that can send a webhook. Zapier, Make and n8n can bridge the rest.

### 9.2 Webflow

- Crawllex accepts only signed webhooks. Dashboard-created Webflow webhooks carry no signature headers, so Crawllex does not accept them.
- Signed webhooks carry `x-webflow-timestamp` (Unix time) and `x-webflow-signature`.
- Verification: HMAC-SHA256 over `timestamp + ":" + raw request body`, hex-encoded. Compare in constant time. Reject a request whose timestamp is more than 5 minutes from server time.
- Secret: for webhooks created through the Crawllex OAuth app, the OAuth client secret. For webhooks created with a site token after 14 April 2025, the per-webhook secret returned at creation.
- The `form_submission` event carries the form fields in its payload. The owner maps them with the same mapping UI as 9.1.
- The owner connects the Webflow site once, with a token or OAuth, from the integrations panel.

### 9.3 Shopify

- Shopify has no native lead form. Crawllex treats two things as leads: new customer records (`customers/create` webhook) and contact-form submissions sent by a form app the store uses.
- Each store installs a Crawllex app. Early clients use a custom app per store. A public app can follow after Shopify's review.
- Crawllex accepts only webhooks registered by its own app. Each delivery carries `X-Shopify-Hmac-SHA256`: base64-encoded HMAC-SHA256 over the raw request body, keyed with the app's client secret. Compare in constant time.
- Read the raw body before any JSON parsing. Re-serialized JSON changes the bytes and breaks the signature.
- Customer data is personal data. It follows the retention rule in section 10.8.

### 9.4 Other platforms

Wix, Squarespace, HubSpot and others use the generic webhook through Zapier, Make or n8n. A native connector is added only when demand justifies it.

### 9.5 Sources per tier

| Tier | Lead sources per project |
|---|---|
| Sprouta | 2 |
| Crestora | 5 |
| Peakra | 15 |
| Ranovia | Unlimited |

All integration types are available on every tier. Only the number of sources differs.

### 9.6 Build order

1. Generic webhook with signing and field mapping.
2. Webflow, using the verified signature format in 9.2.
3. Shopify, using the verified format in 9.3.
4. Each integration is tested on one live client site before it is released to all tiers.

### 9.7 Lead status and archive

Lead status is planned for v2. Today leads have no status (section 3.10).

- **Statuses:** New, In progress, Closed, Archived.
- **Closing:** a closed lead needs an outcome: Won, Lost, or Not a lead (spam, duplicate, test).
- **Archive:** archived leads leave the default lists and the dashboard counts. They stay searchable and exportable, and can be unarchived. Archiving is not deletion.
- **Dashboard:** shows New and In progress counts for the period. Closed and archived leads leave the dashboard counts.
- **Retention:** lead records follow the project's data rules (section 10.8). Archived leads are kept for 24 months, then deleted unless the owner keeps them.
- **Permissions:** changing status needs `leads.update`. Archive and unarchive need `leads.update`. Owners have it by default.

## 10. Shared platform: access, data, integrations, security

**Status: Built.** The parts below are in code.

### 10.1 Access

- Two layers. Platform: super admin is stored on the user record only. Project: roles attach per project through a membership.
- Every project route checks project permissions. Every project query filters by project.
- Full rules: sections 3.4 and 3.6.

### 10.2 Data and environments

- Database: MongoDB through Mongoose. File storage: Cloudflare R2. Email: Zoho SMTP.
- Analytics: daily cache per project. Pages read the cache only. Google is called only by sync (connect, manual refresh, nightly cron).
- Environments: production on Hostinger. Staging on Vercel (crawllex-dev). Local development uses the testing database. Local tools never touch production.

### 10.3 Integrations

- Google Search Console and GA4: read through a Google service account. Clients never give Google logins.
- WordPress: REST client for lead sources and draft pushes.
- OpenRouter: assistant model (section 6). Optional.

### 10.4 Security

- Server-readable secrets (lead source keys, WordPress application passwords) are encrypted with AES-256-GCM. The key comes from the server environment. Secrets are never returned in API responses.
- Sessions: opaque bearer tokens. Only the SHA-256 hash is stored. Lifetime 24 hours.
- WordPress: HTTPS only, redirects refused. Crawllex never publishes. Every push is a draft.
- Assistant: read-only tools. Lead personal data never goes to the model.

### 10.5 Audit logging

- Logged: sign-in, failed sign-in, role and membership changes, project status changes, lead status and archive changes, report deletes, integration connects and disconnects, staff access to customer data.
- Each log entry: time, actor, action, project or account, result. No message bodies and no personal data beyond the actor ID.
- Logs are kept 12 months, then deleted. Read access is limited to the platform admin role.

### 10.6 Billing and account model

**Account.** A customer is an account, the billing entity. An account has members and owns projects. Today RBAC has no organization level (rbac.md). This design adds one.

- **Account:** name, billing contact, plan, billing status, tax details, created date.
- **Membership:** a user belongs to one or more accounts. Each account membership has an account role: `account_owner` (billing and plan), `account_admin` (projects and members), `account_member` (no billing).
- **Projects** belong to exactly one account. Project roles (section 3.4) stay as they are.
- **Read-only members:** no extra seat fee for users with view-only project roles. Seat limits are not used. This is a deliberate difference from seat-priced suites.
- **Super admin** stays on the user record (platform rule: `super_admin` lives only on the user record). It is not an account role.

**Plan rules.**
- Limits are checked per account: projects, keywords (per project), OpenAI answers (per project), reports (on demand).
- An upgrade takes effect at once and is prorated.
- A downgrade takes effect at the end of the billing period. Before it, the owner must archive projects above the new limit. Archived projects stay readable.
- Cancellation takes effect at the end of the period. Data stays read-only for 12 months, then is deleted (D37, section 4.5).

**Trials.** As in 2.6. The trial starts on account creation and needs no card.

**Payment provider.** Decision: use a merchant-of-record (MoR) provider, so the provider handles sales tax and VAT and invoices. Recommended: Paddle. Reason: one secondary source says it onboards sellers from any non-sanctioned country and handles VAT, GST and US sales tax. Lemon Squeezy has conflicting payout information for Pakistan. Stripe's Pakistan support is not confirmed on its official site. Stripe stays the fallback if the MoR route is closed. The owner confirms the provider with the vendor before launch (13.2).

**Billing flow.**
1. Owner picks a plan on the billing page. The MoR provider checkout runs.
2. Webhook from the provider confirms payment. The account plan is updated.
3. Failed payment: 7-day grace with an in-app notice and email (section 7). Then the account moves to Sprouta limits. No data is deleted.

**Invoices and tax.** Issued by the MoR provider. The account stores the invoice link. Tax identity is collected at checkout.

**Pricing changes.** Existing accounts keep their price for 12 months after a public price change, then move at renewal, with 30 days' notice.

### 10.7 Support, SLA and operations

**Support channels.**
- Sprouta: help centre (procedure docs, 6.4) and the assistant. Email for account and billing questions.
- Crestora and Peakra: email and in-app ticket.
- Ranovia: named contact, phone or video call.

**Response targets (first response, business days, Monday to Friday, Pakistan time unless the owner sets another zone):**

| Tier | Target |
|---|---|
| Sprouta | 2 business days (best effort) |
| Crestora | 1 business day |
| Peakra | 4 business hours |
| Ranovia | As contracted |

**Availability.** Target 99.5% monthly uptime for the web app and API. Scheduled maintenance outside business hours and announced 48 hours ahead.

**Incidents.**
- Severity 1: platform down or data loss risk. Acknowledged within 1 hour, status page updated, post-incident report within 5 business days.
- Severity 2: a module down or a sync failing for many projects. Acknowledged within 4 hours.
- Severity 3: one project or one feature. Handled in the normal queue.

**Backups and recovery.**
- MongoDB Atlas: continuous backup with point-in-time restore on a paid cluster tier. Target: recovery point 1 hour, recovery time 4 hours.
- Cloudflare R2 (report PDFs, uploads): object versioning on, with a lifecycle rule for deleted items.
- Restore drill: once per quarter, recorded.

**Monitoring.**
- Uptime checks on the web app, API, and each cron job (the nightly sync and the notification worker).
- Error tracking for the web app and the API.
- Cost alerts: DataForSEO and OpenAI spend against a monthly budget, with an alert at 80% of budget.
- A status page for customers.

**Staff access.** Least privilege. Production database access needs a named account and is logged. No shared credentials.

**Operational budget.** Support and on-call staffing are owner decisions (13.2). The targets above assume at least one trained support person and one on-call engineer.

### 10.8 Compliance outline

This outline is not legal advice. A lawyer reviews it before launch (13.2).

**Roles.** For client data (GSC, GA4, leads, activities, reports), the customer is the controller and Crawllex is the processor. For account data (name, email, billing contact), Crawllex is the controller.

**Customer agreement.** Terms of service and a data processing agreement (DPA) signed with each account. The DPA lists the sub-processors below.

**Sub-processors (planned list):**

| Sub-processor | Purpose | Data | Location (to confirm) |
|---|---|---|---|
| Vercel | Web hosting and cron (staging, and production if used) | Request data | Per Vercel region |
| Hostinger | Production hosting (current) | Request data | Per plan |
| MongoDB Atlas | Database | All application data | Choose an EU or other region (10.8 residency) |
| Cloudflare R2 | Files and report PDFs | Reports, uploads | Set a jurisdiction (10.8 residency) |
| Zoho | Transactional email | Email address, message content | Per Zoho data centre |
| OpenAI | Assistant fallback and report narrative | Question, matched tool results, procedure text. No lead personal data | US (see transfers) |
| OpenRouter | Assistant (current, being replaced) | As OpenAI | US. Removed when OpenAI is live |
| DataForSEO | Domain, keyword, backlink, on-page, local data | Domain and keyword names. No personal data | Public, no customer personal data |
| Expo | Mobile push delivery | Device push token | Per Expo infrastructure |
| Payment provider (MoR) | Billing and invoices | Billing contact and tax identity | Per provider |

**Transfers.** OpenAI, DataForSEO and the payment provider are outside the EU and most of the region. Transfers rely on the providers' data processing terms and on standard contractual clauses or the EU-US Data Privacy Framework, where the provider is certified. MongoDB is certified under the EU-US Data Privacy Framework (its DPA, checked 2026-10-29).

**Residency decision (owner, before the first paid DPA).** Choose the MongoDB Atlas region and the R2 jurisdiction. Both affect where customer data is stored. The choice is needed before paid customers sign a DPA.

**Data subject rights.** Access and export of a person's data, correction, and deletion within 30 days of a verified request. Deletion removes the person's leads, chat messages and notification records, and keeps anonymous aggregate metrics only.

**Retention (summary):**

| Data | Retention |
|---|---|
| Client analytics cache | While the project is active. Weekly or monthly refresh |
| Keyword rank history | 400 days |
| Leads | While the project is active. Archived leads kept 24 months |
| Reports | While the project is active. 12 months read-only after a subscription ends |
| Chat threads | 90 days after last message, or until the user deletes them |
| Chat usage metrics (no text) | 24 months |
| Notification records | 90 days |
| Raw DataForSEO responses | 7 days |
| Account and billing records | As required by tax law after the account closes |

**Consent.** Google access (GSC, GA4) is granted by the customer through the service account flow. The customer confirms they have the right to add the property. Lead collection through forms needs the website owner to add a consent notice. The WordPress plugin and the webhook docs must say so.

**Regional laws to review (legal, not decided here).** The EU GDPR. Arabic-market rules such as Saudi Arabia's PDPL and the UAE's PDPL. Pakistan's personal data protection law, whose current status must be checked. Each needs a lawyer's check before the matching market is opened.

## 11. Known gaps and build backlog

These are known issues in the current build or in the plan. Each one is a build task, not a product decision. Each has a planned phase.

| Gap | Phase | Task |
|---|---|---|
| Rate limiter is in memory, per server instance | Phase 1 (hardening) | Move to a shared store |
| Lint: 48 problems (24 errors, 24 warnings), mostly React compiler rules from `eslint-config-next` 16 | Phase 1 | Fix before the next release |
| `.env.production.local` and Vercel environment values differ in 13 places | Phase 1 | Reconcile and document one source |
| WordPress: application password not deleted on disconnect | Phase 1 | Delete on disconnect |
| WordPress: a timeout can create a duplicate post | Phase 1 | Idempotent push with a stored post ID |
| WordPress: Rank Math meta not sent; Arabic strings not reviewed | Phase 1 | Add meta; Arabic review |
| Timezone and project settings (name, domain, branding from the old module spec) not verified | Phase 1 | Verify and fix against the spec |
| Assistant: no eval set, no per-project quota, no persistent chat history, circuit breaker per instance | Phase 2 (assistant) | Build with section 6 |
| AI reports: no eval set yet | Phase 2 (reports) | Build the eval set (4.8) |
| Analytics: GSC and GA4 read from cache only; new DataForSEO tabs follow the same rule | Phase 2 | Keep the rule in every new tab (5.5) |
| Mobile app: no refresh tokens yet | Phase 4 (mobile) | Build refresh tokens (8.3) |
| Notification module not built | Phase 2 | Build section 7 |
| Lead integrations: WordPress only | Phase 3 | Build section 9 |
| Lead status not in the data model | Phase 3 | Build section 9.7 |
| Billing: payment provider, invoices, trials, upgrades, downgrades, cancellation | Phase 5 (billing) | Designed in 10.6. Build after prices are set |
| Account model: how a paying customer maps to users and projects | Phase 5 | Designed in 10.6. Build with billing |
| Non-functional: uptime, backups, monitoring | Phase 1 | Targets set in 10.7. Build the monitoring and backup setup |

### 11.1 Known limits of the built product

- Leads: one lead source per project today (section 9.5 lifts this).
- Assistant: single question only, answers are plain text, no chat history (section 6 lifts this).
- Reports: none built (section 4).
- Tests: 1076 passing in Crawllex (dev, 2026-10-22). Rerun before each release.

## 12. Decision log (v2, final)

Every product decision for v2 is listed here. Each row is decided. The only items the owner sets are the prices (D12), because they are a business choice.

| ID | Decision | Section |
|---|---|---|
| D8 | Free tier (Sprouta) automatic monthly report covers the last 30 days | 2.2, 4.2 |
| D9 | Leads, lead integrations and the assistant are included on Sprouta | 2.2, 6.1 |
| D11 | Unused credits expire. Credits are a v3 topic | 2.3, Appendix A |
| D12 | Prices for Crestora and Peakra are set by the owner. Launch needs them | 2.1, 13 |
| D13 | Tier names Sprouta, Crestora, Peakra, Ranovia. Trademark search in the launch checklist | 2.1, 13 |
| D14 | AI writes report narratives automatically. No human approval. Number check and quality gate apply | 4.4, 4.8 |
| D15 | OpenAI API, pay per use, small model class, caps in 6.6, no training on Crawllex data | 6.6 |
| D19 | Lead statuses New, In progress, Closed (with outcome), Archived. Archive is reversible | 9.7 |
| D21 | "Nothing found" means no tool match and no procedure match, both at score 0.7 or above. General questions go to OpenAI | 6.3 |
| D22 | Chat threads kept 90 days, deletable at any time, private to the user. Usage metrics kept 24 months without text | 6.7 |
| D23 | On-page audit: DataForSEO On-Page now. Lens takes over in v3 | 5.8 |
| D24 | AI visibility: Analytics tab in v2, data from LLM Mentions | 5.8 |
| D25 | Limits: Crestora 100 keywords, Peakra 300, daily rank, weekly domain and map data | 5.8 |
| D26 | Local SEO (GBP read and map rank) in v2, read only | 5.6, 5.8 |
| D27 | Merchant and App Data are not part of Crawllex | 5.1 |
| D28 | Notifications: in-house outbox module, Zoho SMTP email, in-app, Expo push | 7 |
| D29 | Mobile push through Expo Push | 7.4, 8.2 |
| D30 | Mobile app: React Native with Expo, read only | 8.2 |
| D31 | Assistant name Oriel. Trademark search in the launch checklist | 6.2, 13 |
| D35 | Lead sources per tier: Sprouta 2, Crestora 5, Peakra 15, Ranovia unlimited. All integrations on every tier | 9.5 |
| D37 | Reports kept while the project is active. Owner can delete a single report. Read-only for 12 months after a subscription ends, then deleted | 4.5 |
| D38 | GBP writes are not part of v2 | 5.6 |
| D39 | Mobile sessions: access token 1 hour, refresh token 30 days rolling | 8.3 |
| D40 | Lead integrations: generic webhook first, then Webflow and Shopify with the signing rules in 9.2 and 9.3 | 9 |

Pricing choices that follow from this log: OpenAI planning cost about USD 0.002 per assistant answer and about USD 0.01 per report (6.6, 4.9). DataForSEO planning cost about USD 4.80 per Crestora project per month (5.7).

## 13. Roadmap and launch checklist

### 13.1 Roadmap (v2, no dates)

Order is by dependency. Each phase finishes before the next one starts, except where noted.

1. **Phase 1, hardening:** shared rate limiter, lint, environment reconciliation, WordPress fixes, settings verification, monitoring and uptime targets (sections 10.7 and 11).
2. **Phase 2, notifications, reports and assistant:** notification module (section 7), reports with template narrative, storage and automatic monthly report (section 4), AI narrative after the quality gate, assistant chat with routing and procedure docs (section 6).
3. **Phase 3, data and integrations:** DataForSEO analytics tabs, keyword tracking module, on-page tab, local card, AI visibility tab (section 5). Lead status and generic webhook, then Webflow and Shopify (section 9).
4. **Phase 4, mobile app:** refresh tokens, read-only API profile, iOS and Android builds (section 8).
5. **Phase 5, billing and account model:** prices set by the owner (D12), payment provider, plan changes, account model (section 10.6).
6. **Launch.**

Agents (Lens, Radar, Compass, Connect) and agent credits are v3 (Appendix A).

### 13.2 Launch checklist

Launch tasks. Each one is a check or a sign-off, not a product design choice.

- **Owner:** set prices (D12).
- **Owner:** confirm the payment provider with the vendor. Recommended: Paddle (10.6). Stripe is the fallback.
- **Owner:** choose the MongoDB Atlas region and the R2 jurisdiction (10.8). Needed before the first paid DPA.
- **Owner:** staffing for support and on-call (10.7).
- **Lawyer:** review the DPA, terms of service and the regional laws listed in 10.8.
- **Trademark search** (formal registry search, not a web search) for Sprouta, Crestora, Peakra, Ranovia and Oriel.
- **Brand clearance** for the Crawllex name. Earlier web searches found several close crawler names (Crawlix, CrawlX, Crawlfix, Crawlyx, Crawlux, Crawlinx).
- **Store accounts:** Apple Developer and Google Play Console for the mobile app.
- **Check the OpenAI account** settings for zero data retention, if the account allows it.

## 14. Sources

Sources used for this document:

- Crawllex repo, branch `dev`: code and `doc/` (modules, architecture, RBAC, API, assistant AI, migration, roadmaps, service tokens).
- `doc/source/SEO Dashboard - By Modules.md`: original module spec (1 to 12).
- `doc/source/Crawllex — Product Manual.md`: product manual.
- `doc/migration.md`: status tracker and known issues.
- `/mnt/projects/docs/gdocs-context/`: crawllex-product-manual.txt, crawllex-v2-features.txt, crawllex-lens-doc.txt.
- Lens repo `crawllex-lens`: status and decision documents, used for Appendix A.
- DataForSEO public pricing and docs, checked 2026-10-29: SERP API (organic and Google Maps), Keywords Data (Google Ads), Labs (domain, keyword ideas, related keywords), Backlinks, On-Page, LLM Mentions, Business Data (Google Reviews, GBP profile).
- Chat data retention: GDPR storage-limitation principle. Retention periods are a design choice (6.7).
- Name knockout searches, 2026-10-29. Not a trademark clearance.
- OpenAI API pricing page, checked 2026-10-29 (official).
- Webflow webhook documentation, checked 2026-10-29 (official).
- Shopify webhook HTTPS documentation, checked 2026-10-29 (official).
- Payment provider availability for Pakistan (Paddle, Lemon Squeezy, Stripe): secondary sources, October 2026. Vendor confirmation is a launch task.
- Competitor and agency price anchors: secondary sources, October 2026. Re-check on vendor sites before any public use.
- MongoDB DPA and GDPR pages (checked 2026-10-29). Cloudflare R2 jurisdiction not found in search. Check the Cloudflare R2 documentation before launch.
- Old roadmap docs: `doc/roadmap-automated-client-reporting.md` (superseded by section 4) and `doc/roadmap-woocommerce-store-kpis.md`.
- Owner decisions from the 2026-10-29 briefs.

Upkeep: edit this document inline. Status changes must cite a source above. Re-check the status matrix before each review. No dates until the owner sets them.

## Appendix A. Agents and credits (v3 plan)

This appendix describes the v3 plan. It is not part of the v2 build. AI agents move to their own document when v3 starts.

### A.1 Lens (v3)

An AI-assisted website audit agent. Lens crawls a client site and checks UI, SEO setup, availability and fix verification. It runs as its own service, in its own repo, and reads Crawllex through a read-only connector with a project allowlist. Lens takes over on-page analysis from DataForSEO in v3 (section 5.8).

Lens has its own build plan (storage, crawl budgets, worker, local API, availability probes, fix verification, notifications). Its first test was on one live site.

### A.2 Radar (v3)

A competitor and market watch agent. It finds new competitors, keyword movement, new competitor pages, and outreach candidates. Data comes from the DataForSEO data built in v2 (section 5), so Radar adds analysis rather than new data sources.

### A.3 Compass (v3)

A planning agent. It turns website findings (from Lens), competitor movement (from Radar), analytics and leads into a weekly action plan. Compass depends on Lens and Radar.

### A.4 Connect (v3)

An inquiry agent. It acknowledges inquiries automatically (only where the owner allows it), asks qualifying questions, sends follow-ups, and hands over to a person. It depends on the email channel and the lead status model (section 9.7), and needs a consent process for contacting people.

### A.5 Agent credits (v3)

- One credit equals one unit of agent work. The unit and the cost per run are set during agent R&D.
- Each tier gets a monthly allowance. Extra credits are sold pay per use.
- Unused credits expire at the end of the period (D11).
- The free tier (Sprouta) has no agents and no credits.

### A.6 v3 backlog from v2 decisions

- Lens dashboard inside Crawllex (needs the Crawllex UI change to be agreed).
- Lens alerts through a signed webhook (the v2 notification module covers in-app and email alerts).
- GBP writes (replies, profile edits, posts) with owner-approved OAuth (D38).

