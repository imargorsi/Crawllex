"use client";

import { use, Suspense } from "react";

import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";
import { ReportDetailSection } from "@/sections/report-detail-section";

type TReportPageProps = {
  params: Promise<{ reportId: string }>;
};

export default function ReportDetailPage({ params }: TReportPageProps) {
  const { reportId } = use(params);
  return (
    <Suspense fallback={<DashboardPageSkeleton variant="list" />}>
      <ReportDetailSection reportId={reportId} />
    </Suspense>
  );
}
