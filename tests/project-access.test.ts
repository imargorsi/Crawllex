import { describe, expect, it } from "vitest";

import { hashPassword } from "@/lib/auth/password";
import { createProject } from "@/lib/projects/create-project";
import {
  defaultProjectOwnerPermissions,
  defaultProjectUserPermissions,
} from "@/lib/rbac/permission-catalog";
import { assignProjectMember } from "@/lib/projects/assign-member";
import { getProjectAccessForUser, requireProjectPermission } from "@/lib/projects/get-project-access";
import { PROJECT_OWNER_ROLE, PROJECT_USER_ROLE, SUPER_ADMIN_ROLE } from "@/lib/rbac/roles";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { Project, User } from "@/models";
import { authContextFor, projectInput } from "@/tests/helpers/project-test-utils";

describe("GET /projects/{id}/access — getProjectAccessForUser", () => {
  it("returns project_owner permissions for an active project member", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Owner",
      email: "owner-access@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Access Project",
        websiteUrl: "https://access.example.com",
      }),
    );

    await Project.findByIdAndUpdate(project._id, { status: "active" });

    const access = await getProjectAccessForUser(authContextFor(user), project._id.toString());

    expect(access).not.toBeNull();
    expect(access!.projectId).toBe(project._id.toString());
    expect(access!.roles).toContain(PROJECT_OWNER_ROLE);
    expect(access!.permissions).toEqual(expect.arrayContaining(defaultProjectOwnerPermissions()));
  });

  it("returns limited permissions for pending projects", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Pending Owner",
      email: "pending-access@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Pending Project",
        websiteUrl: "https://pending.example.com",
      }),
    );

    const access = await getProjectAccessForUser(authContextFor(user), project._id.toString());

    expect(access).not.toBeNull();
    expect(access!.permissions).toEqual(
      expect.arrayContaining(["projects.view", "projects.update", "members.invite", "members.view"]),
    );
    expect(access!.permissions).not.toContain("dashboard.view");
    expect(access!.roles).toContain(PROJECT_OWNER_ROLE);
  });

  it("returns project_user permissions scoped to one project", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Owner",
      email: "owner-user-access@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const member = await User.create({
      name: "Member",
      email: "member-access@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Shared Project",
        websiteUrl: "https://shared.example.com",
      }),
    );

    await Project.findByIdAndUpdate(project._id, { status: "active" });
    await assignProjectMember({
      projectId: project._id,
      userId: member._id,
      roleSlug: PROJECT_USER_ROLE,
      status: "active",
    });

    const access = await getProjectAccessForUser(authContextFor(member), project._id.toString());

    expect(access).not.toBeNull();
    expect(access!.roles).toContain(PROJECT_USER_ROLE);
    expect(access!.permissions).toEqual(expect.arrayContaining(defaultProjectUserPermissions()));
    expect(access!.permissions).not.toContain("members.invite");
  });

  it("returns null when the user is not a member", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Owner",
      email: "owner-nonmember@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const other = await User.create({
      name: "Other",
      email: "other-nonmember@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Private Project",
        websiteUrl: "https://private.example.com",
      }),
    );

    const access = await getProjectAccessForUser(authContextFor(other), project._id.toString());
    expect(access).toBeNull();
  });

  it("returns catalog permissions for super_admin on any project", async () => {
    await seedSystemRoles();

    const admin = await User.create({
      name: "Admin",
      email: "admin-access@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [SUPER_ADMIN_ROLE],
    });

    const owner = await User.create({
      name: "Owner",
      email: "owner-admin-access@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Admin View Project",
        websiteUrl: "https://admin-view.example.com",
      }),
    );

    await Project.findByIdAndUpdate(project._id, { status: "active" });

    const access = await getProjectAccessForUser(authContextFor(admin), project._id.toString());

    expect(access).not.toBeNull();
    expect(access!.roles).toContain(SUPER_ADMIN_ROLE);
    expect(access!.permissions).toContain("dashboard.view");
    expect(access!.permissions).toContain("members.invite");
  });

  it("enforces project-scoped permissions via requireProjectPermission", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Owner",
      email: "owner-guard@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Guard Project",
        websiteUrl: "https://guard.example.com",
      }),
    );

    await Project.findByIdAndUpdate(project._id, { status: "active" });

    const allowed = await requireProjectPermission(
      authContextFor(user),
      project._id.toString(),
      "projects.view",
    );
    expect(allowed).toBeNull();

    const denied = await requireProjectPermission(
      authContextFor(user),
      project._id.toString(),
      "admin.users.view",
    );
    expect(denied).not.toBeNull();
    if (!(denied instanceof Response)) return;
    expect(denied.status).toBe(403);
  });

  it("returns limited permissions for inactive projects", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Inactive Owner",
      email: "inactive-access@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Inactive Project",
        websiteUrl: "https://inactive.example.com",
      }),
    );

    await Project.findByIdAndUpdate(project._id, { status: "inactive" });

    const access = await getProjectAccessForUser(authContextFor(user), project._id.toString());

    expect(access).not.toBeNull();
    expect(access!.permissions).toEqual(
      expect.arrayContaining(["projects.view", "projects.update", "members.invite", "members.view"]),
    );
    expect(access!.permissions).not.toContain("dashboard.view");
    expect(access!.roles).toContain(PROJECT_OWNER_ROLE);
  });

  it("allows projects.view on rejected projects but denies other module permissions", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Owner",
      email: "owner-rejected-guard@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Rejected Guard Project",
        websiteUrl: "https://rejected-guard.example.com",
      }),
    );

    await Project.findByIdAndUpdate(project._id, { status: "rejected" });

    const access = await getProjectAccessForUser(authContextFor(user), project._id.toString());
    expect(access).not.toBeNull();
    expect(access!.permissions).toEqual(["projects.view"]);

    const allowedView = await requireProjectPermission(
      authContextFor(user),
      project._id.toString(),
      "projects.view",
    );
    expect(allowedView).toBeNull();

    const deniedAnalytics = await requireProjectPermission(
      authContextFor(user),
      project._id.toString(),
      "analytics.view",
    );
    expect(deniedAnalytics).not.toBeNull();
    if (!(deniedAnalytics instanceof Response)) return;
    expect(deniedAnalytics.status).toBe(403);
  });
});

describe("GET /auth/user — platform auth only", () => {
  it("does not merge project membership into platform auth payload", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Owner",
      email: "platform-only@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Platform Only Project",
        websiteUrl: "https://platform-only.example.com",
      }),
    );

    const { loadPlatformUserAuthData } = await import("@/lib/auth/effective-user-auth");
    const authData = await loadPlatformUserAuthData(user);

    expect(authData.roles).toEqual([]);
    expect(authData.permissions).toEqual([]);
  });
});
