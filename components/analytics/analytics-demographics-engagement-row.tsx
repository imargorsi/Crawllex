"use client";

import { useLayoutEffect, useRef } from "react";

import { AnalyticsEngagementPreviewCards } from "@/components/analytics/analytics-engagement-preview-cards";
import { AnalyticsUserDemographicsCard } from "@/components/analytics/analytics-user-demographics-card";
import type { TAnalyticsDimensionRowDto, TAnalyticsOverviewDto } from "@/types/analytics.types";

type TAnalyticsDemographicsEngagementRowProps = {
  overview: TAnalyticsOverviewDto | undefined;
  overviewLoading?: boolean;
  rows: TAnalyticsDimensionRowDto[];
  isLoading?: boolean;
};

/**
 * Keeps the demographics panel the same height as the stacked engagement cards
 * on xl+ (CSS stretch is unreliable once percentage heights enter the tree).
 */
export function AnalyticsDemographicsEngagementRow({
  overview,
  overviewLoading,
  rows,
  isLoading,
}: TAnalyticsDemographicsEngagementRowProps) {
  const demographicsColRef = useRef<HTMLDivElement>(null);
  const engagementColRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const demographicsCol = demographicsColRef.current;
    const engagementCol = engagementColRef.current;
    if (!demographicsCol || !engagementCol) return;

    const syncHeight = () => {
      if (!window.matchMedia("(min-width: 1280px)").matches) {
        demographicsCol.style.minHeight = "";
        return;
      }
      demographicsCol.style.minHeight = `${Math.ceil(engagementCol.getBoundingClientRect().height)}px`;
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(engagementCol);
    window.addEventListener("resize", syncHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
      demographicsCol.style.minHeight = "";
    };
  }, [isLoading, overviewLoading, overview?.engagement]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] xl:gap-6">
      <div ref={demographicsColRef} className="min-h-0 min-w-0">
        <AnalyticsUserDemographicsCard
          rows={rows}
          isLoading={isLoading}
          className="h-full"
        />
      </div>
      <div ref={engagementColRef} className="min-h-0 min-w-0">
        <AnalyticsEngagementPreviewCards
          overview={overview}
          isLoading={overviewLoading}
        />
      </div>
    </div>
  );
}
