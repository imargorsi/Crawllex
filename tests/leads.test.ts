import { describe, expect, it } from "vitest";

import { hashPassword } from "@/lib/auth/password";
import { NotFoundError, ValidationError } from "@/lib/api/http-errors";
import { suggestLeadColumnMapping } from "@/lib/leads/column-aliases";
import { commitLeadsImport } from "@/lib/leads/commit-import";
import { createLead } from "@/lib/leads/create-lead";
import { deleteLead } from "@/lib/leads/delete-lead";
import { extrasRecordFromDoc } from "@/lib/leads/extras.utils";
import { listLeads } from "@/lib/leads/list-leads";
import { LEAD_DATE_USE_TODAY } from "@/lib/leads/constants";
import { parseLeadCsvText } from "@/lib/leads/parse-csv";
import { previewLeadsImport } from "@/lib/leads/preview-import";
import { todayLeadDate } from "@/lib/leads/normalize";
import { updateLead } from "@/lib/leads/update-lead";
import { createProject } from "@/lib/projects/create-project";
import { requireProjectPermission } from "@/lib/projects/get-project-access";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { Lead, Project, User } from "@/models";
import { createLeadSchema } from "@/schemas/lead";
import { authContextFor, projectInput } from "@/tests/helpers/project-test-utils";

function csvFile(name: string, content: string): File {
  return new File([content], name, { type: "text/csv" });
}

