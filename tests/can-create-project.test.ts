import { describe, expect, it } from "vitest";

import { canCreateProject, listHasOwnedPendingProject } from "@/lib/projects/can-create-project.utils";

describe("canCreateProject", () => {
  it("allows a verified user with no projects to create the first one", () => {
    expect(
      canCreateProject({
        isVerified: true,
        isSuperAdmin: false,
        hasProjects: false,
        hasCreatePermission: false,
        ownsPendingProject: false,
      }),
    ).toBe(true);
  });

  it("blocks a second create while the user already owns a pending project", () => {
    expect(
      canCreateProject({
        isVerified: true,
        isSuperAdmin: false,
        hasProjects: true,
        hasCreatePermission: true,
        ownsPendingProject: true,
      }),
    ).toBe(false);
  });

  it("allows another create when existing projects are active and the user has permission", () => {
    expect(
      canCreateProject({
        isVerified: true,
        isSuperAdmin: false,
        hasProjects: true,
        hasCreatePermission: true,
        ownsPendingProject: false,
      }),
    ).toBe(true);
  });

  it("does not apply the pending cap to super_admin", () => {
    expect(
      canCreateProject({
        isVerified: true,
        isSuperAdmin: true,
        hasProjects: true,
        hasCreatePermission: false,
        ownsPendingProject: true,
      }),
    ).toBe(true);
  });
});

describe("listHasOwnedPendingProject", () => {
  it("ignores pending projects the user does not own", () => {
    expect(
      listHasOwnedPendingProject(
        [{ status: "pending", createdByUserId: "other", owner: { id: "other" } }],
        "me",
      ),
    ).toBe(false);
  });

  it("detects a pending project owned by the user", () => {
    expect(
      listHasOwnedPendingProject(
        [{ status: "pending", createdByUserId: "me", owner: { id: "me" } }],
        "me",
      ),
    ).toBe(true);
  });

  it("uses the current owner, not the original creator", () => {
    expect(
      listHasOwnedPendingProject(
        [{ status: "pending", createdByUserId: "me", owner: { id: "other" } }],
        "me",
      ),
    ).toBe(false);
  });

  it("falls back to createdByUserId when owner is missing", () => {
    expect(
      listHasOwnedPendingProject([{ status: "pending", createdByUserId: "me", owner: null }], "me"),
    ).toBe(true);
  });
});
