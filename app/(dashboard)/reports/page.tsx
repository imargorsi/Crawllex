import { Suspense } from "react";

import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";
import { ReportsSection } from "@/sections/reports-section";

export default function ReportsPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton variant="list" />}>
      <ReportsSection />
    </Suspense>
  );
}
