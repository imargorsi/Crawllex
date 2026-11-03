import { Types } from "mongoose";

import { loadReportAssets } from "@/lib/reports/assets";
import { loadClientLogoDataUri } from "@/lib/reports/client-logo";
import { collectReportData } from "@/lib/reports/collect";
import { renderReportPdf } from "@/lib/reports/pdf-client";
import { reportListSummary } from "@/lib/reports/report-text";
import { formatMonthTitle, isFullCalendarMonth } from "@/lib/reports/period";
import { renderReportHtml } from "@/lib/reports/render-html";
import { HttpError } from "@/lib/api/http-errors";
import { Project, Report, User } from "@/models";
import type { CreateReportInput } from "@/schemas/reports";
import type {
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
};

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

function toListItem(doc: TReportLean): TReportListItemDto {
  return {
    id: String(doc._id),
    projectId: String(doc.projectId),
    title: doc.title,
    periodFrom: doc.periodFrom,
    periodTo: doc.periodTo,
    createdAt: doc.createdAt.toISOString(),
    summary: doc.summary ?? null,
    kpis: listKpis(doc),
  };
}

function toDetail(doc: TReportLean): TReportDetailDto {
  if (!doc.snapshot) {
    throw new Error("Report snapshot is missing.");
  }
  return { ...toListItem(doc), snapshot: doc.snapshot as TReportSnapshotDto };
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

  return toDetail(doc.toObject() as unknown as TReportLean);
}

export async function listReports(projectId: string): Promise<TReportListItemDto[]> {
  const docs = await Report.find({ projectId })
    .sort({ createdAt: -1 })
    .select(
      "title summary periodFrom periodTo createdAt projectId snapshot.gsc.current snapshot.ga4.current snapshot.leads snapshot.events.contacts",
    )
    .lean<TReportLean[]>();
  return docs.map((doc) => toListItem(doc));
}

export async function getReport(projectId: string, reportId: string): Promise<TReportDetailDto | null> {
  if (!Types.ObjectId.isValid(reportId)) return null;
  const doc = await Report.findOne({ _id: reportId, projectId }).lean<TReportLean | null>();
  return doc ? toDetail(doc) : null;
}

export async function deleteReport(projectId: string, reportId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(reportId)) return false;
  const result = await Report.deleteOne({ _id: reportId, projectId });
  return result.deletedCount === 1;
}

function reportHtml(report: TReportDetailDto): string {
  return renderReportHtml(report.snapshot, loadReportAssets());
}

export function reportPdf(report: TReportDetailDto): Promise<Buffer> {
  return renderReportPdf(reportHtml(report));
}
