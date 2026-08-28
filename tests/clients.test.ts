import { describe, expect, it } from "vitest";

import { ValidationError } from "@/lib/api/http-errors";
import { hashPassword } from "@/lib/auth/password";
import { createAccessToken } from "@/lib/auth/tokens";
import { activateClient, deactivateClient } from "@/lib/clients/client-status-actions";
import { CLIENT_SHARE_TOKEN_UNAVAILABLE_MESSAGE } from "@/lib/clients/constants";
import { createClient } from "@/lib/clients/create-client";
import { deleteClient } from "@/lib/clients/delete-client";
import { getPublicClientByShareToken } from "@/lib/clients/get-public-client";
import { updateClient } from "@/lib/clients/update-client";
import { createProject } from "@/lib/projects/create-project";
import { deleteProject } from "@/lib/projects/delete-project";
import { SUPER_ADMIN_ROLE } from "@/lib/rbac/roles";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { Client, Project, ProjectMember, User } from "@/models";
import { createClientSchema } from "@/schemas/client";
import { authContextFor, projectInput } from "@/tests/helpers/project-test-utils";

function rawClientInput(overrides: Record<string, unknown> = {}) {
  return {
    businessName: "Acme Agency",
    contactPerson: "Jane Doe",
    pocEmail: "jane@acme.example.com",
    pocContactNumber: "+966500000000",
    businessSummary: "We sell widgets to regional retailers.",
    idealCustomerProfile: "Mid-size retailers in the GCC.",
    projectTypes: ["website"],
    platforms: ["desktop", "mobile_responsive"],
    projectName: "Acme Website",
    projectDescription: "Marketing site with contact forms.",
    successLooksLike: "Leads from the new site within 90 days.",
    existingSystem: "none",
    launchMustHaves: "Home, about, and contact pages.",
    userRoles: ["admin", "customer"],
    languages: ["english"],
    rtlRequired: false,
    hasFixedDeadline: false,
    contentReady: "partial",
    requirementsConfirmed: true,
    ...overrides,
  };
}

function clientInput(overrides: Record<string, unknown> = {}) {
  return createClientSchema.parse(rawClientInput(overrides));
}

async function createAdmin() {
  return User.create({
    name: "Clients Admin",
    email: `clients-admin-${Date.now()}@example.com`,
    password: await hashPassword("password"),
    emailVerifiedAt: new Date(),
    roles: [SUPER_ADMIN_ROLE],
    status: "active",
  });
}

function bearerRequest(token: string, url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Request(url, { ...init, headers });
}

