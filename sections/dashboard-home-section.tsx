"use client";

import { Icons } from "@/lib/frontend/icons/app-icons";

import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { DashboardAssistantPanel } from "@/components/dashboard/dashboard-assistant-panel";
import { DashboardSeoPulse } from "@/components/dashboard/dashboard-seo-pulse";
import { DashboardSeoTrendGrid } from "@/components/dashboard/dashboard-seo-trend-grid";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { SeoActivityDateRangeFilter } from "@/components/seo-activities/seo-activity-date-range-filter";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageAmbientGlow } from "@/components/ui/page-ambient-glow";
import { useProjectAccess } from "@/context/project-access-context";
import { useSelectedProject } from "@/context/selected-project-context";
import {
  useAnalyticsDimensionsQuery,
  useAnalyticsOverviewQuery,
} from "@/features/analytics/analytics.api";
import { useAuthUserQuery } from "@/features/auth/auth.api";
import { useLeadsQuery } from "@/features/leads/leads.api";
import { useSyncedAnalyticsDateRange } from "@/hooks/use-synced-analytics-date-range.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import {
  downloadDashboardExcel,
  hasDashboardExportSignal,
} from "@/lib/frontend/dashboard/export.utils";
import { notify } from "@/lib/frontend/feedback/notify";
import { typeStackMdClass } from "@/lib/frontend/layout/dashboard-chrome";
import {
  ANALYTICS_DATE_PRESET_IDS,
  matchAnalyticsDatePreset,
  resolveAnalyticsDatePreset,
} from "@/lib/integrations/date.utils";
import { summarizeEvents } from "@/lib/analytics/event-summary";
import { hasPermission, mergePermissions } from "@/lib/rbac/access";
import { cn } from "@/lib/utils";

