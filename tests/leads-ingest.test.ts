import { describe, expect, it } from "vitest";

import { UnauthorizedError, ValidationError } from "@/lib/api/http-errors";
import { hashPassword } from "@/lib/auth/password";
import { guessLeadFieldFromHeader, suggestLeadColumnMapping } from "@/lib/leads/column-aliases";
import {
  LEAD_DUPLICATE_MESSAGE,
  LEAD_EXTRAS_MAX_KEYS,
  LEAD_INGEST_IDEMPOTENCY_KEY_MAX_LENGTH,
  LEAD_INGEST_KEY_HEADER,
} from "@/lib/leads/constants";
import {
  ingestLeadFromSource,
  verifyLeadSourceIngest,
} from "@/lib/leads/ingest-lead";
import {
  extractLeadSourcePlainKey,
  readJsonBody,
  requireLeadSourceFromRequest,
} from "@/lib/leads/lead-source-auth";
import {
  createLeadSource,
  disconnectLeadSource,
  rotateLeadSourceKey,
} from "@/lib/leads/manage-lead-source";
import { todayLeadDate } from "@/lib/leads/normalize";
import { createProject } from "@/lib/projects/create-project";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { Lead, LeadSource, Project, User } from "@/models";
import { ingestLeadSchema } from "@/schemas/lead";
import { authContextFor, projectInput } from "@/tests/helpers/project-test-utils";

function ingestInput(
  overrides: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    message: string;
    servicesInterestedIn: string | null;
    leadDate: string;
    extras: Record<string, string>;
    idempotencyKey: string;
    pluginVersion: string;
  }> = {},
) {
  return ingestLeadSchema.parse({
    firstName: "Pat",
    email: "pat@example.com",
    phone: "+1 (555) 010-3000",
    message: "Need a quote.",
    idempotencyKey: "cf7-form-abc12345",
    pluginVersion: "1.0.0",
    ...overrides,
  });
}

async function seedConnectedSource() {
  await seedSystemRoles();

  const owner = await User.create({
    name: "Ingest Owner",
    email: "ingest-owner@example.com",
    password: await hashPassword("password"),
    emailVerifiedAt: new Date(),
    roles: [],
  });

  const { project } = await createProject(
    authContextFor(owner),
    projectInput({
      businessName: "Ingest Project",
      websiteUrl: "https://ingest.example.com",
    }),
  );
  await Project.findByIdAndUpdate(project._id, { status: "active" });

  const created = await createLeadSource(authContextFor(owner), project._id.toString());
  const source = await LeadSource.findById(created.source.id);
  if (!source) throw new Error("Lead source missing after create.");

  return { owner, project, source, plaintextKey: created.plaintextKey, auth: authContextFor(owner) };
}

