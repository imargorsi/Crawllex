## 7. Capabilities

### 7.1 Authentication

Secure account access for all users.

Includes: registration, login / logout, email verification, forgot / reset password, and inactive-account enforcement (inactive users cannot sign in).

Business value: Protects client data and ensures only verified, active accounts use the platform.

### 7.2 Project Onboarding

Guided setup when creating a client workspace.

Captures:

Business identity (name, website, optional logo, address, contact)

Services / products and primary promotion focus

Ideal customer profile and target locations

SEO goals (for example brand visibility, leads, local presence, outrank competitors, online sales)

Competitor URLs / names

Business value: Standardizes how every client engagement starts and captures the context SEO teams need before delivery begins.

### 7.3 Project Management

Day-to-day management of project records and lifecycle.

Includes: project list and detail, edit business fields, sidebar project selector, operator approve / reject / deactivate / activate, and owner reassignment.

Business value: Operators keep a clean portfolio of clients; owners keep business context up to date; everyone works in the correct project context.

### 7.4 Users, Roles & Permissions

Platform administration for people and permission templates.

Includes:

User list, create, edit, activate / deactivate, delete inactive users

Role templates: create, view, edit, permission matrix, activate / deactivate, delete inactive custom roles

Fixed permission catalog (operators assign from a defined set — they do not invent arbitrary permissions)

Assign members to projects with the appropriate project role (including custom roles such as SEO Lead)

There is no separate “companies / orgs” hierarchy — access is always project-based.

Business value: Agencies model roles such as “SEO Manager” or “Client Viewer” and control who exists on the platform.

### 7.5 Project Members

Invite collaborators into a specific project.

Flow: owner (or authorized member) searches registered verified users → invite email + in-app accept / decline → active membership appears in the project selector, with the assigned project role.

Business value: Client stakeholders and internal staff join the right workspace without sharing logins.

### 7.6 Project Access Control

Module visibility and actions follow the selected project and the member’s role. Navigation stays gated until a project is chosen (except platform admin tools).

Business value: Prevents cross-client data exposure and keeps the UI honest about what each person can do.

### 7.7 Dashboard Overview

The home experience after selecting a project — summary widgets, navigation shell, and at-a-glance health of the engagement.

Business value: A single “pulse” view for owners and clients before diving into Analytics, Activities, or Leads.

### 7.8 Performance Analytics

Client-facing performance fed by Google Search Console and Google Analytics 4.

What users see (with Analytics View):

Shared date range (for example last 15 / 30 / 90 days, this / last month)

GSC summary cards (clicks, impressions, CTR, average position)

SEO performance trend and traffic-source breakdown

Top queries and top pages

Country demographics with world map

Excel export of the current view

How data gets in:

1. An authorized team member connects the project’s GSC site and GA4 property under Settings → Integrations

2. The platform keeps the data up to date from Google, so users always see the latest synced figures

Business value: One branded analytics experience per client without handing out Google logins.

### 7.9 SEO Activities

In-app log of SEO delivery work for the selected project.

| Type | Purpose |
|---|---|
| Blogs | Published content (title + URL + date) |
| Backlinks | Acquired links (anchor text + URL + date) |
| Technical Work | On-site / technical notes (details + URL + date) |

Includes: list with type tabs, date filters, summary cards, quick add / edit / delete (permission-gated), and Excel / CSV export of the filtered tab.

Product rule: activities are manual. They are not imported from Google Sheets or other spreadsheets.

Business value: An auditable delivery trail agencies can show clients or export for reporting.

### 7.10 Lead Tracking

Track inbound inquiries for the selected project: list, detail, status lifecycle, and filters — so SEO work and inquiry volume live in the same workspace.

#### Capture Channels

| Channel | How It Works |
|---|---|
| CSV Import | Upload a lead export; the system auto-maps columns; the user confirms; valid rows import into the project |
| WordPress Plugin | Install the Crawllex plugin on the client site; connect with a Lead Source Key; form submissions flow into the project automatically |

#### CSV Import Flow

1. Select an Active project

2. Upload a CSV → preview the first rows

3. Confirm auto-detected column mappings (smart aliases; change or ignore any column)

4. Review the pre-import summary (totals, warnings, duplicates)

5. Import — leads appear in the project Leads module

Duplicate rule: same email and phone already on that project, or twice in the same file.Format: CSV (Save As CSV from Excel is supported).Project gate: import only when the project is Active.

#### WordPress Capture Flow

1. Project is Active

2. Create a Lead Source under Leads (website connection) and copy the Lead Source Key (shown once)

3. Install the plugin and enter Dashboard URL + Lead Source Key

4. Test Connection, then supported forms (Contact Form 7, WPForms, Gravity Forms, Fluent Forms, Elementor Forms) send submissions into Crawllex

One project can have multiple Lead Sources (main site, landing pages, staging) with separate keys — without creating separate projects. WordPress keys live under Leads, not under Google Integrations.

Business value: Tie SEO outcomes to inquiry volume — import existing exports first, then automate WordPress capture.

### 7.11 Settings

| Area | Who |
|---|---|
| Edit profile & change password | All users |
| Theme packs & font packs | All users |
| Light / dark mode | All users |
| Google Integrations (GSC / GA4) | Authorized project members |
| Profile photo management | All users |

Business value: Professional presentation for clients; data sources connected without leaving the product.