export function DashboardHomeSection() {
  const { t } = useTranslation("translation", { keyPrefix: "home" });
  const { dateRange, from, to, hasRange, onDateRangeChange } = useSyncedAnalyticsDateRange();

  const { selectedProject } = useSelectedProject();
  const projectId = selectedProject?.id ?? null;
  const { data: authUser } = useAuthUserQuery();
  const { projectPermissions } = useProjectAccess();
  const loadErrorNotified = useRef(false);

  const permissions = useMemo(
    () => mergePermissions(authUser?.permissions ?? [], projectPermissions),
    [authUser?.permissions, projectPermissions],
  );

  const canViewLeads = hasPermission(permissions, "leads.view");
  const canViewAnalytics = hasPermission(permissions, "analytics.view");
  const canViewSeo = hasPermission(permissions, "seo_activities.view");
  const analyticsEnabled = Boolean(projectId) && canViewAnalytics && hasRange;

  const leadsQuery = useLeadsQuery(
    projectId,
    { page: 1, per_page: 1, from, to },
    { enabled: Boolean(projectId) && canViewLeads && hasRange },
  );

  const eventsQuery = useAnalyticsDimensionsQuery(
    projectId,
    { from, to, source: "ga4", dimensionType: "event_name", limit: 100 },
    { enabled: analyticsEnabled },
  );

  const overviewQuery = useAnalyticsOverviewQuery(projectId, { from, to }, {
    enabled: analyticsEnabled,
  });

  useEffect(() => {
    loadErrorNotified.current = false;
  }, [projectId, from, to]);

  useEffect(() => {
    if (loadErrorNotified.current) return;
    const error = leadsQuery.error ?? eventsQuery.error ?? overviewQuery.error;
    if (!error) return;
    loadErrorNotified.current = true;
    notify.error(ApiError.messageFrom(error, t("loadError")));
  }, [leadsQuery.error, eventsQuery.error, overviewQuery.error, t]);

  // Without a connected GA4 property, zero would read as "no clicks" rather than "no data".
  const contactsAvailable = canViewAnalytics && Boolean(overviewQuery.data?.integrations.ga4);
  const events = summarizeEvents(
    (eventsQuery.data?.rows ?? []).map((row) => ({
      dimensionValue: row.dimensionValue,
      eventCount: row.eventCount,
    })),
  );
  const pulseValues = {
    leads: canViewLeads ? (leadsQuery.data?.pagination.total ?? 0) : null,
    calls: contactsAvailable ? events.contacts.call : null,
    emails: contactsAvailable ? events.contacts.email : null,
    whatsapp: contactsAvailable ? events.contacts.whatsapp : null,
  };

  function onExportExcel() {
    if (!hasRange) return;

    const payload = {
      pulse: pulseValues,
      overview: canViewAnalytics ? overviewQuery.data : undefined,
    };

    if (!hasDashboardExportSignal(payload)) {
      notify.info(t("export.empty"));
      return;
    }

    try {
      downloadDashboardExcel({
        payload,
        range: dateRange,
        labels: {
          sheets: {
            summary: t("export.sheets.summary"),
            dailyTrend: t("export.sheets.dailyTrend"),
          },
          metric: t("export.metric"),
          value: t("export.value"),
          date: t("export.date"),
          leads: t("pulse.cards.leads"),
          calls: t("pulse.cards.calls"),
          emails: t("pulse.cards.emails"),
          whatsapp: t("pulse.cards.whatsapp"),
          clicks: t("trend.cards.clicks"),
          impressions: t("trend.cards.impressions"),
          ctr: t("trend.cards.ctr"),
          position: t("trend.cards.position"),
          engagementRate: t("trend.cards.engagementRate"),
          avgSessionDuration: t("trend.cards.avgSessionDuration"),
          sessions: t("export.sessions"),
        },
      });
      notify.success(t("export.success"));
    } catch (error) {
      notify.error(ApiError.messageFrom(error, t("export.errorFallback")));
    }
  }

  if (!projectId) {
    return (
      <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-center px-4 py-6 sm:px-6">
        <EmptyState title={t("selectProjectTitle")} description={t("selectProjectBody")} />
      </div>
    );
  }

  const pulseLoading =
    (canViewLeads && leadsQuery.isLoading) ||
    (canViewAnalytics && (overviewQuery.isLoading || eventsQuery.isLoading));

  return (
    <div className="relative flex w-full min-w-0 flex-col xl:h-full xl:min-h-0">
      <PageAmbientGlow />

      <div className="relative flex w-full min-w-0 flex-col px-4 py-2.5 sm:px-6 sm:py-3 xl:min-h-0 xl:flex-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className={cn(typeStackMdClass, "min-w-0 max-w-xl")}>
            <Heading id="dashboard-home-title" pageTitle>
              {t("title")}
            </Heading>
            <Paragraph className="text-text-secondary">{t("subtitle")}</Paragraph>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <SeoActivityDateRangeFilter
              value={dateRange}
              onChange={onDateRangeChange}
              presets={ANALYTICS_DATE_PRESET_IDS}
              i18nKeyPrefix="modules.analytics.dateFilter"
              resolvePreset={resolveAnalyticsDatePreset}
              matchPreset={matchAnalyticsDatePreset}
              ariaLabel={t("dateFilterAriaLabel")}
            />
            <Button
              type="button"
              variant="outlined"
              size="md"
              onClick={onExportExcel}
              disabled={pulseLoading || !hasRange}
              className="shrink-0"
            >
              <Icons.cloudDownload className="size-4" aria-hidden />
              {t("export.excel")}
            </Button>
          </div>
        </div>

        <div className="mt-3 flex w-full min-w-0 flex-col gap-6 pb-4 xl:min-h-0 xl:flex-1">
          <section aria-label={t("pulse.title")} className="min-w-0 shrink-0">
            <DashboardSeoPulse
              variant="row"
              isLoading={pulseLoading}
              from={from}
              to={to}
              values={pulseValues}
            />
          </section>

          <div
            className={cn(
              "grid w-full min-w-0 gap-3",
              canViewAnalytics &&
                "xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] xl:items-stretch",
            )}
          >
            <div className="min-h-0 min-w-0 w-full xl:h-full">
              <DashboardAssistantPanel
                projectId={projectId}
                canViewLeads={canViewLeads}
                canViewAnalytics={canViewAnalytics}
                canViewSeo={canViewSeo}
                compact
                className="w-full xl:h-full"
              />
            </div>

            {canViewAnalytics ? (
              <section aria-label={t("trend.title")} className="min-h-0 min-w-0 w-full xl:h-full">
                <DashboardSeoTrendGrid
                  overview={overviewQuery.data}
                  isLoading={overviewQuery.isLoading}
                  from={from}
                  to={to}
                  className="w-full xl:h-full"
                />
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
