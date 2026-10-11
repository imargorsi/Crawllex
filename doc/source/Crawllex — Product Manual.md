# Crawllex — Product Manual

SEO Dashboard for agencies and in-house SEO teams

This manual describes the Crawllex product: what it is, who it is for, how workspaces and access work, and how each capability is used.

## 1. What Is Crawllex?

Crawllex is a multi-client SEO operations platform. Each client website is its own project workspace. An agency runs many clients in one place, controls who sees what per project, and presents a clean client-ready view of performance, delivery, and leads — without sharing Google logins or internal admin tools with clients.

### Core Capabilities

Capability

What It Does

Secure Accounts

Registration, login, email verification, password recovery, and profile management

Project Workspaces

One isolated workspace per client / website

Project Onboarding

Guided setup for business info, services, SEO goals, locations, and competitors

Project Lifecycle

Approve, reject, pause, or reactivate projects

Roles & Permissions

Reusable project role templates and a permission matrix

Team Collaboration

Invite members to a project with project-scoped access

Dashboard Overview

Project home with summary widgets and engagement health

Performance Analytics

Search Console + GA4 KPIs, trends, queries, pages, demographics, and export

SEO Activities

Log and export blogs, backlinks, and technical work

Lead Tracking

Capture and manage inquiries per project (CSV import, then WordPress automation)

Google Integrations

Link GSC site and GA4 property per project; clients only consume the data

Settings & Personalization

Profile, password, theme packs, and font packs

### Platform Stack

Layer

Choice

Application

Modern web app (Next.js, TypeScript)

Data

MongoDB with secured REST APIs

Analytics sources

Google Search Console + Google Analytics 4 (agency Service Account)

Files

Cloudflare R2 (profile photos, project logos)

Email

Transactional email (verification, password reset, invites)

## 2. The Problem Crawllex Solves

SEO agencies typically run client work across scattered tools:

Pain

Without A Unified Platform

Performance data

Separate GSC / GA4 logins per client; hard to share a polished view

Delivery tracking

Spreadsheets or ad-hoc notes for blogs, links, and technical work

Lead inquiries

Form or sheet exports scattered per client; hard to see inquiry volume next to SEO work

Access control

Shared passwords or overly broad tool access

Client reporting

Manual copy/paste into decks or sheets every month

Scale

Each new client adds more accounts, sheets, and process debt

Crawllex centralizes project setup, permissions, analytics, delivery logging, and lead tracking in one dashboard with clear project isolation.

## 3. Who It Serves

Persona

Role In The Product

Agency / Platform Operator (Super Admin)

Approves projects, manages users and role templates, oversees the platform

Project Owner

Owns a client workspace; edits the project profile; invites the team; full operational access when the project is active

Project Member / Collaborator

Access based on the role assigned for that project only (for example, SEO Lead on three clients, viewer on others)

Client Stakeholder

Invited with view-oriented access to performance, activities, and leads

## 4. Product Principles

1. One project = one client workspace — data never mixes across projects.

2. Select a project first — the team chooses which client they are working on before using operational modules.

3. Clients consume Google data; the team configures it — Search Console and GA4 are linked by authorized project members. Clients never need Google credentials.

4. Permissions are project-scoped — the same person can be owner on one project and a restricted collaborator on another.

5. Approval gate for quality — user-created projects start as Pending until an operator activates them.

6. SEO activities are logged in-app — delivery work is entered manually (not synced from Google Sheets).

7. Leads are project-scoped — inquiry tracking belongs to the selected project.

## 5. How The Product Works

Sign Up / Login              │              ▼        Create First Project (onboarding)  ──►  Status: Pending Approval              │              ▼        Platform Operator Approves Project  ──►  Status: Active              │              ▼        Team Links GSC + GA4 (Settings → Integrations)              │              ▼        Owner Invites Team Members              │              ▼        Team Selects Project In Sidebar              │              ├──► Dashboard Overview              ├──► Analytics (read cached performance)              ├──► SEO Activities (log & export delivery work)              └──► Leads (CSV import · WordPress capture)

### Project Lifecycle

Status

Meaning

Pending

Submitted; waiting for operator review. Owners can still edit the profile and invite members. Operational modules stay limited until active.

Active

Approved and live. Members get their role-based module access.

Inactive

Paused by an operator. Membership remains; operational access is restricted.

Rejected

Closed — the project is not available for operational work.

Operators may also create a project as Active immediately and assign an owner.

## 6. Access & Governance

### Two Layers Of Authority

Layer

Who

What They Control

Platform

Super Admin

Users, role templates, project approval and lifecycle

Project

Owner, custom roles, members

What that person can do inside one selected project

### Default Project Roles

Role

Typical Intent

Project Owner

Full operational access for that project, including inviting and removing members

Project User

View-oriented access (for example analytics, activities, and leads; no invite/remove by default)

Custom Roles

Templates created by Super Admin with a chosen permission mix (for example “SEO Lead” or “Client Viewer”)

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

2. The platform syncs data into an internal cache (initial ~90-day backfill, then incremental updates)

3. Users only read the cache — pages do not call Google live on every visit

Business value: One branded analytics experience per client without handing out Google logins.

### 7.9 SEO Activities

In-app log of SEO delivery work for the selected project.

Type

Purpose

Blogs

Published content (title + URL + date)

Backlinks

Acquired links (anchor text + URL + date)

Technical Work

On-site / technical notes (details + URL + date)

Includes: list with type tabs, date filters, summary cards, quick add / edit / delete (permission-gated), and Excel / CSV export of the filtered tab.

Product rule: activities are manual. They are not imported from Google Sheets or other spreadsheets.

Business value: An auditable delivery trail agencies can show clients or export for reporting.

### 7.10 Lead Tracking

Track inbound inquiries for the selected project: list, detail, status lifecycle, and filters — so SEO work and inquiry volume live in the same workspace.

#### Capture Channels

Channel

How It Works

CSV Import

Upload a lead export; the system auto-maps columns; the user confirms; valid rows import into the project

WordPress Plugin

Install the Crawllex plugin on the client site; connect with a Lead Source Key; form submissions flow into the project automatically

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

Area

Who

Edit profile & change password

All users

Theme packs & font packs

All users

Light / dark mode

All users

Google Integrations (GSC / GA4)

Authorized project members

Profile photo management

All users

Business value: Professional presentation for clients; data sources connected without leaving the product.

## 8. Integrations

Integration

Purpose

Who Configures

Who Uses The Results

Google Search Console

Search clicks, impressions, queries, pages, devices, countries

Authorized project members

Members with Analytics View

Google Analytics 4

Sessions, users, channels, landing pages, countries

Authorized project members

Members with Analytics View

CSV Lead Import

Upload lead exports into project Leads with smart column mapping

Members who can create leads

Members who can view leads

WordPress Lead Capture

Push form submissions into project Leads via Lead Source Key

Members who manage lead sources

Members who can view leads

File storage

Profile photos and project logos

Platform operations

All users via the UI

Transactional email

Verification, password reset, invites

Platform operations

End users