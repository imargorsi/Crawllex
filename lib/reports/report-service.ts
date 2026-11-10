import { Types } from "mongoose";

import { loadReportAssets } from "@/lib/reports/assets";
import { loadClientLogoDataUri } from "@/lib/reports/client-logo";
import { collectReportData } from "@/lib/reports/collect";
import { renderReportPdf } from "@/lib/reports/pdf-client";
import { deliverReportEmails, reportDashboardUrl, type TReportDelivery } from "@/lib/reports/report-delivery";
import { reportListSummary } from "@/lib/reports/report-text";
import { formatMonthTitle, isFullCalendarMonth } from "@/lib/reports/period";
import { renderReportHtml } from "@/lib/reports/render-html";
import { HttpError } from "@/lib/api/http-errors";
import { Project, Report, User } from "@/models";
import type { CreateReportInput } from "@/schemas/reports";
import type {
  TReportDeliveryDto,
  TReportDetailDto,
  TReportListItemDto,
  TReportListKpisDto,
  TReportNotesDto,
  TReportSnapshotDto,
} from "@/types/reports.types";

type TReportLean = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  summary?: string | null;
  periodFrom: string;
  periodTo: string;
  createdAt: Date;
  snapshot?: Partial<TReportSnapshotDto>;
  notes?: { deliveries?: TReportDelivery[] };
};

type TRecipient = { name: string; email: string | null };

/** Options for reads. Delivery details are for users who can create reports. */
type TReadOptions = { includeDeliveries: boolean; recipients?: Map<string, TRecipient> };

/** Name and email of each recipient, so recipients without a delivery yet can still be listed. */
async function recipientsById(ids: string[]): Promise<Map<string, TRecipient>> {
  const valid = [...new Set(ids)].filter((id) => Types.ObjectId.isValid(id));
  if (valid.length === 0) return new Map();
  const users = await User.find({ _id: { $in: valid } }).select("name email").lean();
  return new Map(users.map((user) => [String(user._id), { name: user.name, email: user.email ?? null }]));
}

/**
 * One row per recipient. Latest attempt if the report was sent to them; otherwise a `not_sent` row,
 * so recipients added before sending are visible.
 */
function latestDeliveries(
  attempts: TReportDelivery[],
  recipientIds: string[],
  recipients: Map<string, TRecipient>,
): TReportDeliveryDto[] {
  const latest = new Map<string, TReportDelivery>();
  for (const attempt of attempts) latest.set(attempt.userId, attempt);
  const attempted = [...latest.values()].map((attempt) => ({
    userId: attempt.userId,
    name: attempt.name,
    email: attempt.email,
    status: attempt.status,
    error: attempt.error,
    at: new Date(attempt.at).toISOString(),
  }));
  const pending = recipientIds
    .filter((id) => !latest.has(id))
    .map((id) => ({
      userId: id,
      name: recipients.get(id)?.name ?? "",
      email: recipients.get(id)?.email ?? null,
      status: "not_sent" as const,
      error: null,
      at: null,
    }));
  return [...attempted, ...pending];
}

function listKpis(doc: TReportLean): TReportListKpisDto | null {
  const snapshot = doc.snapshot;
  if (!snapshot?.gsc?.current || !snapshot.ga4?.current || !snapshot.leads || !snapshot.events) {
    return null;
  }
  return {
    clicks: snapshot.gsc.current.clicks,
    impressions: snapshot.gsc.current.impressions,
    sessions: snapshot.ga4.current.sessions,
    leads: snapshot.leads.total,
    calls: snapshot.events.contacts.call,
    emails: snapshot.events.contacts.email,
  };
}

function toListItem(doc: TReportLean, options: TReadOptions): TReportListItemDto {
  return {
    id: String(doc._id),
    projectId: String(doc.projectId),
    title: doc.title,
    periodFrom: doc.periodFrom,
    periodTo: doc.periodTo,
    createdAt: doc.createdAt.toISOString(),
    summary: doc.summary ?? null,
    kpis: listKpis(doc),
    ...(options.includeDeliveries
      ? {
          recipientCount: doc.snapshot?.notes?.recipientUserIds?.length ?? 0,
          deliveries: latestDeliveries(
            doc.notes?.deliveries ?? [],
            doc.snapshot?.notes?.recipientUserIds ?? [],
            options.recipients ?? new Map(),
          ),
        }
      : {}),
  };
}

function toDetail(doc: TReportLean, options: TReadOptions): TReportDetailDto {
  if (!doc.snapshot) {
    throw new Error("Report snapshot is missing.");
  }
  return { ...toListItem(doc, options), snapshot: doc.snapshot as TReportSnapshotDto };
}

