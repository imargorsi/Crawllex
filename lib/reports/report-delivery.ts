import { env } from "@/lib/config/env";
import { sendMail } from "@/lib/mail/client";
import { reportReadyMailContent } from "@/lib/mail/templates";
import { isActiveUserStatus } from "@/lib/users/constants";
import { Report, User } from "@/models";
import type { TReportDeliveryStatus, TReportDetailDto } from "@/types/reports.types";

/** One stored delivery attempt. Stored in `notes.deliveries` of the report document. */
export type TReportDelivery = {
  userId: string;
  name: string;
  email: string | null;
  status: TReportDeliveryStatus;
  error: string | null;
  at: Date;
};

/** Link to the live report. The project id lets the page select the right project for the reader. */
export function reportDashboardUrl(projectId: string, reportId: string): string {
  return `${env.frontendUrl().replace(/\/$/, "")}/reports/${reportId}?project=${projectId}`;
}

function pdfFilename(title: string): string {
  return `${title.replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "report"}.pdf`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Emails the report PDF (attached) and the dashboard link to each recipient in `notes.recipientUserIds`.
 * Runs after the report is saved. Every attempt is stored in `notes.deliveries`, so a failed send can
 * be seen later. A recipient already marked `sent` is skipped, so the same report is never emailed twice
 * to the same person. Never throws: a failure is recorded, not raised to the creator.
 */
export async function deliverReportEmails(input: {
  report: TReportDetailDto;
  renderPdf: (report: TReportDetailDto) => Promise<Buffer>;
}): Promise<void> {
  const { report } = input;
  const recipientIds = report.snapshot.notes?.recipientUserIds ?? [];
  if (recipientIds.length === 0) return;

  const stored = await Report.findById(report.id).select("notes.deliveries").lean<{ notes?: { deliveries?: TReportDelivery[] } }>();
  const alreadySent = new Set((stored?.notes?.deliveries ?? []).filter((d) => d.status === "sent").map((d) => d.userId));
  const pending = recipientIds.filter((userId) => !alreadySent.has(userId));
  if (pending.length === 0) return;

  const users = await User.find({ _id: { $in: pending } }).select("name email status");
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  let pdf: Buffer | null = null;
  let pdfError: string | null = null;
  try {
    pdf = await input.renderPdf(report);
  } catch (error) {
    pdfError = errorMessage(error);
    console.error(`[reports] PDF render failed for report ${report.id}; no email sent.`, error);
  }

  const clientName = report.snapshot.project.name;
  const dashboardUrl = reportDashboardUrl(report.snapshot.project.id, report.id);
  const mail = reportReadyMailContent({ clientName, periodLabel: report.snapshot.period.label, dashboardUrl });
  const deliveries: TReportDelivery[] = [];

  for (const userId of pending) {
    const user = usersById.get(userId);
    const at = new Date();

    if (!user || !isActiveUserStatus(user.status) || !user.email) {
      deliveries.push({ userId, name: user?.name ?? "", email: user?.email ?? null, status: "skipped", error: "Recipient not active or has no email.", at });
      continue;
    }
    if (!pdf) {
      deliveries.push({ userId, name: user.name, email: user.email, status: "failed", error: pdfError ?? "PDF not rendered.", at });
      continue;
    }

    try {
      const sent = await sendMail({
        to: user.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        attachments: [{ filename: pdfFilename(report.title), content: pdf, contentType: "application/pdf" }],
      });
      deliveries.push({ userId, name: user.name, email: user.email, status: sent ? "sent" : "not_sent", error: null, at });
    } catch (error) {
      console.error(`[reports] Email failed for report ${report.id} to ${user.email}.`, error);
      deliveries.push({ userId, name: user.name, email: user.email, status: "failed", error: errorMessage(error), at });
    }
  }

  await Report.updateOne({ _id: report.id }, { $push: { "notes.deliveries": { $each: deliveries } } });
}
