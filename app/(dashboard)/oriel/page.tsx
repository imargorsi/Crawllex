import { Suspense } from "react";

import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";
import { OrielSection } from "@/sections/oriel-section";

export default function OrielPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton variant="list" />}>
      <OrielSection />
    </Suspense>
  );
}
