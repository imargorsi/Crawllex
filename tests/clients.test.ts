import { describe, expect, it } from "vitest";

import { ValidationError } from "@/lib/api/http-errors";
import { hashPassword } from "@/lib/auth/password";
import { createAccessToken } from "@/lib/auth/tokens";
import { activateClient, deactivateClient } from "@/lib/clients/client-status-actions";
import { CLIENT_SHARE_TOKEN_UNAVAILABLE_MESSAGE } from "@/lib/clients/constants";
import { assertClientIntakeFilesReady } from "@/lib/clients/client-file-storage";
import { createClient } from "@/lib/clients/create-client";
import { deleteClient } from "@/lib/clients/delete-client";
import { getClientById } from "@/lib/clients/get-client";
import { getPublicClientByShareToken } from "@/lib/clients/get-public-client";
import {
  isClientSharePathFormat,
  shouldRefreshClientShareSlug,
  slugifyClientSharePath,
} from "@/lib/clients/share-token";
import { updateClient } from "@/lib/clients/update-client";
import { clientFormErrorStep, earliestClientFormErrorStep } from "@/lib/frontend/clients/client-form-steps.utils";
import { createProject } from "@/lib/projects/create-project";
import { deleteProject } from "@/lib/projects/delete-project";
import { SUPER_ADMIN_ROLE } from "@/lib/rbac/roles";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { Client, Project, ProjectMember, User } from "@/models";
import { serializeClient, serializePublicClient } from "@/lib/serializers/client";
import { createClientSchema, updateClientSchema } from "@/schemas/client";
import { authContextFor, projectInput } from "@/tests/helpers/project-test-utils";

