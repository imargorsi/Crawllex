import { describe, expect, it } from "vitest";

import { hashPassword } from "@/lib/auth/password";
import { createProject } from "@/lib/projects/create-project";
import { getProjectAccessForUser } from "@/lib/projects/get-project-access";
import { hasPermission } from "@/lib/rbac/access";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { PROJECT_USER_ROLE } from "@/lib/rbac/roles";
import { createReport, deleteReport, getReport, listReports } from "@/lib/reports/report-service";
import { AnalyticsDailyMetric, Lead, Project, ProjectMember, Role, SeoActivity, User } from "@/models";
import { createReportSchema } from "@/schemas/reports";
import { authContextFor, projectInput } from "@/tests/helpers/project-test-utils";

async function seedProject() {
  await seedSystemRoles();
  const owner = await User.create({
    name: "Report Owner",
    email: "report-owner@example.com",
    password: await hashPassword("password"),
    emailVerifiedAt: new Date(),
    roles: [],
  });
  const { project } = await createProject(
    authContextFor(owner),
    projectInput({ businessName: "Silver Foundation", websiteUrl: "https://silver.example.com" }),
  );
  await Project.findByIdAndUpdate(project._id, { status: "active" });
  return { owner, projectId: project._id.toString() };
}

describe("report service", () => {
  it("collects cached data, stores a snapshot, and lists, reads and deletes it", async () => {
    const { owner, projectId } = await seedProject();

    await AnalyticsDailyMetric.create([
      { projectId, date: "2026-09-02", source: "gsc", clicks: 40, impressions: 1000, ctr: 0.04, position: 12 },
      { projectId, date: "2026-09-03", source: "gsc", clicks: 60, impressions: 1500, ctr: 0.04, position: 10 },
      { projectId, date: "2026-08-10", source: "gsc", clicks: 50, impressions: 1200, ctr: 0.04, position: 14 },
      { projectId, date: "2026-09-02", source: "ga4", sessions: 120, totalUsers: 90, newUsers: 40, engagedSessions: 60, organicSessions: 50 },
      { projectId, date: "2026-08-10", source: "ga4", sessions: 100, totalUsers: 80, newUsers: 30, engagedSessions: 50, organicSessions: 40 },
    ]);
    await Lead.create({
      projectId,
      firstName: "Sara",
      lastName: "",
      email: "sara@example.com",
      message: "Need a quote",
      leadDate: "2026-09-04",
      normalizedEmail: "sara@example.com",
      origin: "wordpress",
      createdBy: owner._id,
      updatedBy: owner._id,
    });
    await SeoActivity.create({
      projectId,
      activityType: "blogs",
      url: "https://silver.example.com/blog/curing",
      occurredOn: "2026-09-05",
      title: "Concrete Curing Guide",
      createdBy: owner._id,
      updatedBy: owner._id,
    });

    const input = createReportSchema.parse({
      periodFrom: "2026-09-01",
      periodTo: "2026-09-30",
      written: { work: [{ type: "paragraph", runs: [{ text: "Arabic landing page live." }] }] },
      nextSteps: [{ type: "paragraph", runs: [{ text: "Review translation." }] }],
    });
    const report = await createReport(projectId, String(owner._id), input);

    expect(report.title).toBe("Silver Foundation — September 2026");
    expect(report.snapshot.period.previousLabel).toBe("1 August 2026 – 31 August 2026");
    expect(report.snapshot.gsc.current.clicks).toBe(100);
    expect(report.snapshot.gsc.previous.clicks).toBe(50);
    expect(report.snapshot.ga4.current.sessions).toBe(120);
    expect(report.snapshot.leads.total).toBe(1);
    expect(report.snapshot.leads.byOrigin).toEqual({ wordpress: 1 });
    expect(report.snapshot.activities.current.blogs).toBe(1);
    expect(report.snapshot.activities.blogs[0]?.title).toBe("Concrete Curing Guide");
    expect(report.snapshot.notes.nextSteps).toEqual([{ type: "paragraph", runs: [{ text: "Review translation." }] }]);
    expect(report.summary).toContain("During September 2026");
    expect(report.snapshot.notes.written?.work).toEqual([{ type: "paragraph", runs: [{ text: "Arabic landing page live." }] }]);

    const list = await listReports(projectId);
    expect(list).toHaveLength(1);
    expect(list[0]).not.toHaveProperty("snapshot");

    const detail = await getReport(projectId, report.id);
    expect(detail?.snapshot.project.name).toBe("Silver Foundation");

    expect(await getReport(projectId, "000000000000000000000000")).toBeNull();
    expect(await getReport(projectId, "not-an-id")).toBeNull();

    expect(await deleteReport(projectId, report.id)).toBe(true);
    expect(await deleteReport(projectId, report.id)).toBe(false);
    expect(await listReports(projectId)).toHaveLength(0);
  });

  it("gives project_user report view and create, but not delete", async () => {
    const { projectId } = await seedProject();
    const role = await Role.findOne({ slug: PROJECT_USER_ROLE });
    const member = await User.create({
      name: "Viewer",
      email: "viewer@example.com",
      password: await hashPassword("password"),
      emailVerifiedAt: new Date(),
      roles: [],
    });
    await ProjectMember.create({
      projectId,
      userId: member._id,
      roleId: role!._id,
      status: "active",
    });

    const access = await getProjectAccessForUser(authContextFor(member), projectId);
    expect(access).not.toBeNull();
    expect(hasPermission(access!.permissions, "reports.view")).toBe(true);
    expect(hasPermission(access!.permissions, "reports.create")).toBe(true);
    expect(hasPermission(access!.permissions, "reports.delete")).toBe(false);
  });
});