describe("Client onboarding isolation", () => {
  it("lets super_admin create, update, list, and delete a Client without touching projects", async () => {
    const admin = await createAdmin();
    const { client } = await createClient(authContextFor(admin), clientInput());

    expect(client.businessName).toBe("Acme Agency");
    expect(client.projectName).toBe("Acme Website");
    expect(client.status).toBe("active");
    expect(client.shareToken.startsWith("clx_ob_")).toBe(true);
    expect(client.createdByUserId.toString()).toBe(admin._id.toString());
    expect(await Project.countDocuments()).toBe(0);
    expect(await ProjectMember.countDocuments()).toBe(0);

    const shareToken = client.shareToken;
    const { client: updated } = await updateClient(
      authContextFor(admin),
      client._id.toString(),
      { businessName: "Acme Renamed" },
      new Set(["businessName"]),
    );

    expect(updated.businessName).toBe("Acme Renamed");
    expect(updated.shareToken).toBe(shareToken);

    const listed = await import("@/lib/clients/list-clients").then((mod) => mod.listClients());
    expect(listed).toHaveLength(1);
    expect(listed[0]?.businessName).toBe("Acme Renamed");
    expect(listed[0]?.status).toBe("active");
    expect(listed[0]?.shareUrl).toContain(`/onboarding/${shareToken}`);

    await deleteClient(client._id.toString());
    expect(await Client.findById(client._id)).toBeNull();
  });

  it("filters clients by active and inactive status and hides inactive public pages", async () => {
    const admin = await createAdmin();
    const { client: activeClient } = await createClient(
      authContextFor(admin),
      clientInput({ businessName: "Active Co" }),
    );
    const { client: inactiveClient } = await createClient(
      authContextFor(admin),
      clientInput({ businessName: "Inactive Co" }),
    );

    await deactivateClient(inactiveClient._id.toString());

    const { listClients } = await import("@/lib/clients/list-clients");
    const all = await listClients();
    const activeOnly = await listClients({ status: "active" });
    const inactiveOnly = await listClients({ status: "inactive" });

    expect(all).toHaveLength(2);
    expect(activeOnly.map((item) => item.businessName)).toEqual(["Active Co"]);
    expect(inactiveOnly.map((item) => item.businessName)).toEqual(["Inactive Co"]);

    await expect(getPublicClientByShareToken(inactiveClient.shareToken)).rejects.toBeInstanceOf(Error);
    const publicActive = await getPublicClientByShareToken(activeClient.shareToken);
    expect(publicActive.businessName).toBe("Active Co");

    const reactivated = await activateClient(inactiveClient._id.toString());
    expect(reactivated.status).toBe("active");
  });

  it("requires confirmation, contact email, and website platforms when a website is selected", () => {
    expect(() =>
      createClientSchema.parse(
        rawClientInput({
          requirementsConfirmed: false,
        }),
      ),
    ).toThrow();

    expect(() =>
      createClientSchema.parse(
        rawClientInput({
          pocEmail: "",
        }),
      ),
    ).toThrow();

    expect(() =>
      createClientSchema.parse(
        rawClientInput({
          projectTypes: ["website"],
          platforms: [],
        }),
      ),
    ).toThrow();

    const parsed = createClientSchema.parse(rawClientInput({ existingSystem: "none", websiteUrl: "" }));
    expect(parsed.websiteUrl).toBeNull();
    expect(parsed.pocEmail).toBe("jane@acme.example.com");
  });

  it("clears website fields when the existing system is none", async () => {
    const admin = await createAdmin();
    const { client } = await createClient(
      authContextFor(admin),
      clientInput({
        existingSystem: "website",
        websiteUrl: "https://old.example.com",
        changeNotes: "Rebuild the homepage.",
      }),
    );

    const { client: updated } = await updateClient(
      authContextFor(admin),
      client._id.toString(),
      { existingSystem: "none" },
      new Set(["existingSystem"]),
    );

    expect(updated.existingSystem).toBe("none");
    expect(updated.websiteUrl).toBeNull();
    expect(updated.changeNotes).toBeNull();
  });

  it("blocks project members from authenticated client APIs", async () => {
    await seedSystemRoles();
    const owner = await User.create({
      name: "Project Owner",
      email: "client-owner@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
      status: "active",
    });
    await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Owner Project",
        websiteUrl: "https://owner-project.example.com",
      }),
    );
    const token = await createAccessToken(owner._id);

    const { GET, POST } = await import("@/app/api/v1/clients/route");
    const listResponse = await GET(bearerRequest(token, "http://localhost/api/v1/clients"));
    const createResponse = await POST(
      bearerRequest(token, "http://localhost/api/v1/clients", {
        method: "POST",
        body: JSON.stringify({
          businessName: "Should Fail",
          websiteUrl: "https://should-fail.example.com",
        }),
      }),
    );

    expect(listResponse.status).toBe(403);
    expect(createResponse.status).toBe(403);
    expect(await Client.countDocuments()).toBe(0);
  });

  it("exposes a public read-only snapshot by token and 404s unknown or deleted tokens", async () => {
    const admin = await createAdmin();
    const { client } = await createClient(
      authContextFor(admin),
      clientInput({ businessName: "Public Co" }),
    );

    const publicClient = await getPublicClientByShareToken(client.shareToken);
    expect(publicClient.businessName).toBe("Public Co");

    const { GET } = await import("@/app/api/v1/onboarding/[shareToken]/route");
    const ok = await GET(new Request(`http://localhost/api/v1/onboarding/${client.shareToken}`), {
      params: Promise.resolve({ shareToken: client.shareToken }),
    });
    const okBody = await ok.json();

    expect(ok.status).toBe(200);
    expect(okBody.success).toBe(true);
    expect(okBody.data.businessName).toBe("Public Co");
    expect(okBody.data).not.toHaveProperty("id");
    expect(okBody.data).not.toHaveProperty("shareToken");
    expect(okBody.data).not.toHaveProperty("createdByUserId");

    const unknownToken = "clx_ob_" + "ab".repeat(24);
    const missing = await GET(new Request(`http://localhost/api/v1/onboarding/${unknownToken}`), {
      params: Promise.resolve({ shareToken: unknownToken }),
    });
    const missingBody = await missing.json();
    expect(missing.status).toBe(404);
    expect(missingBody.message).toBe(CLIENT_SHARE_TOKEN_UNAVAILABLE_MESSAGE);

    await deleteClient(client._id.toString());
    const afterDelete = await GET(new Request(`http://localhost/api/v1/onboarding/${client.shareToken}`), {
      params: Promise.resolve({ shareToken: client.shareToken }),
    });
    expect(afterDelete.status).toBe(404);
    await expect(getPublicClientByShareToken(client.shareToken)).rejects.toBeInstanceOf(Error);
  });

  it("does not remove Clients when an SEO project is deleted", async () => {
    await seedSystemRoles();
    const admin = await createAdmin();
    const { project } = await createProject(
      authContextFor(admin),
      projectInput({
        businessName: "SEO Project",
        websiteUrl: "https://seo-project.example.com",
        ownerUserId: admin._id.toString(),
      }),
    );
    await Project.findByIdAndUpdate(project._id, { status: "inactive" });

    const { client } = await createClient(
      authContextFor(admin),
      clientInput({ businessName: "Keep Me" }),
    );

    await deleteProject(authContextFor(admin), project._id.toString());

    expect(await Project.findById(project._id)).toBeNull();
    expect(await Client.findById(client._id)).not.toBeNull();
  });
});

describe("Client onboarding catalog isolation", () => {
  it("keeps clients.* off project role documents", async () => {
    const { assertKnownPermissions } = await import("@/lib/roles/assert-known-permissions");
    expect(() => assertKnownPermissions(["clients.view"])).toThrow(ValidationError);
  });
});
