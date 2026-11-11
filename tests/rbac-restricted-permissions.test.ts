import { describe, expect, it } from "vitest";

import { defaultProjectOwnerPermissions, defaultProjectUserPermissions, allSuperAdminPermissions, isRestrictedPermission } from "@/lib/rbac/permission-catalog";
import { assertCanAssignRestricted, restrictedPermissionChanges } from "@/lib/roles/restricted-permissions";

const RESTRICTED = ["oriel.view", "oriel.delete", "lens.view", "lens.run"];

describe("restricted Oriel and Lens permissions", () => {
  it("are in the catalog and only super admin holds them by default", () => {
    for (const permission of RESTRICTED) {
      expect(allSuperAdminPermissions()).toContain(permission);
      expect(defaultProjectOwnerPermissions()).not.toContain(permission);
      expect(defaultProjectUserPermissions()).not.toContain(permission);
      expect(isRestrictedPermission(permission)).toBe(true);
    }
  });

  it("other modules are not restricted", () => {
    expect(isRestrictedPermission("leads.view")).toBe(false);
    expect(isRestrictedPermission("dashboard.view")).toBe(false);
  });

  it("only changed restricted permissions count", () => {
    expect(restrictedPermissionChanges(["lens.view"], ["lens.view", "lens.run"])).toEqual(["lens.run"]);
    expect(restrictedPermissionChanges(["lens.view", "leads.view"], ["lens.view", "leads.view", "reports.view"])).toEqual([]);
  });

  it("non super admin cannot add or remove a restricted permission", () => {
    expect(() => assertCanAssignRestricted(["project_owner"], [], ["lens.run"])).toThrow(/Only a super admin/);
    expect(() => assertCanAssignRestricted(["project_owner"], ["oriel.delete"], [])).toThrow(/Only a super admin/);
  });

  it("super admin can assign and remove restricted permissions", () => {
    expect(() => assertCanAssignRestricted(["super_admin"], [], ["oriel.view", "lens.run"])).not.toThrow();
    expect(() => assertCanAssignRestricted(["super_admin"], ["lens.run"], [])).not.toThrow();
  });

  it("non super admin can still save a role that keeps its restricted permissions unchanged", () => {
    expect(() => assertCanAssignRestricted(["project_owner"], ["lens.view"], ["lens.view", "reports.view"])).not.toThrow();
  });
});
