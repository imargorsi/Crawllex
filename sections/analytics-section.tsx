"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { AnalyticsDemographicsEngagementRow } from "@/components/analytics/analytics-demographics-engagement-row";
import { AnalyticsPerformanceTrendChart } from "@/components/analytics/analytics-performance-trend-chart";
import { AnalyticsSummaryCards } from "@/components/analytics/analytics-summary-cards";
import { AnalyticsTopPagesCard } from "@/components/analytics/analytics-top-pages-card";
import { AnalyticsTopQueriesCard } from "@/components/analytics/analytics-top-queries-card";
import { AnalyticsTrafficSourcesCard } from "@/components/analytics/analytics-traffic-sources-card";
import { SeoActivityDateRangeFilter } from "@/components/seo-activities/seo-activity-date-range-filter";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageAmbientGlow } from "@/components/ui/page-ambient-glow";
import { useSelectedProject } from "@/context/selected-project-context";
import { useProjectAccess } from "@/context/project-access-context";
import {
  useAnalyticsDimensionsQuery,
  useAnalyticsExportMutation,
  useAnalyticsOverviewQuery,
} from "@/features/analytics/analytics.api";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { useSyncedAnalyticsDateRange } from "@/hooks/use-synced-analytics-date-range.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import {
  downloadAnalyticsExcel,
  hasAnalyticsExportSignal,
} from "@/lib/frontend/analytics/export.utils";
import { notify } from "@/lib/frontend/feedback/notify";
import { analyticsHeadingStackClass } from "@/lib/frontend/layout/dashboard-chrome";
import { cn } from "@/lib/utils";
import {
  ANALYTICS_DATE_PRESET_IDS,
  matchAnalyticsDatePreset,
  resolveAnalyticsDatePreset,
} from "@/lib/integrations/date.utils";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";

