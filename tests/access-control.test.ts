import { describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import { createAccessToken } from "@/lib/auth/tokens";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { buildSidebarNavItems } from "@/lib/frontend/layout/build-sidebar-nav";
import { canAccessRoute, resolveDefaultAccessiblePath } from "@/lib/frontend/layout/route-access";
import {
  allSuperAdminPermissions,
  defaultProjectOwnerPermissions,
} from "@/lib/rbac/permission-catalog";
import { SUPER_ADMIN_ROLE } from "@/lib/rbac/roles";
import { User } from "@/models";

function authRequest(token: string): Request {
  return new Request("http://localhost/api/v1/admin/permissions", {
    headers: { authorization: `Bearer ${token}` },
  });
}

describe("Access control", () => {
  it("blocks unauthenticated admin API access", async () => {
    const request = new Request("http://localhost/api/v1/admin/permissions");
    const result = await runApiGuards(request, { superAdmin: true });
    expect(result).toBeInstanceOf(Response);
    if (!(result instanceof Response)) return;
    expect(result.status).toBe(401);
  });

  it("blocks non-super-admin from admin API", async () => {
    const user = await User.create({
      name: "Regular",
      email: "regular-ac@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });
    const token = await createAccessToken(user._id);

    const result = await runApiGuards(authRequest(token), { superAdmin: true });
    expect(result).toBeInstanceOf(Response);
    if (!(result instanceof Response)) return;
    expect(result.status).toBe(403);
  });

  it("allows super_admin on admin API guards", async () => {
    const user = await User.create({
      name: "Admin",
      email: "admin-ac@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [SUPER_ADMIN_ROLE],
    });
    const token = await createAccessToken(user._id);

    const result = await runApiGuards(authRequest(token), { superAdmin: true });
    expect(result).not.toBeInstanceOf(Response);
    if (result instanceof Response) return;
    expect(result.user.roles).toContain(SUPER_ADMIN_ROLE);
  });

  it("returns permission catalog for super_admin only", async () => {
    const user = await User.create({
      name: "Admin",
      email: "admin-catalog@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [SUPER_ADMIN_ROLE],
    });
    const token = await createAccessToken(user._id);

    const { GET } = await import("@/app/api/v1/admin/permissions/route");
    const response = await GET(authRequest(token), { params: Promise.resolve({}) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.project_modules.length).toBeGreaterThan(0);
    expect(body.data.admin_modules.length).toBeGreaterThan(0);
    expect(body.data.admin_modules.map((m: { slug: string }) => m.slug)).not.toContain("companies");
  });

  it("denies regular users admin pages and project pages", () => {
    expect(canAccessRoute("/users", [], [], [])).toBe(false);
    expect(canAccessRoute("/dashboard", [], [], [])).toBe(false);
    expect(canAccessRoute("/edit-profile", [], [], [])).toBe(true);
    expect(canAccessRoute("/settings", [], [], [])).toBe(true);
  });

  it("allows super_admin on project and admin routes with unified permissions", () => {
    const platformPermissions = allSuperAdminPermissions();

    expect(canAccessRoute("/users", platformPermissions, [], [SUPER_ADMIN_ROLE])).toBe(true);
    expect(canAccessRoute("/dashboard", platformPermissions, [], [SUPER_ADMIN_ROLE])).toBe(true);
    expect(canAccessRoute("/projects", platformPermissions, [], [SUPER_ADMIN_ROLE])).toBe(true);
  });

  it("allows project routes when project permissions exist", () => {
    const projectPermissions = defaultProjectOwnerPermissions();

    expect(canAccessRoute("/dashboard", [], projectPermissions, [])).toBe(true);
    expect(canAccessRoute("/projects", [], projectPermissions, [])).toBe(true);
    expect(canAccessRoute("/users", [], projectPermissions, [])).toBe(false);
  });

  it("resolves default paths by role", () => {
    const adminPermissions = allSuperAdminPermissions();
    const projectPermissions = defaultProjectOwnerPermissions();

    expect(resolveDefaultAccessiblePath(adminPermissions, [], [SUPER_ADMIN_ROLE])).toBe("/dashboard");
    expect(resolveDefaultAccessiblePath([], projectPermissions, [])).toBe("/dashboard");
    expect(resolveDefaultAccessiblePath([], [], [])).toBe("/projects");
  });

  it("builds the same sidebar shape for super_admin and project owners", () => {
    const adminPermissions = allSuperAdminPermissions();
    const projectPermissions = defaultProjectOwnerPermissions();

    const adminNav = buildSidebarNavItems(adminPermissions, [], [SUPER_ADMIN_ROLE]);
    expect(adminNav.map((item) => item.path)).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/projects",
        "/analytics",
        "/users",
        "/roles",
        "/settings",
      ]),
    );
    expect(adminNav.map((item) => item.path)).not.toContain("/companies");

    const projectNav = buildSidebarNavItems([], projectPermissions, []);
    expect(projectNav.map((item) => item.path)).toEqual(
      expect.arrayContaining(["/dashboard", "/projects", "/settings"]),
    );
    expect(projectNav.map((item) => item.path)).not.toContain("/users");
    expect(projectNav.map((item) => item.path)).not.toContain("/companies");

    const plainNav = buildSidebarNavItems([], [], []);
    expect(plainNav.map((item) => item.path)).toEqual(["/projects", "/settings"]);
  });
});
