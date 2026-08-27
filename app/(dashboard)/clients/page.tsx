import { Suspense } from "react";

import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-page-skeleton";
import { ClientsListSection } from "@/sections/clients-list-section";

export default function ClientsPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton variant="list" />}>
      <ClientsListSection />
    </Suspense>
  );
}