export function AnalyticsSection() {
  const { t } = useTranslation("translation", { keyPrefix: "modules.analytics" });
  const { dateRange, from, to, onDateRangeChange } = useSyncedAnalyticsDateRange();

  const { selectedProject } = useSelectedProject();
  const projectId = selectedProject?.id ?? null;
  const { data: authUser } = useAuthUserQuery();
  const { projectPermissions } = useProjectAccess();
  const loadErrorNotified = useRef(false);

  const permissions = useMemo(
    () => mergePermissions(authUser?.permissions ?? [], projectPermissions),
    [authUser?.permissions, projectPermissions],
  );
  const canView = hasPermission(permissions, "analytics.view");
  const rangeEnabled = Boolean(projectId) && canView && Boolean(from && to);

  const overviewQuery = useAnalyticsOverviewQuery(
    projectId,
    { from, to },
    { enabled: rangeEnabled },
  );

  const queriesQuery = useAnalyticsDimensionsQuery(
    projectId,
    { from, to, source: "gsc", dimensionType: "query", limit: 25 },
    { enabled: rangeEnabled },
  );
  const channelsQuery = useAnalyticsDimensionsQuery(
    projectId,
    { from, to, source: "ga4", dimensionType: "channel_group", limit: 25 },
    { enabled: rangeEnabled },
  );
  const pagesQuery = useAnalyticsDimensionsQuery(
    projectId,
    { from, to, source: "gsc", dimensionType: "page", limit: 25 },
    { enabled: rangeEnabled },
  );
  const geoQuery = useAnalyticsDimensionsQuery(
    projectId,
    { from, to, source: "ga4", dimensionType: "country", limit: 25 },
    { enabled: rangeEnabled },
  );
  const exportMutation = useAnalyticsExportMutation(projectId);

  useEffect(() => {
    const error =
      overviewQuery.error ||
      queriesQuery.error ||
      channelsQuery.error ||
      pagesQuery.error ||
      geoQuery.error;
    if (!error || loadErrorNotified.current) return;
    loadErrorNotified.current = true;
    notify.error(error instanceof Error ? error.message : t("loadError"));
  }, [
    channelsQuery.error,
    geoQuery.error,
    overviewQuery.error,
    pagesQuery.error,
    queriesQuery.error,
    t,
  ]);

  async function onExportExcel() {
    if (!projectId || !from || !to || exportMutation.isPending) return;

    try {
      const bundle = await exportMutation.mutateAsync({ from, to });
      const payload = {
        overview: bundle.overview,
        queries: bundle.queries.rows,
        pages: bundle.pages.rows,
        channels: bundle.channels.rows,
        countries: bundle.countries.rows,
      };

      if (!hasAnalyticsExportSignal(payload)) {
        notify.info(t("export.empty"));
        return;
      }

      downloadAnalyticsExcel({
        payload,
        range: dateRange,
        labels: {
          sheets: {
            summary: t("export.sheets.summary"),
            dailyTrend: t("export.sheets.dailyTrend"),
            topQueries: t("export.sheets.topQueries"),
            topPages: t("export.sheets.topPages"),
            trafficSources: t("export.sheets.trafficSources"),
            countries: t("export.sheets.countries"),
          },
          metric: t("export.metric"),
          value: t("export.value"),
          date: t("export.date"),
          clicks: t("tables.clicks"),
          impressions: t("tables.impressions"),
          ctr: t("tables.ctr"),
          position: t("tables.position"),
          sessions: t("tables.sessions"),
          users: t("tables.users"),
          channel: t("export.channel"),
          country: t("export.country"),
          query: t("topQueries.columns.dimension"),
          page: t("topPages.columns.dimension"),
          totalClicks: t("summary.clicks"),
          totalImpressions: t("summary.impressions"),
          avgCtr: t("summary.ctr"),
          avgPosition: t("summary.position"),
          totalSessions: t("summary.sessions"),
          totalUsers: t("tables.users"),
        },
      });
      notify.success(t("export.success"));
    } catch (error) {
      notify.error(ApiError.messageFrom(error, t("export.errorFallback")));
    }
  }

  if (!projectId) {
    return (
      <div className="w-full min-w-0 px-4 py-6 sm:px-6">
        <EmptyState title={t("selectProjectTitle")} description={t("selectProjectBody")} />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="w-full min-w-0 px-4 py-6 sm:px-6">
        <EmptyState title={t("noAccessTitle")} description={t("noAccessBody")} />
      </div>
    );
  }

  return (
      <div className="relative w-full min-w-0">
      <PageAmbientGlow />

      <div className="relative flex flex-col gap-6 px-4 py-6 sm:gap-7 sm:px-6 sm:py-7 lg:gap-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className={cn(analyticsHeadingStackClass, "max-w-2xl")}>
            <Heading id="analytics-title" pageTitle>
              {t("title")}
            </Heading>
            <Paragraph className="text-text-muted">{t("subtitle")}</Paragraph>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SeoActivityDateRangeFilter
              value={dateRange}
              onChange={onDateRangeChange}
              presets={ANALYTICS_DATE_PRESET_IDS}
              i18nKeyPrefix="modules.analytics.dateFilter"
              resolvePreset={resolveAnalyticsDatePreset}
              matchPreset={matchAnalyticsDatePreset}
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => void onExportExcel()}
              disabled={exportMutation.isPending}
              className="shrink-0"
            >
              <Icons.cloudDownload className="size-4" aria-hidden />
              {exportMutation.isPending ? t("export.exporting") : t("export.excel")}
            </Button>
          </div>
        </div>

        <AnalyticsSummaryCards
          overview={overviewQuery.data}
          isLoading={overviewQuery.isLoading}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)] xl:items-stretch xl:gap-6">
          <AnalyticsPerformanceTrendChart
            overview={overviewQuery.data}
            isLoading={overviewQuery.isLoading}
            className="h-full"
          />
          <AnalyticsTrafficSourcesCard
            rows={channelsQuery.data?.rows ?? []}
            isLoading={channelsQuery.isLoading}
            className="h-full"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2 xl:gap-6">
          <AnalyticsTopQueriesCard
            rows={queriesQuery.data?.rows ?? []}
            isLoading={queriesQuery.isLoading}
            projectId={projectId}
            from={from}
            to={to}
          />
          <AnalyticsTopPagesCard
            rows={pagesQuery.data?.rows ?? []}
            isLoading={pagesQuery.isLoading}
            projectId={projectId}
            from={from}
            to={to}
          />
        </div>

        <AnalyticsDemographicsEngagementRow
          overview={overviewQuery.data}
          overviewLoading={overviewQuery.isLoading}
          rows={geoQuery.data?.rows ?? []}
          isLoading={geoQuery.isLoading}
        />
      </div>
    </div>
  );
}
