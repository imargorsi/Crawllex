# RBAC

Source of truth: `lib/rbac/permission-catalog.ts`, `lib/rbac/roles.ts`,
`lib/projects/get-project-access.ts`, `lib/frontend/layout/route-access.ts`.

## Two Layers

| Layer | Stored on | Evaluated by |
|-------|-----------|--------------|
| Platform | `User.roles` (only `super_admin` exists) | `runApiGuards({ superAdmin \| permission \| anyPermission })`, `loadPlatformUserAuthData` |
| Project | `ProjectMember { projectId, userId, roleId, status }` → `Role.permissions` | `getProjectAccessForUser` / `requireProjectPermission`; client: `GET /projects/{id}/access` |

There are no companies or orgs. Access is always per project. `company_admin` (from Laravel) is
deprecated and hidden.

## Permission Catalog (fixed; operators can't invent keys)

| Module | Actions | Key form |
|--------|---------|----------|
| dashboard | view | `dashboard.view` |
| projects | view, create, update, delete | `projects.*` |
| analytics | view | `analytics.view` |
| seo_activities | view, create, update, delete | `seo_activities.*` |
| leads | view, create, update, delete, import, export | `leads.*` |
| integrations | view, disconnect, refresh, update | `integrations.*` (GSC/GA4 **and** WordPress lead sources) |
| members | view, invite, remove | `members.*` |
| admin (platform) | users.{view,create,update,delete}, roles.{…}, dashboard.view | `admin.users.view`, … |
| clients (platform, Module 13) | view, create, update, delete | `clients.*`, never on project roles |

Profile, password and preferences are open to any authenticated user. Reports (Module 11) are out
of scope and have no keys.

## System Roles (seeded by `ensureSystemRoles`)

| Role | Permissions |
|------|-------------|
| `project_owner` | Full matrix, except Leads = `view` + `export` only |
| `project_user` | `*.view` everywhere, plus `leads.export` |
| `super_admin` (platform) | All admin + all project + all clients keys |

Custom project roles are created by super admins at `/roles` (permission matrix UI). Only active
roles grant permissions. An inactive role referenced by a membership grants nothing. Only inactive
custom roles can be deleted.

## Project Status Gating (`getProjectAccessForUser`)

| Status | Member gets | Super admin gets |
|--------|-------------|------------------|
| `active` | Role permissions | Full project catalog |
| `pending` | `projects.view`, `projects.update` + role's `members.*` | Full |
| `inactive` | `projects.view`, `projects.update` + role's `members.*` | Full |
| `rejected` | `projects.view` only | `projects.view` only |
| No active membership / missing project | → 404 `Project Not Found.` | |

Lifecycle transitions are super admin only: `approve`, `reject`, `activate`, `deactivate`.
User-created projects start `pending` (gate: `lib/projects/can-create-project.utils.ts`).
Super admins can create projects as active and assign or reassign the owner.

## Frontend Route Rules (`route-access.ts`)

| Route | Needs | Scope |
|-------|-------|-------|
| `/users` | `admin.users.view` | platform |
| `/roles` | `admin.roles.view` | platform |
| `/clients` | `clients.view` | platform |
| `/dashboard` | `dashboard.view` | project |
| `/projects` | `projects.view` (also listed auth-only) | project |
| `/analytics` | `analytics.view` | project |
| `/seo-activities` | `seo_activities.view` | project |
| `/leads` | `leads.view` | project |
| `/edit-profile`, `/settings`, `/email-verification`, `/debug` | auth only | |

`permissionsForScope`: a super admin is always evaluated on platform perms. Project-scope routes use
the selected project's perms when present.

## Gotchas

- `isKnownPermission()` checks project + admin keys but **not** `clients.*`. Assigning `clients.*` to a
  role through the API would be rejected. That is consistent with the rule (no clients on project roles),
  but remember it if clients ever get delegated.
- `/projects` is in both `AUTH_ONLY_ROUTE_PREFIXES` and the rules table. Auth-only wins, so
  `/projects` is reachable without `projects.view`. That is intended, so users with no project can create one.