function rawClientInput(overrides: Record<string, unknown> = {}) {
  return {
    businessName: "Acme Agency",
    contactPerson: "Jane Doe",
    pocEmail: "jane@acme.example.com",
    pocContactNumber: "+966500000000",
    businessSummary: "We sell widgets to regional retailers.",
    idealCustomerProfile: "Mid-size retailers in the GCC.",
    projectDescription: "Marketing site with contact forms.",
    projectTypes: ["website"],
    websiteFocus: ["business_website"],
    features: [
      {
        name: "Contact Form",
        whatItDoes: "Let visitors send a message to the sales team.",
      },
    ],
    launchMustHaves: "Home, about, and contact pages.",
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

describe("client share slugs", () => {
  it("builds a kebab path from the business name", () => {
    expect(slugifyClientSharePath("Acme Agency")).toBe("acme-agency");
    expect(slugifyClientSharePath("  Café  Shop  ")).toBe("cafe-shop");
    expect(slugifyClientSharePath("***")).toBe("client");
  });

  it("accepts slugs and legacy tokens", () => {
    expect(isClientSharePathFormat("acme-agency")).toBe(true);
    expect(isClientSharePathFormat("acme-agency-2")).toBe(true);
    expect(isClientSharePathFormat("clx_ob_" + "ab".repeat(24))).toBe(true);
    expect(isClientSharePathFormat("Acme")).toBe(false);
  });

  it("refreshes legacy tokens and renamed businesses", () => {
    expect(shouldRefreshClientShareSlug("clx_ob_" + "ab".repeat(24), "Acme Agency")).toBe(true);
    expect(shouldRefreshClientShareSlug("acme-agency", "Acme Agency")).toBe(false);
    expect(shouldRefreshClientShareSlug("acme-agency-2", "Acme Agency")).toBe(false);
    expect(shouldRefreshClientShareSlug("acme-agency", "Acme Renamed")).toBe(true);
  });
});

describe("client form server error steps", () => {
  it("maps multipart keys to Company and Assets", () => {
    expect(clientFormErrorStep("company_logo")).toBe(0);
    expect(clientFormErrorStep("assets")).toBe(3);
    expect(clientFormErrorStep("launchMustHaves")).toBe(4);
    expect(earliestClientFormErrorStep(["assets", "company_logo"])).toBe(0);
    expect(earliestClientFormErrorStep(["launchMustHaves", "assets"])).toBe(3);
  });

  it("rejects file quota before persist", () => {
    const files = Array.from(
      { length: 11 },
      (_, index) => new File(["x"], `brief-${index}.pdf`, { type: "application/pdf" }),
    );
    expect(() => assertClientIntakeFilesReady([], files)).toThrow(ValidationError);
  });
});

describe("Client onboarding isolation", () => {
  it("lets super_admin create, update, list, and delete a Client without touching projects", async () => {
    const admin = await createAdmin();
    const { client } = await createClient(authContextFor(admin), clientInput());

    expect(client.businessName).toBe("Acme Agency");
    expect(client.projectTypes).toEqual(["website"]);
    expect(client.websiteFocus).toEqual(["business_website"]);
    expect(client.features).toHaveLength(1);
    expect(client.features[0]?.name).toBe("Contact Form");
    expect(client.status).toBe("active");
    expect(client.shareToken).toBe("acme-agency");
    expect(client.createdByUserId.toString()).toBe(admin._id.toString());
    expect(await Project.countDocuments()).toBe(0);
    expect(await ProjectMember.countDocuments()).toBe(0);

    const { client: updated } = await updateClient(
      authContextFor(admin),
      client._id.toString(),
      clientInput({ businessName: "Acme Renamed" }),
    );

    expect(updated.businessName).toBe("Acme Renamed");
    expect(updated.shareToken).toBe("acme-renamed");
    expect(updated.features[0]?.name).toBe("Contact Form");

    const listed = await import("@/lib/clients/list-clients").then((mod) => mod.listClients());
    expect(listed).toHaveLength(1);
    expect(listed[0]?.businessName).toBe("Acme Renamed");
    expect(listed[0]?.contactPerson).toBe("Jane Doe");
    expect(listed[0]?.status).toBe("active");
    expect(listed[0]?.shareUrl).toContain("/onboarding/acme-renamed");

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
    expect(serializePublicClient(publicActive)).not.toHaveProperty("files");
    expect(publicActive.features[0]?.name).toBe("Contact Form");

    const reactivated = await activateClient(inactiveClient._id.toString());
    expect(reactivated.status).toBe("active");
  });

  it("requires confirmation, website focus, and feature rows", () => {
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
          websiteFocus: [],
        }),
      ),
    ).toThrow();

    expect(() =>
      createClientSchema.parse(
        rawClientInput({
          features: [],
        }),
      ),
    ).toThrow();

    const parsed = createClientSchema.parse(rawClientInput());
    expect(parsed.websiteFocus).toEqual(["business_website"]);
    expect(parsed.pocEmail).toBe("jane@acme.example.com");

    expect(() =>
      updateClientSchema.parse(rawClientInput({ requirementsConfirmed: false })),
    ).toThrow();
    expect(() =>
      updateClientSchema.parse(
        rawClientInput({
          projectTypes: ["website"],
          websiteFocus: [],
        }),
      ),
    ).toThrow();
  });

  it("does not require hidden conditionals and requires Other specify when selected", () => {
    expect(() =>
      createClientSchema.parse(
        rawClientInput({
          projectTypes: ["mobile_application"],
          websiteFocus: [],
          mobilePlatforms: ["android"],
        }),
      ),
    ).not.toThrow();

    expect(() =>
      createClientSchema.parse(
        rawClientInput({
          projectTypes: ["other"],
          websiteFocus: [],
          projectTypeOther: "",
        }),
      ),
    ).toThrow();

    const parsed = createClientSchema.parse(
      rawClientInput({
        projectTypes: ["web_application", "other"],
        websiteFocus: [],
        webAppTypes: ["saas", "other"],
        webAppTypeOther: "Custom portal",
        projectTypeOther: "Internal tool",
      }),
    );
    expect(parsed.webAppTypes).toEqual(["saas", "other"]);
    expect(parsed.projectTypeOther).toBe("Internal tool");
  });

  it("stores integrations, links, and notes on the Client row", async () => {
    const admin = await createAdmin();
    const { client } = await createClient(
      authContextFor(admin),
      clientInput({
        integrations: ["email", "other_api"],
        integrationOther: "HubSpot",
        links: [{ linkName: "Brand Kit", url: "https://figma.example.com/file" }],
        notes: "Prefer a light visual tone.",
      }),
    );

    expect(client.integrations).toEqual(["email", "other_api"]);
    expect(client.integrationOther).toBe("HubSpot");
    expect(client.links).toHaveLength(1);
    expect(client.links[0]?.linkName).toBe("Brand Kit");
    expect(client.notes).toBe("Prefer a light visual tone.");
    expect(client.files).toEqual([]);
  });

  it("clears hidden conditionals on update and stores first-class intake fields", async () => {
    const admin = await createAdmin();
    const { client } = await createClient(authContextFor(admin), clientInput());
    expect(client.websiteFocus).toEqual(["business_website"]);

    const { client: updated } = await updateClient(
      authContextFor(admin),
      client._id.toString(),
      clientInput({
        projectTypes: ["mobile_application"],
        websiteFocus: ["business_website"],
        mobilePlatforms: ["ios"],
      }),
    );

    expect(updated.projectTypes).toEqual(["mobile_application"]);
    expect(updated.websiteFocus).toEqual([]);
    expect(updated.mobilePlatforms).toEqual(["ios"]);
    expect(updated.webAppTypes).toEqual([]);
  });

  it("stores Step 4 files on the Client row and omits them from admin blob paths and the public DTO", async () => {
    const admin = await createAdmin();
    const asset = new File(["brief contents"], "brief.pdf", { type: "application/pdf" });
    const { client } = await createClient(authContextFor(admin), clientInput(), {
      assetFiles: [asset],
    });

    expect(client.files).toHaveLength(1);
    expect(client.files[0]?.originalName).toBe("brief.pdf");
    expect(client.files[0]?.kind).toBe("document");
    expect(client.files[0]?.blob.startsWith("blob:client-docs/")).toBe(true);

    const adminDto = serializeClient(client);
    expect(adminDto.files).toHaveLength(1);
    expect(adminDto.files[0]?.originalName).toBe("brief.pdf");
    expect(adminDto.files[0]).not.toHaveProperty("blob");

    const publicDto = serializePublicClient(client);
    expect(publicDto).not.toHaveProperty("files");
    expect(publicDto.links).toEqual([]);

    const { client: cleared } = await updateClient(
      authContextFor(admin),
      client._id.toString(),
      { ...clientInput(), retainedFileIds: [] },
    );
    expect(cleared.files).toEqual([]);
  });

  it("builds a unique business-name slug for the public URL", async () => {
    const admin = await createAdmin();
    const { client: first } = await createClient(authContextFor(admin), clientInput());
    const { client: second } = await createClient(authContextFor(admin), clientInput());

    expect(first.shareToken).toBe("acme-agency");
    expect(second.shareToken).toBe("acme-agency-2");

    const publicFirst = await getPublicClientByShareToken("acme-agency");
    expect(publicFirst._id.toString()).toBe(first._id.toString());
  });

  it("still resolves legacy clx_ob_ share tokens", async () => {
    const admin = await createAdmin();
    const { client } = await createClient(authContextFor(admin), clientInput({ businessName: "Legacy Co" }));
    const legacyToken = "clx_ob_" + "ab".repeat(24);
    client.shareToken = legacyToken;
    await client.save();

    const publicClient = await getPublicClientByShareToken(legacyToken);
    expect(publicClient.businessName).toBe("Legacy Co");
  });

  it("upgrades a leftover clx_ob_ token when super_admin opens the client", async () => {
    const admin = await createAdmin();
    const { client } = await createClient(authContextFor(admin), clientInput({ businessName: "Legacy Co" }));
    client.shareToken = "clx_ob_" + "cd".repeat(24);
    await client.save();

    const opened = await getClientById(client._id.toString());
    expect(opened.shareToken).toBe("legacy-co");
    await expect(getPublicClientByShareToken("legacy-co")).resolves.toMatchObject({
      businessName: "Legacy Co",
    });
  });

  it("lets super_admin view a stored intake file", async () => {
    const admin = await createAdmin();
    const token = await createAccessToken(admin._id);
    const asset = new File(["brief contents"], "brief.pdf", { type: "application/pdf" });
    const { client } = await createClient(authContextFor(admin), clientInput(), {
      assetFiles: [asset],
    });
    const fileId = client.files[0]?.id;
    expect(fileId).toBeTruthy();

    const { GET } = await import("@/app/api/v1/clients/[id]/files/[fileId]/route");
    const response = await GET(
      bearerRequest(token, `http://localhost/api/v1/clients/${client._id.toString()}/files/${fileId}`),
      { params: Promise.resolve({ id: client._id.toString(), fileId: fileId! }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBeTruthy();
    expect(response.headers.get("content-disposition")).toContain("inline");
  });

  it("does not persist intake changes when file persist fails", async () => {
    const admin = await createAdmin();
    const { client } = await createClient(authContextFor(admin), clientInput());
    const badFile = new File(["x"], "notes.exe", { type: "application/octet-stream" });

    await expect(
      updateClient(
        authContextFor(admin),
        client._id.toString(),
        clientInput({ businessName: "Should Not Stick" }),
        { assetFiles: [badFile] },
      ),
    ).rejects.toBeInstanceOf(ValidationError);

    const reloaded = await Client.findById(client._id);
    expect(reloaded?.businessName).toBe("Acme Agency");
    expect(reloaded?.files).toEqual([]);
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
    expect(okBody.data.features[0].name).toBe("Contact Form");
    expect(okBody.data.links).toEqual([]);
    expect(okBody.data).not.toHaveProperty("id");
    expect(okBody.data).not.toHaveProperty("shareToken");
    expect(okBody.data).not.toHaveProperty("createdByUserId");
    expect(okBody.data).not.toHaveProperty("files");

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
