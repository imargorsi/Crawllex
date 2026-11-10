import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendMail } from "@/lib/mail/client";
import { reportReadyMailContent } from "@/lib/mail/templates";
import { deliverReportEmails, reportDashboardUrl } from "@/lib/reports/report-delivery";
import { createReport, listReports } from "@/lib/reports/report-service";
import { Report, User } from "@/models";
import { createReportSchema } from "@/schemas/reports";
import { seedProject } from "@/tests/helpers/report-test-utils";

vi.mock("@/lib/mail/client", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/mail/client")>()), sendMail: vi.fn() }));

const sendMailMock = vi.mocked(sendMail);
const fakePdf = Buffer.from("%PDF-1.4 test");
const renderPdf = vi.fn(async () => fakePdf);

/** Seeds a project. Project creation sends its own owner mail, so the mock is cleared afterwards. */
async function seedTestProject() {
  const seeded = await seedProject();
  sendMailMock.mockClear();
  return seeded;
}

/** Delivery entries stored on the report document, one per recipient. */
async function deliveriesOf(reportId: string) {
  const doc = await Report.findById(reportId).lean<{ notes?: { deliveries?: { status: string; error: string | null }[] } }>();
  return doc?.notes?.deliveries ?? [];
}

/**
 * Creates a report without recipients, so creation does not start its own background delivery.
 * The recipients are then set on the returned object and delivered explicitly by each test.
 */
async function createTestReport(projectId: string, userId: string, recipientUserIds: string[]) {
  const input = createReportSchema.parse({
    periodFrom: "2026-09-01",
    periodTo: "2026-09-30",
    nextSteps: [{ type: "paragraph", runs: [{ text: "Publish two blogs." }] }],
  });
  const report = await createReport(projectId, userId, input);
  report.snapshot.notes = { ...report.snapshot.notes, recipientUserIds };
  await Report.updateOne({ _id: report.id }, { $set: { "snapshot.notes.recipientUserIds": recipientUserIds } });
  return report;
}

describe("report delivery", () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue(true);
    renderPdf.mockClear();
  });

  it("builds the dashboard link with the project id so the reader lands on the right project", () => {
    expect(reportDashboardUrl("proj1", "rep1")).toMatch(/\/reports\/rep1\?project=proj1$/);
  });

  it("escapes the client name in the email template", () => {
    const mail = reportReadyMailContent({
      clientName: "<b>Acme</b>",
      periodLabel: "September 2026",
      dashboardUrl: "https://app.example.com/reports/r1?project=p1",
    });
    expect(mail.subject).toContain("<b>Acme</b>");
    expect(mail.html).not.toContain("<b>Acme</b>");
    expect(mail.html).toContain("https://app.example.com/reports/r1?project=p1");
  });

  it("emails the PDF and dashboard link to the recipient and records the delivery", async () => {
    const { owner, projectId } = await seedTestProject();
    const report = await createTestReport(projectId, String(owner._id), [String(owner._id)]);

    await deliverReportEmails({ report, renderPdf });

    expect(renderPdf).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const sent = sendMailMock.mock.calls[0]![0];
    expect(sent.to).toBe("report-owner@example.com");
    expect(sent.text).toContain(`/reports/${report.id}?project=${projectId}`);
    expect(sent.attachments?.[0]?.contentType).toBe("application/pdf");
    expect(sent.attachments?.[0]?.content).toBe(fakePdf);

    expect((await deliveriesOf(report.id)).map((d) => d.status)).toEqual(["sent"]);
  });

  it("skips inactive recipients and sends nothing to them", async () => {
    const { owner, projectId } = await seedTestProject();
    const inactive = await User.create({
      name: "Left Team",
      email: "left@example.com",
      password: "x".repeat(60),
      emailVerifiedAt: new Date(),
      status: "inactive",
      roles: [],
    });
    const report = await createTestReport(projectId, String(owner._id), [String(inactive._id)]);

    await deliverReportEmails({ report, renderPdf });

    expect(sendMailMock).not.toHaveBeenCalled();
    expect((await deliveriesOf(report.id)).map((d) => d.status)).toEqual(["skipped"]);
  });

  it("does not send email when the PDF cannot be rendered, and records the failure", async () => {
    const { owner, projectId } = await seedTestProject();
    const report = await createTestReport(projectId, String(owner._id), [String(owner._id)]);
    renderPdf.mockRejectedValueOnce(new Error("renderer down"));

    await deliverReportEmails({ report, renderPdf });

    expect(sendMailMock).not.toHaveBeenCalled();
    expect((await deliveriesOf(report.id))[0]?.error).toBe("renderer down");
  });

  it("reports not_sent when SMTP is not configured", async () => {
    const { owner, projectId } = await seedTestProject();
    const report = await createTestReport(projectId, String(owner._id), [String(owner._id)]);
    sendMailMock.mockResolvedValueOnce(false);

    await expect(deliverReportEmails({ report, renderPdf })).resolves.toBeUndefined();
    expect((await deliveriesOf(report.id)).map((d) => d.status)).toEqual(["not_sent"]);
  });

  it("never emails the same recipient twice for one report", async () => {
    const { owner, projectId } = await seedTestProject();
    const report = await createTestReport(projectId, String(owner._id), [String(owner._id)]);

    await deliverReportEmails({ report, renderPdf });
    await deliverReportEmails({ report, renderPdf });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect((await deliveriesOf(report.id)).map((d) => d.status)).toEqual(["sent"]);
  });

  it("returns delivery details to report creators only", async () => {
    const { owner, projectId } = await seedTestProject();
    const report = await createTestReport(projectId, String(owner._id), [String(owner._id)]);
    await deliverReportEmails({ report, renderPdf });

    const withDetails = await listReports(projectId, { includeDeliveries: true });
    expect(withDetails[0]?.recipientCount).toBe(1);
    expect(withDetails[0]?.deliveries?.[0]).toMatchObject({ name: "Report Owner", email: "report-owner@example.com", status: "sent" });

    const withoutDetails = await listReports(projectId, { includeDeliveries: false });
    expect(withoutDetails[0]).not.toHaveProperty("deliveries");
    expect(withoutDetails[0]).not.toHaveProperty("recipientCount");
  });

  it("lists recipients that are still pending as not_sent rows with name and email", async () => {
    const { owner, projectId } = await seedTestProject();
    await createTestReport(projectId, String(owner._id), [String(owner._id)]);

    const list = await listReports(projectId, { includeDeliveries: true });
    expect(list[0]).toMatchObject({
      recipientCount: 1,
      deliveries: [{ userId: String(owner._id), status: "not_sent", at: null, error: null }],
    });
    expect(list[0].deliveries?.[0].email).toBe(owner.email);
  });
});

describe("report send is manual", () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue(true);
  });

  it("creating a report with recipients does not email anyone", async () => {
    const { owner, projectId } = await seedTestProject();
    const recipient = await User.create({ name: "Client Reader", email: "reader@example.com", status: "active" });
    const report = await createTestReport(projectId, String(owner._id), [String(recipient._id)]);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sendMailMock).not.toHaveBeenCalled();
    expect(await deliveriesOf(report.id)).toEqual([]);
  });
});
