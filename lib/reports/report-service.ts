import { Types } from "mongoose";

import { collectReportData } from "@/lib/reports/collect";
import { renderReportPdf } from "@/lib/reports/pdf-client";
import { buildNarrative } from "@/lib/reports/narrative";
import { formatMonthTitle, isFullCalendarMonth } from "@/lib/reports/period";
import { renderReportHtml } from "@/lib/reports/render-html";
import { Report } from "@/models";
import type { CreateReportInput } from "@/schemas/reports";
import type {
  TReportDetailDto,
  TReportListItemDto,
  TReportSnapshotDto,
} from "@/types/reports.types";

type TReportLean = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  periodFrom: string;
  periodTo: string;
  createdAt: Date;
  snapshot?: TReportSnapshotDto;
};

function toListItem(doc: TReportLean): TReportListItemDto {
  return {
    id: String(doc._id),
    projectId: String(doc.projectId),
    title: doc.title,
    periodFrom: doc.periodFrom,
    periodTo: doc.periodTo,
    createdAt: doc.createdAt.toISOString(),
  };
}

function toDetail(doc: TReportLean): TReportDetailDto {
  if (!doc.snapshot) {
    throw new Error("Report snapshot is missing.");
  }
  return { ...toListItem(doc), snapshot: doc.snapshot };
}

function reportTitle(projectName: string, from: string, to: string, label: string): string {
  const title = isFullCalendarMonth(from, to) ? formatMonthTitle(from) : label;
  return `${projectName} — ${title}`;
}

/** Collects data, writes the narrative and stores a snapshot. Returns the saved report. */
export async function createReport(
  projectId: string,
  userId: string,
  input: CreateReportInput,
): Promise<TReportDetailDto> {
  const notes = {
    highlights: input.highlights,
    translationStatus: input.translationStatus,
    closingNote: input.closingNote,
  };

  const { base, period } = await collectReportData(projectId, input.periodFrom, input.periodTo);
  const snapshot: TReportSnapshotDto = {
    version: 1,
    generatedAt: new Date().toISOString(),
    ...base,
    narrative: buildNarrative(base, notes),
    notes,
  };

  const doc = await Report.create({
    projectId,
    periodFrom: period.from,
    periodTo: period.to,
    previousFrom: period.previousFrom,
    previousTo: period.previousTo,
    title: reportTitle(base.project.name, period.from, period.to, period.label),
    notes,
    snapshot,
    createdBy: userId,
  });

  return toDetail(doc.toObject() as unknown as TReportLean);
}

export async function listReports(projectId: string): Promise<TReportListItemDto[]> {
  const docs = await Report.find({ projectId })
    .sort({ createdAt: -1 })
    .select("title periodFrom periodTo createdAt projectId")
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

export function reportHtml(report: TReportDetailDto): string {
  return renderReportHtml(report.snapshot);
}

export function reportPdf(report: TReportDetailDto): Promise<Buffer> {
  return renderReportPdf(reportHtml(report));
}
