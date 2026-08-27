import { describe, expect, it } from "vitest";

import {
  allSuperAdminPermissions,
  defaultProjectOwnerPermissions,
  defaultProjectUserPermissions,
  PROJECT_MODULE_SLUGS,
  PROJECT_PERMISSION_MODULES,
  isKnownPermission,
} from "@/lib/rbac/permission-catalog";
import { PROJECT_OWNER_ROLE, PROJECT_USER_ROLE, SYSTEM_ROLE_SEEDS } from "@/lib/rbac/roles";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { Role } from "@/models/Role";

describe("RBAC permission catalog", () => {
  it("locks v1 project modules", () => {
    expect([...PROJECT_MODULE_SLUGS]).toEqual([
      "dashboard",
      "projects",
      "analytics",
      "seo_activities",
      "leads",
      "integrations",
      "members",
    ]);
  });

  it("seeds project_owner with trimmed matrix actions", () => {
    const permissions = defaultProjectOwnerPermissions();

    expect(permissions).toContain("dashboard.view");
    expect(permissions).not.toContain("dashboard.create");
    expect(permissions).toContain("seo_activities.create");
    expect(permissions).toContain("leads.view");
    expect(permissions).toContain("leads.export");
    expect(permissions).not.toContain("leads.create");
    expect(permissions).not.toContain("leads.import");
    expect(permissions).toContain("integrations.view");
    expect(permissions).toContain("integrations.update");
    expect(permissions).toContain("integrations.disconnect");
    expect(permissions).toContain("integrations.refresh");
    expect(permissions).toContain("members.invite");
    expect(permissions).not.toContain("admin.companies.view");
    expect(permissions).not.toContain("clients.view");
  });

  it("seeds project_user with view-only modules and members.view", () => {
    const permissions = defaultProjectUserPermissions();

    expect(permissions).toContain("dashboard.view");
    expect(permissions).toContain("leads.view");
    expect(permissions).toContain("leads.export");
    expect(permissions).not.toContain("leads.create");
    expect(permissions).toContain("integrations.view");
    expect(permissions).not.toContain("integrations.update");
    expect(permissions).not.toContain("members.invite");
    expect(permissions).toContain("members.view");
    expect(permissions).not.toContain("clients.view");
  });

  it("defines matrix modules for the role UI", () => {
    const labels = PROJECT_PERMISSION_MODULES.map((module) => module.label);
    expect(labels).toEqual([
      "Dashboard",
      "Projects",
      "Analytics",
      "SEO Activities",
      "Leads",
      "Integrations",
      "Members",
    ]);
    expect(PROJECT_PERMISSION_MODULES.map((module) => module.slug)).not.toContain("clients");
  });

  it("gives super_admin clients.* without making them known project permissions", () => {
    const adminPermissions = allSuperAdminPermissions();
    expect(adminPermissions).toEqual(
      expect.arrayContaining(["clients.view", "clients.create", "clients.update", "clients.delete"]),
    );
    expect(isKnownPermission("clients.view")).toBe(false);
    expect(isKnownPermission("admin.users.view")).toBe(true);
  });
});

describe("RBAC role seed", () => {
  it("upserts system project roles in MongoDB", async () => {
    await seedSystemRoles();

    const owner = await Role.findOne({ slug: PROJECT_OWNER_ROLE });
    const user = await Role.findOne({ slug: PROJECT_USER_ROLE });

    expect(owner?.isSystem).toBe(true);
    expect(owner?.scope).toBe("project");
    expect(owner?.permissions).toEqual(defaultProjectOwnerPermissions());

    expect(user?.isSystem).toBe(true);
    expect(user?.scope).toBe("project");
    expect(user?.permissions).toEqual(defaultProjectUserPermissions());
  });

  it("matches SYSTEM_ROLE_SEEDS slugs", () => {
    const slugs = SYSTEM_ROLE_SEEDS.map((role) => role.slug);
    expect(slugs).toEqual([PROJECT_OWNER_ROLE, PROJECT_USER_ROLE]);
  });

  it("preserves admin-granted leads mutate permissions on re-seed", async () => {
    await seedSystemRoles();

    const owner = await Role.findOne({ slug: PROJECT_OWNER_ROLE });
    expect(owner).toBeTruthy();

    owner!.permissions = [...new Set([...owner!.permissions, "leads.create", "leads.import"])];
    await owner!.save();

    await seedSystemRoles();

    const reseeding = await Role.findOne({ slug: PROJECT_OWNER_ROLE });
    expect(reseeding?.permissions).toContain("leads.view");
    expect(reseeding?.permissions).toContain("leads.export");
    expect(reseeding?.permissions).toContain("leads.create");
    expect(reseeding?.permissions).toContain("leads.import");
  });
});
