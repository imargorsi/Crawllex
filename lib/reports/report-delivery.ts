import { env } from "@/lib/config/env";
import { sendMail } from "@/lib/mail/client";
import { reportReadyMailContent } from "@/lib/mail/templates";
import { isActiveUserStatus } from "@/lib/users/constants";
import { Report, User } from "@/models";
import type { TReportDetailDto } from "@/types/reports.types";

/** Outcome for one recipient. `not_sent` means SMTP is not configured, so nothing left the server. */
export type TReportDeliveryStatus = "sent" | "not_sent" | "failed" | "skipped";

export type TReportDelivery = {
  userId: string;
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
 * Runs after the report is saved. Every recipient gets one entry in `notes.deliveries`, so a failed
 * send can be seen later. Never throws: a failure is recorded, not raised to the creator.
 */
export async function deliverReportEmails(input: {
  report: TReportDetailDto;
  renderPdf: (report: TReportDetailDto) => Promise<Buffer>;
}): Promise<void> {
  const { report } = input;
  const recipientIds = report.snapshot.notes?.recipientUserIds ?? [];
  if (recipientIds.length === 0) return;

  const users = await User.find({ _id: { $in: recipientIds } }).select("name email status");
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

  for (const userId of recipientIds) {
    const user = usersById.get(userId);
    const at = new Date();

    if (!user || !isActiveUserStatus(user.status) || !user.email) {
      deliveries.push({ userId, email: user?.email ?? null, status: "skipped", error: "Recipient not active or has no email.", at });
      continue;
    }
    if (!pdf) {
      deliveries.push({ userId, email: user.email, status: "failed", error: pdfError ?? "PDF not rendered.", at });
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
      deliveries.push({ userId, email: user.email, status: sent ? "sent" : "not_sent", error: null, at });
    } catch (error) {
      console.error(`[reports] Email failed for report ${report.id} to ${user.email}.`, error);
      deliveries.push({ userId, email: user.email, status: "failed", error: errorMessage(error), at });
    }
  }

  await Report.updateOne({ _id: report.id }, { $push: { "notes.deliveries": { $each: deliveries } } });
}
