import { describe, expect, it } from "vitest";

import { hashPassword } from "@/lib/auth/password";
import { createProject } from "@/lib/projects/create-project";
import { buildListProjectsResponse, listProjects } from "@/lib/projects/list-projects";
import { assignProjectMember } from "@/lib/projects/assign-member";
import { PROJECT_USER_ROLE, SUPER_ADMIN_ROLE } from "@/lib/rbac/roles";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { Project, ProjectIntegration, User } from "@/models";
import { authContextFor, projectInput } from "@/tests/helpers/project-test-utils";

describe("GET /projects — listProjects", () => {
  it("returns only projects the user belongs to", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Member",
      email: "member@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const other = await User.create({
      name: "Other",
      email: "other@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const mine = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "My Project",
        websiteUrl: "https://mine.example.com",
      }),
    );

    await createProject(
      authContextFor(other),
      projectInput({
        businessName: "Other Project",
        websiteUrl: "https://other.example.com",
      }),
    );

    const projects = await listProjects(authContextFor(user));

    expect(projects).toHaveLength(1);
    expect(projects[0]!.id).toBe(mine.project._id.toString());
  });

  it("returns all projects for super_admin", async () => {
    await seedSystemRoles();

    const admin = await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [SUPER_ADMIN_ROLE],
    });

    const user = await User.create({
      name: "User",
      email: "user@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    await createProject(
      authContextFor(user),
      projectInput({
        businessName: "User Project",
        websiteUrl: "https://user.example.com",
      }),
    );

    await createProject(
      authContextFor(admin),
      projectInput({
        businessName: "Admin Project",
        websiteUrl: "https://admin.example.com",
        ownerUserId: user._id.toString(),
      }),
    );

    const projects = await listProjects(authContextFor(admin));

    expect(projects).toHaveLength(2);
    expect(projects.map((project) => project.businessName).sort()).toEqual([
      "Admin Project",
      "User Project",
    ]);
  });

  it("excludes projects where membership is not active", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Removed",
      email: "removed@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const owner = await User.create({
      name: "Owner",
      email: "owner@example.com",
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

    await assignProjectMember({
      projectId: project._id,
      userId: user._id,
      roleSlug: PROJECT_USER_ROLE,
      status: "removed",
    });

    const projects = await listProjects(authContextFor(user));
    expect(projects).toHaveLength(0);
  });

  it("returns list items in camelCase API shape", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Lister",
      email: "lister@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    await createProject(
      authContextFor(user),
      projectInput({
        businessName: "List Co",
        websiteUrl: "https://list.example.com",
      }),
    );

    const projects = await listProjects(authContextFor(user));
    const response = buildListProjectsResponse(projects);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]).toEqual({
      id: projects[0]!.id,
      businessName: "List Co",
      websiteUrl: "https://list.example.com",
      status: "pending",
      imageUrl: null,
      createdByUserId: user._id.toString(),
      owner: {
        id: user._id.toString(),
        name: "Lister",
        profileImage: null,
      },
      integrations: {
        gsc: "disconnected",
        ga4: "disconnected",
        wordpress: "disconnected",
      },
    });
  });

  it("includes Google integration connection status on list items", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Integrations Owner",
      email: "integrations-owner@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Integrated Co",
        websiteUrl: "https://integrated.example.com",
      }),
    );

    await ProjectIntegration.create({
      projectId: project._id,
      provider: "google",
      service: "gsc",
      status: "connected",
      externalPropertyId: "https://integrated.example.com/",
      connectedAt: new Date(),
      connectedByUserId: user._id,
    });

    const projects = await listProjects(authContextFor(user));

    expect(projects).toHaveLength(1);
    expect(projects[0]!.integrations).toEqual({
      gsc: "connected",
      ga4: "disconnected",
      wordpress: "disconnected",
    });
  });

  it("returns null for legacy local profile image paths", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Photo Owner",
      email: "photo-owner@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
      profileImage: "profile-images/abc/avatar.jpg",
    });

    await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Photo Co",
        websiteUrl: "https://photo.example.com",
      }),
    );

    const projects = await listProjects(authContextFor(user));

    expect(projects).toHaveLength(1);
    expect(projects[0]!.owner?.profileImage).toBeNull();
  });

  it("serializes owner profile image as a signed URL for blob storage", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Blob Owner",
      email: "blob-owner@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
      profileImage: "blob:profile-images/abc/avatar.jpg",
    });

    await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Blob Co",
        websiteUrl: "https://blob.example.com",
      }),
    );

    const projects = await listProjects(authContextFor(user));

    expect(projects).toHaveLength(1);
    expect(projects[0]!.owner?.profileImage).toContain("/api/v1/storage/image");
    expect(projects[0]!.owner?.profileImage).toContain("pathname=");
    expect(projects[0]!.owner?.profileImage).toContain("signature=");
  });

  it("returns an empty list when the user has no projects", async () => {
    const user = await User.create({
      name: "Empty",
      email: "empty@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const projects = await listProjects(authContextFor(user));
    expect(projects).toEqual([]);
  });

  it("filters projects by status for members", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Filter User",
      email: "filter-user@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const pending = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Pending Co",
        websiteUrl: "https://pending-filter.example.com",
      }),
    );

    const admin = await User.create({
      name: "Admin",
      email: "filter-admin@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [SUPER_ADMIN_ROLE],
    });

    const active = await createProject(
      authContextFor(admin),
      projectInput({
        businessName: "Active Co",
        websiteUrl: "https://active-filter.example.com",
        ownerUserId: user._id.toString(),
      }),
    );

    await Project.findByIdAndUpdate(active.project._id, { status: "inactive" });

    const pendingOnly = await listProjects(authContextFor(user), { status: "pending" });
    expect(pendingOnly).toHaveLength(1);
    expect(pendingOnly[0]!.id).toBe(pending.project._id.toString());

    const inactiveOnly = await listProjects(authContextFor(user), { status: "inactive" });
    expect(inactiveOnly).toHaveLength(1);
    expect(inactiveOnly[0]!.id).toBe(active.project._id.toString());

    const activeOnly = await listProjects(authContextFor(user), { status: "active" });
    expect(activeOnly).toHaveLength(0);
  });

  it("includes rejected projects in the default list and when filtered", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Reject User",
      email: "reject-user@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const pending = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Keep Pending",
        websiteUrl: "https://keep-pending.example.com",
      }),
    );

    const rejected = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Rejected Co",
        websiteUrl: "https://rejected-list.example.com",
      }),
    );

    await Project.findByIdAndUpdate(rejected.project._id, { status: "rejected" });

    const defaultList = await listProjects(authContextFor(user));
    expect(defaultList.map((project) => project.id).sort()).toEqual(
      [pending.project._id.toString(), rejected.project._id.toString()].sort(),
    );

    const rejectedOnly = await listProjects(authContextFor(user), { status: "rejected" });
    expect(rejectedOnly).toHaveLength(1);
    expect(rejectedOnly[0]!.id).toBe(rejected.project._id.toString());
  });
});
