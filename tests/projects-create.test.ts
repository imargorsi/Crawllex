import { describe, expect, it } from "vitest";
import mongoose from "mongoose";

import { hashPassword } from "@/lib/auth/password";
import { PENDING_PROJECT_LIMIT_MESSAGE } from "@/lib/projects/constants";
import { buildCreateProjectResponse, createProject } from "@/lib/projects/create-project";
import { PROJECT_OWNER_ROLE, SUPER_ADMIN_ROLE } from "@/lib/rbac/roles";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { Project, ProjectMember, User } from "@/models";
import { createProjectSchema } from "@/schemas/project";
import { authContextFor, projectInput } from "@/tests/helpers/project-test-utils";

describe("POST /projects — createProject", () => {
  it("creates a pending project for a regular user and assigns project_owner", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Creator",
      email: "creator@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Acme SEO",
        websiteUrl: "https://acme.example.com",
        seoGoals: ["get_more_calls"],
      }),
    );

    expect(project.status).toBe("pending");
    expect(project.pocEmail).toBe("creator@example.com");
    expect(project.createdByUserId.toString()).toBe(user._id.toString());
    expect(project.approvedAt).toBeNull();

    const membership = await ProjectMember.findOne({ projectId: project._id, userId: user._id });
    expect(membership?.status).toBe("active");

    const ownerRole = await import("@/lib/projects/resolve-role").then((m) =>
      m.resolveProjectRoleBySlug(PROJECT_OWNER_ROLE),
    );
    expect(membership?.roleId.toString()).toBe(ownerRole._id.toString());
  });

  it("returns a 201 API response with camelCase project fields", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Creator",
      email: "response@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Response Co",
        websiteUrl: "https://response.example.com",
      }),
    );

    const response = buildCreateProjectResponse(project);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.businessName).toBe("Response Co");
    expect(body.data.pocEmail).toBe("response@example.com");
    expect(body.data.status).toBe("pending");
  });

  it("creates an active project for super_admin with a selected owner", async () => {
    await seedSystemRoles();

    const admin = await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [SUPER_ADMIN_ROLE],
    });

    const owner = await User.create({
      name: "Owner",
      email: "owner@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(admin),
      projectInput({
        businessName: "Admin Created",
        websiteUrl: "https://admin-created.example.com",
        ownerUserId: owner._id.toString(),
      }),
    );

    expect(project.status).toBe("active");
    expect(project.createdByUserId.toString()).toBe(owner._id.toString());
    expect(project.approvedByUserId?.toString()).toBe(admin._id.toString());
    expect(project.pocEmail).toBe("owner@example.com");

    const membership = await ProjectMember.findOne({ projectId: project._id, userId: owner._id });
    expect(membership).not.toBeNull();
  });

  it("rejects ownerUserId from regular users", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "User",
      email: "user@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const otherId = new mongoose.Types.ObjectId();

    await expect(
      createProject(
        authContextFor(user),
        projectInput({
          businessName: "Blocked",
          websiteUrl: "https://blocked.example.com",
          ownerUserId: otherId.toString(),
        }),
      ),
    ).rejects.toMatchObject({
      errors: {
        ownerUserId: expect.arrayContaining([expect.stringContaining("admin")]),
      },
    });

    expect(await Project.countDocuments()).toBe(0);
  });

  it("rejects a second pending project for the same owner", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Pending Owner",
      email: "pending-owner@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    await createProject(
      authContextFor(user),
      projectInput({
        businessName: "First Pending",
        websiteUrl: "https://first-pending.example.com",
      }),
    );

    await expect(
      createProject(
        authContextFor(user),
        projectInput({
          businessName: "Second Pending",
          websiteUrl: "https://second-pending.example.com",
        }),
      ),
    ).rejects.toMatchObject({
      message: PENDING_PROJECT_LIMIT_MESSAGE,
    });

    expect(await Project.countDocuments({ createdByUserId: user._id })).toBe(1);
  });

  it("allows another project after the pending one is approved", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Active Owner",
      email: "active-owner@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const first = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Now Active",
        websiteUrl: "https://now-active.example.com",
      }),
    );
    await Project.findByIdAndUpdate(first.project._id, { status: "active" });

    const second = await createProject(
      authContextFor(user),
      projectInput({
        businessName: "Next Pending",
        websiteUrl: "https://next-pending.example.com",
      }),
    );

    expect(second.project.status).toBe("pending");
    expect(await Project.countDocuments({ createdByUserId: user._id })).toBe(2);
  });

  it("rejects invalid seo goals in the schema", () => {
    expect(() =>
      createProjectSchema.parse({
        businessName: "Bad Goals",
        websiteUrl: "https://bad.example.com",
        seoGoals: ["get_more_calls", "invalid_goal"],
      }),
    ).toThrow();
  });

  it("normalizes bare website domains and accepts competitor names", () => {
    const parsed = createProjectSchema.parse({
      businessName: "Bare Domain Co",
      websiteUrl: "example.com",
      competitorUrls: ["https://rival.example.com", "Local Rival"],
    });

    expect(parsed.websiteUrl).toBe("https://example.com");
    expect(parsed.competitorUrls).toEqual(["https://rival.example.com", "Local Rival"]);
  });
});
