import { describe, expect, it } from "vitest";

import { hashPassword } from "@/lib/auth/password";
import { assignProjectMember } from "@/lib/projects/assign-member";
import { isActiveProjectStatus, isSelectableProjectStatus } from "@/lib/projects/constants";
import { resolveProjectRoleBySlug } from "@/lib/projects/resolve-role";
import { PROJECT_OWNER_ROLE, PROJECT_USER_ROLE } from "@/lib/rbac/roles";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { Project, ProjectMember, User } from "@/models";

describe("Projects foundation", () => {
  it("creates a project with pending status by default", async () => {
    const user = await User.create({
      name: "Creator",
      email: "creator@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const project = await Project.create({
      businessName: "Acme SEO",
      websiteUrl: "https://acme.example.com",
      createdByUserId: user._id,
    });

    expect(project.status).toBe("pending");
    expect(isActiveProjectStatus(project.status)).toBe(false);
    expect(isSelectableProjectStatus(project.status)).toBe(true);
  });

  it("accepts active, inactive, and rejected status values", async () => {
    const user = await User.create({
      name: "Statuses",
      email: "statuses@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    for (const status of ["active", "inactive", "rejected"] as const) {
      const project = await Project.create({
        businessName: `Project ${status}`,
        websiteUrl: `https://${status}.example.com`,
        createdByUserId: user._id,
        status,
      });
      expect(project.status).toBe(status);
      expect(isActiveProjectStatus(project.status)).toBe(status === "active");
      expect(isSelectableProjectStatus(project.status)).toBe(status === "active");
    }
  });

  it("resolves seeded project roles by slug", async () => {
    await seedSystemRoles();

    const owner = await resolveProjectRoleBySlug(PROJECT_OWNER_ROLE);
    const member = await resolveProjectRoleBySlug(PROJECT_USER_ROLE);

    expect(owner.slug).toBe(PROJECT_OWNER_ROLE);
    expect(member.slug).toBe(PROJECT_USER_ROLE);
    expect(owner.permissions).toContain("dashboard.view");
  });

  it("assigns project membership with role template", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Owner",
      email: "owner@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const project = await Project.create({
      businessName: "Northwind",
      websiteUrl: "https://northwind.example.com",
      status: "active",
      createdByUserId: user._id,
      approvedAt: new Date(),
      approvedByUserId: user._id,
    });

    const membership = await assignProjectMember({
      projectId: project._id,
      userId: user._id,
      roleSlug: PROJECT_OWNER_ROLE,
    });

    expect(membership.projectId.toString()).toBe(project._id.toString());
    expect(membership.userId.toString()).toBe(user._id.toString());
    expect(membership.status).toBe("active");

    const role = await resolveProjectRoleBySlug(PROJECT_OWNER_ROLE);
    expect(membership.roleId.toString()).toBe(role._id.toString());

    const count = await ProjectMember.countDocuments({ projectId: project._id });
    expect(count).toBe(1);
  });

  it("persists optional onboarding fields and seo goal enums", async () => {
    const user = await User.create({
      name: "Onboarder",
      email: "onboard@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const project = await Project.create({
      businessName: "Acme SEO",
      websiteUrl: "https://acme.example.com",
      createdByUserId: user._id,
      businessAddress: "123 Main St",
      pocContactNumber: "+1-555-0100",
      pocEmail: user.email,
      servicesOffered: ["SEO audits", "Content marketing"],
      primaryServiceToPromote: "Local SEO",
      idealCustomerProfile: "Small businesses in retail",
      targetLocations: ["Austin", "Dallas"],
      seoGoals: ["grow_brand_awareness", "improve_local_visibility"],
      competitorUrls: ["https://competitor.example.com", "Local Rival Co"],
    });

    expect(project.pocEmail).toBe("onboard@example.com");
    expect(project.servicesOffered).toEqual(["SEO audits", "Content marketing"]);
    expect(project.seoGoals).toEqual(["grow_brand_awareness", "improve_local_visibility"]);
    expect(project.competitorUrls).toEqual(["https://competitor.example.com", "Local Rival Co"]);
  });

  it("rejects invalid seo goals", async () => {
    const user = await User.create({
      name: "Creator",
      email: "bad-goals@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    await expect(
      Project.create({
        businessName: "Bad Goals Co",
        websiteUrl: "https://bad.example.com",
        createdByUserId: user._id,
        // @ts-expect-error — runtime enum validation for invalid SEO goal values
        seoGoals: ["grow_brand_awareness", "invalid_goal"],
      }),
    ).rejects.toThrow();
  });

  it("upserts membership when assigning the same user again", async () => {
    await seedSystemRoles();

    const user = await User.create({
      name: "Member",
      email: "member@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const project = await Project.create({
      businessName: "BrightPath",
      websiteUrl: "https://brightpath.example.com",
      createdByUserId: user._id,
    });

    await assignProjectMember({
      projectId: project._id,
      userId: user._id,
      roleSlug: PROJECT_USER_ROLE,
    });

    const updated = await assignProjectMember({
      projectId: project._id,
      userId: user._id,
      roleSlug: PROJECT_OWNER_ROLE,
    });

    const ownerRole = await resolveProjectRoleBySlug(PROJECT_OWNER_ROLE);
    expect(updated.roleId.toString()).toBe(ownerRole._id.toString());

    const count = await ProjectMember.countDocuments({ projectId: project._id });
    expect(count).toBe(1);
  });
});
