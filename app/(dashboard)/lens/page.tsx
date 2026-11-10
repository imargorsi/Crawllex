import { Suspense } from "react";

import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";
import { LensSection } from "@/sections/lens-section";

export default function LensPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton variant="list" />}>
      <LensSection />
    </Suspense>
  );
}