function reportTitle(projectName: string, from: string, to: string, label: string): string {
  const title = isFullCalendarMonth(from, to) ? formatMonthTitle(from) : label;
  return `${projectName} — ${title}`;
}

/** Collects data, stores a snapshot and its list summary. Returns the saved report. */
export async function createReport(
  projectId: string,
  userId: string,
  input: CreateReportInput,
): Promise<TReportDetailDto> {
  if (input.recipientUserIds.length > 0) {
    const knownUsers = await User.countDocuments({ _id: { $in: input.recipientUserIds } });
    if (knownUsers !== input.recipientUserIds.length) {
      throw new HttpError(400, "Recipient Not Found.");
    }
  }
  const notes: TReportNotesDto = {
    written: input.written,
    nextSteps: input.nextSteps,
    recipientUserIds: input.recipientUserIds,
  };

  const { base, period } = await collectReportData(projectId, input.periodFrom, input.periodTo);
  const project = await Project.findById(projectId).select("logoImage").lean();
  const logoDataUri = await loadClientLogoDataUri(project?.logoImage ?? null).catch((error: unknown) => {
    console.error(`[reports] Client logo load failed for project ${projectId}; report created without logo.`, error);
    return null;
  });
  const snapshot: TReportSnapshotDto = {
    version: 1,
    generatedAt: new Date().toISOString(),
    ...base,
    project: { ...base.project, logoDataUri },
    notes,
  };
  const summary = reportListSummary(snapshot);

  const doc = await Report.create({
    projectId,
    periodFrom: period.from,
    periodTo: period.to,
    previousFrom: period.previousFrom,
    previousTo: period.previousTo,
    title: reportTitle(base.project.name, period.from, period.to, period.label),
    summary,
    notes,
    snapshot,
    createdBy: userId,
  });

  // Not sent here. The team reviews the report first, then sends with sendReport().
  const recipients = await recipientsById(input.recipientUserIds);
  return toDetail(doc.toObject() as unknown as TReportLean, { includeDeliveries: true, recipients });
}

/**
 * Emails the PDF and dashboard link to the recipients that have not received this report yet.
 * Called from the Send action after review. Safe to call again: sent recipients are skipped.
 */
export async function sendReport(projectId: string, reportId: string): Promise<TReportDetailDto | null> {
  const report = await getReport(projectId, reportId, { includeDeliveries: true });
  if (!report) return null;
  await deliverReportEmails({ report, renderPdf: reportPdf });
  return getReport(projectId, reportId, { includeDeliveries: true });
}

export async function listReports(projectId: string, options: TReadOptions): Promise<TReportListItemDto[]> {
  const docs = await Report.find({ projectId })
    .sort({ createdAt: -1 })
    .select(
      "title summary periodFrom periodTo createdAt projectId notes.deliveries snapshot.notes.recipientUserIds snapshot.gsc.current snapshot.ga4.current snapshot.leads snapshot.events.contacts",
    )
    .lean<TReportLean[]>();
  const recipients = options.includeDeliveries
    ? await recipientsById(docs.flatMap((doc) => doc.snapshot?.notes?.recipientUserIds ?? []))
    : new Map<string, TRecipient>();
  return docs.map((doc) => toListItem(doc, { ...options, recipients }));
}

export async function getReport(projectId: string, reportId: string, options: TReadOptions): Promise<TReportDetailDto | null> {
  if (!Types.ObjectId.isValid(reportId)) return null;
  const doc = await Report.findOne({ _id: reportId, projectId }).lean<TReportLean | null>();
  if (!doc) return null;
  const recipients = options.includeDeliveries
    ? await recipientsById(doc.snapshot?.notes?.recipientUserIds ?? [])
    : new Map<string, TRecipient>();
  return toDetail(doc, { ...options, recipients });
}

export async function deleteReport(projectId: string, reportId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(reportId)) return false;
  const result = await Report.deleteOne({ _id: reportId, projectId });
  return result.deletedCount === 1;
}

/** Print HTML for one report. The browser preview and the PDF both use this document. */
export function reportHtmlDocument(report: TReportDetailDto): string {
  return renderReportHtml(report.snapshot, loadReportAssets(), {
    dashboardUrl: reportDashboardUrl(report.projectId, report.id),
  });
}

export function reportPdf(report: TReportDetailDto): Promise<Buffer> {
  return renderReportPdf(reportHtmlDocument(report));
}