describe("Lead ingest", () => {
  it("reads the lead source key from the dedicated header or bearer token", () => {
    const fromHeader = new Request("http://localhost/api/v1/leads/ingest/verify", {
      headers: { [LEAD_INGEST_KEY_HEADER]: " clx_ls_abc " },
    });
    expect(extractLeadSourcePlainKey(fromHeader)).toBe("clx_ls_abc");

    const fromBearer = new Request("http://localhost/api/v1/leads/ingest/verify", {
      headers: { authorization: "Bearer clx_ls_def" },
    });
    expect(extractLeadSourcePlainKey(fromBearer)).toBe("clx_ls_def");

    const missing = new Request("http://localhost/api/v1/leads/ingest/verify");
    expect(extractLeadSourcePlainKey(missing)).toBeNull();
  });

  it("stamps the WordPress site URL from verify", async () => {
    const { source } = await seedConnectedSource();

    await verifyLeadSourceIngest(source, "https://wp.example.com/blog/?utm=1");
    const reloaded = await LeadSource.findById(source._id);
    expect(reloaded?.siteUrl).toBe("https://wp.example.com/blog");
  });

  it("verifies a connected key on an active project and stamps lastVerifiedAt", async () => {
    const { source } = await seedConnectedSource();

    const payload = await verifyLeadSourceIngest(source);
    expect(payload.source.id).toBe(String(source._id));
    expect(payload.source.provider).toBe("wordpress");

    const reloaded = await LeadSource.findById(source._id);
    expect(reloaded?.lastVerifiedAt).toBeInstanceOf(Date);
    expect(reloaded?.lastError).toBeNull();
  });

  it("rejects verify and ingest when the project is inactive", async () => {
    const { project, source } = await seedConnectedSource();
    await Project.findByIdAndUpdate(project._id, { status: "inactive" });

    await expect(verifyLeadSourceIngest(source)).rejects.toBeInstanceOf(ValidationError);
    await expect(ingestLeadFromSource(source, ingestInput())).rejects.toBeInstanceOf(ValidationError);

    const reloaded = await LeadSource.findById(source._id);
    expect(reloaded?.failedCount).toBe(1);
    expect(reloaded?.ingestCount).toBe(0);
    expect(reloaded?.lastError).toBeTruthy();
  });

  it("ingests a wordpress lead with extras, defaults leadDate, and attributes createdBy", async () => {
    const { owner, project, source } = await seedConnectedSource();

    const { lead, replayed } = await ingestLeadFromSource(
      source,
      ingestInput({
        lastName: "Lee",
        servicesInterestedIn: "Local SEO",
        extras: { Subject: "Pricing", firstName: "ignored-core" },
      }),
    );

    expect(replayed).toBe(false);
    expect(lead.origin).toBe("wordpress");
    expect(lead.leadDate).toBe(todayLeadDate());
    expect(lead.lastName).toBe("Lee");
    expect(lead.extras).toEqual({ Subject: "Pricing" });
    expect(String(lead.leadSourceId)).toBe(String(source._id));
    expect(String(lead.createdBy)).toBe(String(owner._id));
    expect(String(lead.projectId)).toBe(String(project._id));

    const reloaded = await LeadSource.findById(source._id);
    expect(reloaded?.ingestCount).toBe(1);
    expect(reloaded?.failedCount).toBe(0);
    expect(reloaded?.lastIngestedAt).toBeInstanceOf(Date);
    expect(reloaded?.lastError).toBeNull();
  });

  it("ingests a wordpress lead when phone is omitted and extras carry the answers", async () => {
    const { source } = await seedConnectedSource();
    const input = ingestLeadSchema.parse({
      firstName: "Website Visitor",
      email: "quote@example.com",
      message: "Company: Acme\nBudget: 5k",
      extras: { Company: "Acme", Budget: "5k" },
      idempotencyKey: "el-form-missing-phone",
      pluginVersion: "0.1.0",
    });

    expect(input.phone).toBe("");

    const { lead } = await ingestLeadFromSource(source, input);
    expect(lead.phone).toBe("");
    expect(lead.normalizedPhone).toBe("");
    expect(lead.firstName).toBe("Website Visitor");
    expect(lead.extras).toEqual({ Company: "Acme", Budget: "5k" });
  });

  it("replays the same idempotency key without creating a second lead", async () => {
    const { source } = await seedConnectedSource();
    const input = ingestInput({ idempotencyKey: "retry-key-0001" });

    const first = await ingestLeadFromSource(source, input);
    const second = await ingestLeadFromSource(source, input);

    expect(second.replayed).toBe(true);
    expect(String(second.lead._id)).toBe(String(first.lead._id));
    expect(await Lead.countDocuments({ leadSourceId: source._id })).toBe(1);

    const reloaded = await LeadSource.findById(source._id);
    expect(reloaded?.ingestCount).toBe(1);
  });

  it("rejects a new submission with the same email and phone", async () => {
    const { source } = await seedConnectedSource();
    await ingestLeadFromSource(source, ingestInput({ idempotencyKey: "first-submit-01" }));

    await expect(
      ingestLeadFromSource(
        source,
        ingestInput({
          idempotencyKey: "second-submit-02",
        }),
      ),
    ).rejects.toMatchObject({
      message: LEAD_DUPLICATE_MESSAGE,
    });

    const reloaded = await LeadSource.findById(source._id);
    expect(reloaded?.failedCount).toBe(1);
    expect(reloaded?.ingestCount).toBe(1);
  });

  it("rejects a rotated or missing key", async () => {
    const { source, plaintextKey, auth } = await seedConnectedSource();

    await expect(
      requireLeadSourceFromRequest(new Request("http://localhost/api/v1/leads/ingest", {
        headers: { authorization: "Bearer not-a-real-key" },
      })),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    await rotateLeadSourceKey(auth, String(source.projectId), String(source._id));

    await expect(
      requireLeadSourceFromRequest(new Request("http://localhost/api/v1/leads/ingest", {
        headers: { [LEAD_INGEST_KEY_HEADER]: plaintextKey },
      })),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects a disconnected key", async () => {
    const { source, plaintextKey } = await seedConnectedSource();
    await disconnectLeadSource(String(source.projectId), String(source._id));

    await expect(
      requireLeadSourceFromRequest(new Request("http://localhost/api/v1/leads/ingest", {
        headers: { [LEAD_INGEST_KEY_HEADER]: plaintextKey },
      })),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects too many extras and ignores unknown top-level fields", () => {
    const tooMany: Record<string, string> = {};
    for (let i = 0; i <= LEAD_EXTRAS_MAX_KEYS; i += 1) {
      tooMany[`extra-${i}`] = "value";
    }
    expect(() => ingestInput({ extras: tooMany })).toThrow();

    const parsed = ingestLeadSchema.parse({
      firstName: "Pat",
      email: "pat@example.com",
      phone: "+1 (555) 010-3000",
      message: "Need a quote.",
      idempotencyKey: "cf7-form-abc12345",
      pluginVersion: "1.0.0",
      Topic: "Should not land on the payload",
    } satisfies Record<string, string>);
    expect(parsed.extras).toEqual({});
    expect("Topic" in parsed).toBe(false);
  });

  it("rejects ingest JSON that exceeds the body cap", async () => {
    const request = new Request("http://localhost/api/v1/leads/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "x".repeat(80),
    });
    await expect(readJsonBody(request, 40)).rejects.toMatchObject({ statusCode: 413 });
  });

  it("rejects the public ingest route without a lead source key", async () => {
    const { POST } = await import("@/app/api/v1/leads/ingest/route");
    const response = await POST(
      new Request("http://localhost/api/v1/leads/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("verifies through the public route with a valid key", async () => {
    const { plaintextKey } = await seedConnectedSource();
    const { POST } = await import("@/app/api/v1/leads/ingest/verify/route");
    const response = await POST(
      new Request("http://localhost/api/v1/leads/ingest/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [LEAD_INGEST_KEY_HEADER]: plaintextKey,
        },
        body: JSON.stringify({ pluginVersion: "1.0.0" }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.source.provider).toBe("wordpress");
  });

  it("maps Contact Form 7 tags the same way the plugin does", () => {
    expect(guessLeadFieldFromHeader("your-name")).toBe("firstName");
    expect(guessLeadFieldFromHeader("your-email")).toBe("email");
    expect(guessLeadFieldFromHeader("your-phone")).toBe("phone");
    expect(guessLeadFieldFromHeader("your-tel")).toBe("phone");
    expect(guessLeadFieldFromHeader("your-message")).toBe("message");
    expect(guessLeadFieldFromHeader("your-last-name")).toBe("lastName");
    expect(guessLeadFieldFromHeader("your-service")).toBe("servicesInterestedIn");
    expect(guessLeadFieldFromHeader("your-subject")).toBeNull();

    const mapping = suggestLeadColumnMapping([
      "your-name",
      "your-email",
      "your-phone",
      "your-message",
      "your-subject",
    ]);
    expect(mapping).toMatchObject({
      firstName: "your-name",
      email: "your-email",
      phone: "your-phone",
      message: "your-message",
    });
    expect(mapping.extras).toEqual(["your-subject"]);
  });

  it("maps Elementor form labels the same way the plugin does", () => {
    expect(guessLeadFieldFromHeader("name")).toBe("firstName");
    expect(guessLeadFieldFromHeader("Name")).toBe("firstName");
    expect(guessLeadFieldFromHeader("Full Name")).toBe("firstName");
    expect(guessLeadFieldFromHeader("email")).toBe("email");
    expect(guessLeadFieldFromHeader("Email")).toBe("email");
    expect(guessLeadFieldFromHeader("tel")).toBe("phone");
    expect(guessLeadFieldFromHeader("Phone")).toBe("phone");
    expect(guessLeadFieldFromHeader("message")).toBe("message");
    expect(guessLeadFieldFromHeader("Message")).toBe("message");

    const mapping = suggestLeadColumnMapping(["Name", "Email", "Phone", "Message", "Company"]);
    expect(mapping).toMatchObject({
      firstName: "Name",
      email: "Email",
      phone: "Phone",
      message: "Message",
    });
    expect(mapping.extras).toEqual(["Company"]);

    const elementorKey = `el-abc123-${"b".repeat(40)}`;
    expect(ingestLeadSchema.parse({
      firstName: "Amina",
      email: "amina@example.com",
      phone: "+92 300 1234567",
      message: "Quote for Crown Axis.",
      extras: { Company: "Crown Axis" },
      idempotencyKey: elementorKey,
      pluginVersion: "0.1.0",
    }).extras).toEqual({ Company: "Crown Axis" });
  });

  it("maps WPForms labels the same way the plugin does", () => {
    expect(guessLeadFieldFromHeader("Name")).toBe("firstName");
    expect(guessLeadFieldFromHeader("first name")).toBe("firstName");
    expect(guessLeadFieldFromHeader("last name")).toBe("lastName");
    expect(guessLeadFieldFromHeader("Email")).toBe("email");
    expect(guessLeadFieldFromHeader("Phone")).toBe("phone");
    expect(guessLeadFieldFromHeader("Comment or Message")).toBe("message");

    const mapping = suggestLeadColumnMapping([
      "Name",
      "Email",
      "Phone",
      "Comment or Message",
      "Company",
    ]);
    expect(mapping).toMatchObject({
      firstName: "Name",
      email: "Email",
      phone: "Phone",
      message: "Comment or Message",
    });
    expect(mapping.extras).toEqual(["Company"]);

    const wpformsKey = `wp-5-${"c".repeat(40)}`;
    expect(ingestLeadSchema.parse({
      firstName: "Amina",
      lastName: "Khan",
      email: "amina@example.com",
      phone: "+92 300 1234567",
      message: "Quote for Crown Axis.",
      extras: { Company: "Crown Axis" },
      idempotencyKey: wpformsKey,
      pluginVersion: "0.4.0",
    }).extras).toEqual({ Company: "Crown Axis" });
  });

  it("accepts a Contact Form 7 plugin payload through the public ingest route", async () => {
    const { owner, plaintextKey } = await seedConnectedSource();
    const idempotencyKey = `cf7-12-${"a".repeat(40)}`;
    expect(idempotencyKey.length).toBeLessThanOrEqual(LEAD_INGEST_IDEMPOTENCY_KEY_MAX_LENGTH);

    const pluginBody = {
      firstName: "Amina",
      email: "amina@example.com",
      phone: "+92 300 1234567",
      message: "Quote for Crown Axis.",
      extras: { "your-subject": "Get a Quote" },
      idempotencyKey,
      pluginVersion: "0.1.0",
    };

    const parsed = ingestLeadSchema.parse(pluginBody);
    expect(parsed.leadDate).toBe(todayLeadDate());
    expect(parsed.extras).toEqual({ "your-subject": "Get a Quote" });
    expect("your-subject" in parsed).toBe(false);

    const { POST } = await import("@/app/api/v1/leads/ingest/route");
    const requestInit = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [LEAD_INGEST_KEY_HEADER]: plaintextKey,
      },
      body: JSON.stringify(pluginBody),
    } as const;

    const created = await POST(new Request("http://localhost/api/v1/leads/ingest", requestInit));
    const createdBody = await created.json();
    expect(created.status).toBe(201);
    expect(createdBody.success).toBe(true);
    expect(createdBody.message).toBe("Lead ingested.");
    expect(createdBody.data.replayed).toBe(false);
    expect(createdBody.data.lead.origin).toBe("wordpress");
    expect(createdBody.data.lead.firstName).toBe("Amina");
    expect(createdBody.data.lead.extras).toEqual({ "your-subject": "Get a Quote" });

    const stored = await Lead.findById(createdBody.data.lead.id);
    expect(String(stored?.createdBy)).toBe(String(owner._id));
    expect(stored?.idempotencyKey).toBe(idempotencyKey);

    const replayed = await POST(new Request("http://localhost/api/v1/leads/ingest", requestInit));
    const replayedBody = await replayed.json();
    expect(replayed.status).toBe(200);
    expect(replayedBody.message).toBe("Lead already ingested.");
    expect(replayedBody.data.replayed).toBe(true);
    expect(replayedBody.data.lead.id).toBe(createdBody.data.lead.id);
  });
});