describe("Leads CRUD", () => {
  it("creates, lists, updates, and deletes within an active project", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Lead Owner",
      email: "lead-owner@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Lead Project",
        websiteUrl: "https://leads.example.com",
      }),
    );
    await Project.findByIdAndUpdate(project._id, { status: "active" });

    const projectId = project._id.toString();
    const auth = authContextFor(owner);
    const leadDate = todayLeadDate();

    const { lead } = await createLead(auth, projectId, {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "+1 (555) 010-2000",
      servicesInterestedIn: "Local SEO",
      message: "Please call me back.",
      leadDate,
    });

    expect(lead.origin).toBe("manual");
    expect(lead.leadDate).toBe(leadDate);
    expect(lead.firstName).toBe("Jane");
    expect(lead.lastName).toBe("Doe");
    expect(lead.normalizedEmail).toBe("jane@example.com");
    expect(lead.normalizedPhone).toBe("15550102000");

    const listed = await listLeads(projectId, {
      page: 1,
      per_page: 10,
      from: undefined,
      to: undefined,
      q: undefined,
    });

    expect(listed.items).toHaveLength(1);
    expect(listed.filters.counts.total).toBe(1);
    expect(listed.filters.counts.this_month).toBe(1);
    expect(listed.items[0]?.id).toBe(lead._id.toString());
    expect(listed.items[0]?.firstName).toBe("Jane");

    const { lead: updated } = await updateLead(auth, projectId, lead._id.toString(), {
      firstName: "Jane",
      lastName: "D.",
      email: "jane@example.com",
      phone: "+1 555 010 2000",
      servicesInterestedIn: null,
      message: "Updated note",
      leadDate,
    });

    expect(updated.lastName).toBe("D.");
    expect(updated.servicesInterestedIn).toBeNull();

    await deleteLead(projectId, lead._id.toString());
    expect(await Lead.countDocuments({ projectId })).toBe(0);
  });

  it("rejects duplicate email+phone and inactive project create", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Dup Owner",
      email: "lead-dup@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Dup Project",
        websiteUrl: "https://dup.example.com",
      }),
    );
    const projectId = project._id.toString();
    const auth = authContextFor(owner);
    const leadDate = todayLeadDate();

    await expect(
      createLead(auth, projectId, {
        firstName: "Pending",
        lastName: "Lead",
        email: "a@example.com",
        phone: "5551112222",
        servicesInterestedIn: null,
        message: "Hello",
        leadDate,
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await Project.findByIdAndUpdate(project._id, { status: "active" });

    await createLead(auth, projectId, {
      firstName: "First",
      lastName: "Person",
      email: "a@example.com",
      phone: "555-111-2222",
      servicesInterestedIn: null,
      message: "Hello",
      leadDate,
    });

    await expect(
      createLead(auth, projectId, {
        firstName: "Second",
        lastName: "Person",
        email: "A@example.com",
        phone: "(555) 111 2222",
        servicesInterestedIn: null,
        message: "Hi again",
        leadDate,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects cross-project update and delete", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Owner A",
      email: "lead-cross-owner@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });

    const { project: projectA } = await createProject(
      authContextFor(owner),
      projectInput({ businessName: "A", websiteUrl: "https://a-leads.example.com" }),
    );
    await Project.findByIdAndUpdate(projectA._id, { status: "active" });
    const { project: projectB } = await createProject(
      authContextFor(owner),
      projectInput({ businessName: "B", websiteUrl: "https://b-leads.example.com" }),
    );
    await Project.findByIdAndUpdate(projectB._id, { status: "active" });

    const auth = authContextFor(owner);
    const leadDate = todayLeadDate();
    const { lead } = await createLead(auth, projectA._id.toString(), {
      firstName: "Cross",
      lastName: "Lead",
      email: "cross@example.com",
      phone: "5559998888",
      servicesInterestedIn: null,
      message: "Msg",
      leadDate,
    });

    await expect(
      updateLead(auth, projectB._id.toString(), lead._id.toString(), {
        firstName: "Nope",
        lastName: "Lead",
        email: "cross@example.com",
        phone: "5559998888",
        servicesInterestedIn: null,
        message: "Msg",
        leadDate,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(deleteLead(projectB._id.toString(), lead._id.toString())).rejects.toBeInstanceOf(
      NotFoundError,
    );

    const outsiderDenied = await requireProjectPermission(
      authContextFor(owner),
      "000000000000000000000000",
      "leads.import",
    );
    expect(outsiderDenied).toBeInstanceOf(Response);
    expect(outsiderDenied?.status).toBe(404);
  });
});

describe("Leads CSV import", () => {
  it("parses headers, suggests aliases, and imports non-duplicates", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Import Owner",
      email: "lead-import@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });
    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Import Project",
        websiteUrl: "https://import.example.com",
      }),
    );
    await Project.findByIdAndUpdate(project._id, { status: "active" });
    const projectId = project._id.toString();
    const auth = authContextFor(owner);

    const csv = [
      "First Name,Last Name,Email Address,Mobile,Comments,Date",
      "Alice,Smith,alice@example.com,5551110001,Hello,2026-01-15",
      "Bob,Jones,bob@example.com,5551110002,Hi,2026-02-01",
      "Alice,Dup,alice@example.com,555-111-0001,Again,2026-01-15",
      ",,,,bad,",
    ].join("\n");

    const parsed = parseLeadCsvText(csv);
    expect(parsed.headers).toEqual([
      "First Name",
      "Last Name",
      "Email Address",
      "Mobile",
      "Comments",
      "Date",
    ]);
    expect(suggestLeadColumnMapping(parsed.headers)).toMatchObject({
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email Address",
      phone: "Mobile",
      message: "Comments",
      leadDate: "Date",
      servicesInterestedIn: "",
    });

    const file = csvFile("leads.csv", csv);
    const preview = await previewLeadsImport(file);
    expect(preview.rowCount).toBe(4);

    const result = await commitLeadsImport(auth, projectId, file, {
      ...preview.suggestedMapping,
      servicesInterestedIn: "",
    });
    expect(result.imported).toBe(2);
    expect(result.skippedDuplicates).toBe(1);
    expect(result.skippedInvalid).toBe(1);
    expect(await Lead.countDocuments({ projectId, origin: "csv_import" })).toBe(2);

    const alice = await Lead.findOne({ projectId, email: "alice@example.com" });
    expect(alice?.firstName).toBe("Alice");
    expect(alice?.lastName).toBe("Smith");
    expect(alice?.leadDate).toBe("2026-01-15");
    expect(alice?.servicesInterestedIn).toBeNull();

    const second = await commitLeadsImport(auth, projectId, file, preview.suggestedMapping);
    expect(second.imported).toBe(0);
    expect(second.skippedDuplicates).toBe(3);
    expect(second.skippedInvalid).toBe(1);
  });

  it("keeps unmapped CSV columns as extras", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Extras Import",
      email: "lead-extras-import@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });
    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Extras Import",
        websiteUrl: "https://extras-import.example.com",
      }),
    );
    await Project.findByIdAndUpdate(project._id, { status: "active" });
    const projectId = project._id.toString();

    const csv = [
      "Name,Email Address,Phone Number,Academic Editing,Subject / Topic,Wordcount,Message",
      "Sam Lee,sam@example.com,5553334444,Proofreading,Thesis chapter,2500,Please quote",
    ].join("\n");

    const suggested = suggestLeadColumnMapping(parseLeadCsvText(csv).headers);
    expect(suggested.firstName).toBe("Name");
    expect(suggested.email).toBe("Email Address");
    expect(suggested.phone).toBe("Phone Number");
    expect(suggested.servicesInterestedIn).toBe("Academic Editing");
    expect(suggested.message).toBe("Message");
    expect(suggested.extras).toEqual(["Subject / Topic", "Wordcount"]);

    const result = await commitLeadsImport(
      authContextFor(owner),
      projectId,
      csvFile("quote.csv", csv),
      suggested,
    );
    expect(result).toEqual({
      imported: 1,
      skippedDuplicates: 0,
      skippedInvalid: 0,
    });

    const lead = await Lead.findOne({ projectId, email: "sam@example.com" });
    expect(lead?.firstName).toBe("Sam Lee");
    expect(lead?.servicesInterestedIn).toBe("Proofreading");
    expect(extrasRecordFromDoc(lead?.extras)).toEqual({
      "Subject / Topic": "Thesis chapter",
      Wordcount: "2500",
    });

    const listed = await listLeads(projectId, {
      page: 1,
      per_page: 10,
      from: undefined,
      to: undefined,
      q: undefined,
    });
    expect(listed.items[0]?.extras).toEqual({
      "Subject / Topic": "Thesis chapter",
      Wordcount: "2500",
    });
  });

  it("defaults date to today when mapping uses today sentinel", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Today Import",
      email: "lead-today-import@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });
    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Today Import",
        websiteUrl: "https://today-import.example.com",
      }),
    );
    await Project.findByIdAndUpdate(project._id, { status: "active" });

    const csv = [
      "First Name,Last Name,Email,Phone,Message",
      "Pat,Lee,pat@example.com,5552223333,Hi",
    ].join("\n");

    const result = await commitLeadsImport(
      authContextFor(owner),
      project._id.toString(),
      csvFile("today.csv", csv),
      {
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        phone: "Phone",
        message: "Message",
        servicesInterestedIn: "",
        leadDate: LEAD_DATE_USE_TODAY,
        extras: [],
      },
    );

    expect(result.imported).toBe(1);
    const lead = await Lead.findOne({ projectId: project._id });
    expect(lead?.leadDate).toBe(todayLeadDate());
  });

  it("rejects import when project is inactive", async () => {
    await seedSystemRoles();

    const owner = await User.create({
      name: "Inactive Import",
      email: "lead-inactive-import@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });
    const { project } = await createProject(
      authContextFor(owner),
      projectInput({
        businessName: "Inactive Import",
        websiteUrl: "https://inactive-import.example.com",
      }),
    );

    const csv = [
      "First Name,Last Name,Email,Phone,Message",
      "Pat,Lee,pat@example.com,5552223333,Hi",
    ].join("\n");

    await expect(
      commitLeadsImport(authContextFor(owner), project._id.toString(), csvFile("x.csv", csv), {
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        phone: "Phone",
        message: "Message",
        servicesInterestedIn: "",
        leadDate: LEAD_DATE_USE_TODAY,
        extras: [],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("validates create payload with zod", () => {
    const ok = createLeadSchema.safeParse({
      firstName: "Sam",
      email: "sam@example.com",
      phone: "5554443333",
      message: "Hello",
      leadDate: "2026-03-01",
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.lastName).toBe("");
      expect(ok.data.servicesInterestedIn).toBeNull();
    }

    const bad = createLeadSchema.safeParse({
      firstName: "",
      lastName: "",
      email: "not-an-email",
      phone: "12",
      message: "",
      leadDate: "nope",
    });
    expect(bad.success).toBe(false);
  });
});
