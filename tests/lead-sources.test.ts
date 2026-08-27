import { describe, expect, it } from "vitest";

import { hashPassword } from "@/lib/auth/password";
import { NotFoundError, ValidationError } from "@/lib/api/http-errors";
import { LEAD_SOURCE_KEY_PREFIX } from "@/lib/leads/constants";
import { hashLeadSourceKey } from "@/lib/leads/lead-source-key";
import {
  createLeadSource,
  disconnectLeadSource,
  findLeadSourceByPlainKey,
  listLeadSources,
  revealLeadSourceKey,
  rotateLeadSourceKey,
} from "@/lib/leads/manage-lead-source";
import { createProject } from "@/lib/projects/create-project";
import { requireProjectPermission } from "@/lib/projects/get-project-access";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { LeadSource, Project, User } from "@/models";
import { authContextFor, projectInput } from "@/tests/helpers/project-test-utils";

describe("Lead sources", () => {
  it("creates a wordpress source, never stores plaintext, and can reveal the key", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Source Owner",
      email: "lead-source-owner@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Source Project",
        websiteUrl: "https://source.example.com",
      }),
    );
    await Project.findByIdAndUpdate(project._id, { status: "active" });

    const projectId = project._id.toString();
    const auth = authContextFor(owner);

    const created = await createLeadSource(auth, projectId);
    expect(created.plaintextKey.startsWith(LEAD_SOURCE_KEY_PREFIX)).toBe(true);
    expect(created.source.provider).toBe("wordpress");
    expect(created.source.status).toBe("connected");
    expect(created.source.keyPrefix).toHaveLength(4);
    expect(created.plaintextKey.endsWith(created.source.keyPrefix)).toBe(true);

    const stored = await LeadSource.findById(created.source.id);
    expect(stored?.keyHash).toBe(hashLeadSourceKey(created.plaintextKey));
    expect(JSON.stringify(stored)).not.toContain(created.plaintextKey);

    const listed = await listLeadSources(projectId);
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.id).toBe(created.source.id);
    expect(listed.items[0]?.siteUrl).toBeNull();
    expect(JSON.stringify(listed)).not.toContain(created.plaintextKey);
    expect(JSON.stringify(listed)).not.toContain(stored?.keyHash);
    expect(JSON.stringify(listed)).not.toContain("keyCiphertext");
    expect(stored?.keyCiphertext).toBeTruthy();

    const found = await findLeadSourceByPlainKey(created.plaintextKey);
    expect(found?._id.toString()).toBe(created.source.id);
    expect(await findLeadSourceByPlainKey(`  ${created.plaintextKey}  `)).not.toBeNull();
    expect(await findLeadSourceByPlainKey("   ")).toBeNull();

    const revealed = await revealLeadSourceKey(projectId, created.source.id);
    expect(revealed.plaintextKey).toBe(created.plaintextKey);
    expect(revealed.source.id).toBe(created.source.id);
  });

  it("rejects a second wordpress source and inactive-project connect", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Second Source",
      email: "lead-source-second@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Second Source",
        websiteUrl: "https://second-source.example.com",
      }),
    );
    const projectId = project._id.toString();
    const auth = authContextFor(owner);

    await expect(createLeadSource(auth, projectId)).rejects.toBeInstanceOf(ValidationError);

    await Project.findByIdAndUpdate(project._id, { status: "active" });
    await createLeadSource(auth, projectId);
    await expect(createLeadSource(auth, projectId)).rejects.toBeInstanceOf(ValidationError);
  });

  it("rotates the key and disconnects within the project", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Rotate Source",
      email: "lead-source-rotate@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Rotate Source",
        websiteUrl: "https://rotate-source.example.com",
      }),
    );
    await Project.findByIdAndUpdate(project._id, { status: "active" });
    const projectId = project._id.toString();
    const auth = authContextFor(owner);

    const created = await createLeadSource(auth, projectId);
    const rotated = await rotateLeadSourceKey(auth, projectId, created.source.id);

    expect(rotated.plaintextKey).not.toBe(created.plaintextKey);
    expect(await findLeadSourceByPlainKey(created.plaintextKey)).toBeNull();
    expect((await findLeadSourceByPlainKey(rotated.plaintextKey))?._id.toString()).toBe(
      created.source.id,
    );

    await disconnectLeadSource(projectId, created.source.id);
    expect(await LeadSource.countDocuments({ projectId })).toBe(0);
    expect(await findLeadSourceByPlainKey(rotated.plaintextKey)).toBeNull();
  });

  it("rejects rotate when the project is inactive", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Inactive Rotate",
      email: "lead-source-inactive-rotate@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Inactive Rotate",
        websiteUrl: "https://inactive-rotate.example.com",
      }),
    );
    await Project.findByIdAndUpdate(project._id, { status: "active" });
    const auth = authContextFor(owner);
    const created = await createLeadSource(auth, project._id.toString());

    await Project.findByIdAndUpdate(project._id, { status: "inactive" });
    await expect(
      rotateLeadSourceKey(auth, project._id.toString(), created.source.id),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects cross-project rotate and disconnect", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Cross Source",
      email: "lead-source-cross@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project: projectA } = await createProject(
      authContextFor(owner),
      projectInput({ businessName: "Source A", websiteUrl: "https://source-a.example.com" }),
    );
    const { project: projectB } = await createProject(
      authContextFor(owner),
      projectInput({ businessName: "Source B", websiteUrl: "https://source-b.example.com" }),
    );
    await Project.findByIdAndUpdate(projectA._id, { status: "active" });
    await Project.findByIdAndUpdate(projectB._id, { status: "active" });

    const auth = authContextFor(owner);
    const created = await createLeadSource(auth, projectA._id.toString());

    await expect(
      rotateLeadSourceKey(auth, projectB._id.toString(), created.source.id),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      disconnectLeadSource(projectB._id.toString(), created.source.id),
    ).rejects.toBeInstanceOf(NotFoundError);

    const denied = await requireProjectPermission(
      authContextFor(owner),
      "000000000000000000000000",
      "integrations.update",
    );
    expect(denied).toBeInstanceOf(Response);
    expect(denied?.status).toBe(404);
  });
});
