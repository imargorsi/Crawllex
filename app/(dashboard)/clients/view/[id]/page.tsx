import { Suspense } from "react";

import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";
import { ClientDetailSection } from "@/sections/client-detail-section";

export default function ClientDetailPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton variant="detail" />}>
      <ClientDetailSection />
    </Suspense>
  );
}
