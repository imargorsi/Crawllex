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

