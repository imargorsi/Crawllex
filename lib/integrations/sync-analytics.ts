import type { Types } from "mongoose";

import {
  ANALYTICS_BACKFILL_DAYS,
  ANALYTICS_INCREMENTAL_LOOKBACK_DAYS,
  ANALYTICS_MANUAL_SYNC_COOLDOWN_MS,
  ANALYTICS_SYNC_PROJECT_THROTTLE_MS,
  type TAnalyticsDimensionType,
  type TGoogleIntegrationService,
} from "@/lib/integrations/constants";
import {
  addUtcDays,
  enumerateUtcDateRange,
  toUtcDateString,
  utcYesterdayString,
} from "@/lib/integrations/date.utils";
import {
  fetchGa4DailyTotals,
  fetchGa4TopDimensionsByDay,
  fetchGa4TopEventsByDay,
  normalizeGa4PropertyId,
} from "@/lib/integrations/google/analytics";
import { formatGoogleError, GoogleNotConfiguredError } from "@/lib/integrations/google/auth";
import {
  fetchGscDailyTotals,
  fetchGscTopDimensionsByDay,
} from "@/lib/integrations/google/search-console";
import { serializeProjectIntegration } from "@/lib/integrations/serialize-integration";
import {
  AnalyticsDailyMetric,
  AnalyticsDimensionRow,
  ProjectIntegration,
  type ProjectIntegrationDocument,
} from "@/models";
import type {
  TAnalyticsSyncResultDto,
  TProjectIntegrationDto,
} from "@/types/analytics.types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveSyncWindow(integration: ProjectIntegrationDocument): {
  startDate: string;
  endDate: string;
} {
  const endDate = utcYesterdayString();
  if (!integration.lastSyncedAt) {
    return {
      startDate: addUtcDays(endDate, -(ANALYTICS_BACKFILL_DAYS - 1)),
      endDate,
    };
  }

  const lastSynced = toUtcDateString(integration.lastSyncedAt);
  const lookbackStart = addUtcDays(lastSynced, -ANALYTICS_INCREMENTAL_LOOKBACK_DAYS);
  const startDate = lookbackStart > endDate ? endDate : lookbackStart;
  return { startDate, endDate };
}

/**
 * Abort writes if the operator disconnected or swapped the property while this
 * sync was in flight (after() / cron / manual can overlap).
 */
async function isSyncTargetStillValid(
  integrationId: Types.ObjectId,
  expectedPropertyId: string,
): Promise<boolean> {
  const fresh = await ProjectIntegration.findById(integrationId)
    .select("status externalPropertyId")
    .lean();
  return (
    !!fresh &&
    fresh.status !== "disconnected" &&
    fresh.externalPropertyId === expectedPropertyId
  );
}

/**
 * If disconnect won the race, clear rows this in-flight sync may have rewritten.
 * If the property was swapped, do not purge — the new property's sync owns the cache.
 */
async function cleanupAfterStaleSync(
  projectId: Types.ObjectId,
  source: "gsc" | "ga4",
  integrationId: Types.ObjectId,
): Promise<void> {
  const fresh = await ProjectIntegration.findById(integrationId)
    .select("status externalPropertyId")
    .lean();
  if (fresh && fresh.status !== "disconnected" && fresh.externalPropertyId) {
    return;
  }
  await Promise.all([
    AnalyticsDailyMetric.deleteMany({ projectId, source }),
    AnalyticsDimensionRow.deleteMany({ projectId, source }),
  ]);
}

async function markIntegrationError(
  integrationId: Types.ObjectId,
  expectedPropertyId: string,
  message: string,
): Promise<void> {
  if (!expectedPropertyId) return;
  await ProjectIntegration.findOneAndUpdate(
    {
      _id: integrationId,
      status: { $in: ["connected", "error"] },
      externalPropertyId: expectedPropertyId,
    },
    {
      $set: {
        status: "error",
        lastError: message.slice(0, 1000),
      },
    },
  );
}

async function markIntegrationSynced(
  integrationId: Types.ObjectId,
  expectedPropertyId: string,
  extraSet: { eventsBackfilledAt?: Date } = {},
): Promise<boolean> {
  const updated = await ProjectIntegration.findOneAndUpdate(
    {
      _id: integrationId,
      status: { $in: ["connected", "error"] },
      externalPropertyId: expectedPropertyId,
    },
    {
      $set: {
        status: "connected",
        lastError: null,
        lastSyncedAt: new Date(),
        ...extraSet,
      },
    },
  );
  return !!updated;
}

async function replaceDimensionRows(params: {
  projectId: Types.ObjectId;
  source: "gsc" | "ga4";
  dimensionType: TAnalyticsDimensionType;
  dates: string[];
  rows: Array<{
    date: string;
    dimensionValue: string;
    clicks?: number | null;
    impressions?: number | null;
    ctr?: number | null;
    position?: number | null;
    sessions?: number | null;
    totalUsers?: number | null;
    eventCount?: number | null;
  }>;
}): Promise<void> {
  if (params.dates.length === 0) return;

  await AnalyticsDimensionRow.deleteMany({
    projectId: params.projectId,
    source: params.source,
    dimensionType: params.dimensionType,
    date: { $in: params.dates },
  });

  if (params.rows.length === 0) return;

  await AnalyticsDimensionRow.insertMany(
    params.rows.map((row) => ({
      projectId: params.projectId,
      date: row.date,
      source: params.source,
      dimensionType: params.dimensionType,
      dimensionValue: row.dimensionValue,
      clicks: row.clicks ?? null,
      impressions: row.impressions ?? null,
      ctr: row.ctr ?? null,
      position: row.position ?? null,
      sessions: row.sessions ?? null,
      totalUsers: row.totalUsers ?? null,
      eventCount: row.eventCount ?? null,
    })),
    { ordered: false },
  );
}

async function syncGscIntegration(
  integration: ProjectIntegrationDocument,
): Promise<{ ok: boolean; message: string }> {
  const siteUrl = integration.externalPropertyId?.trim();
  if (!siteUrl) {
    return { ok: false, message: "GSC property ID is missing." };
  }

  const expectedPropertyId = siteUrl;
  const integrationId = integration._id as Types.ObjectId;
  const abortMessage = "GSC Sync Aborted (Property Changed Or Disconnected).";

  try {
    const { startDate, endDate } = resolveSyncWindow(integration);
    if (startDate > endDate) {
      const stillValid = await markIntegrationSynced(integrationId, expectedPropertyId);
      return stillValid ? { ok: true, message: "Already up to date." } : { ok: false, message: abortMessage };
    }

    const totals = await fetchGscDailyTotals(siteUrl, startDate, endDate);

    if (!(await isSyncTargetStillValid(integrationId, expectedPropertyId))) {
      await cleanupAfterStaleSync(integration.projectId, "gsc", integrationId);
      return { ok: false, message: abortMessage };
    }

    for (const row of totals) {
      await AnalyticsDailyMetric.findOneAndUpdate(
        { projectId: integration.projectId, date: row.date, source: "gsc" },
        {
          $set: {
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          },
        },
        { upsert: true, new: true },
      );
    }

    const [queries, pages, countries, devices] = await Promise.all([
      fetchGscTopDimensionsByDay(siteUrl, startDate, endDate, "query"),
      fetchGscTopDimensionsByDay(siteUrl, startDate, endDate, "page"),
      fetchGscTopDimensionsByDay(siteUrl, startDate, endDate, "country"),
      fetchGscTopDimensionsByDay(siteUrl, startDate, endDate, "device"),
    ]);

    if (!(await isSyncTargetStillValid(integrationId, expectedPropertyId))) {
      await cleanupAfterStaleSync(integration.projectId, "gsc", integrationId);
      return { ok: false, message: abortMessage };
    }

    // Always cover the full sync window so zero-traffic days clear stale top-N rows.
    const allDates = enumerateUtcDateRange(startDate, endDate);

    await Promise.all([
      replaceDimensionRows({
        projectId: integration.projectId,
        source: "gsc",
        dimensionType: "query",
        dates: allDates,
        rows: queries,
      }),
      replaceDimensionRows({
        projectId: integration.projectId,
        source: "gsc",
        dimensionType: "page",
        dates: allDates,
        rows: pages,
      }),
      replaceDimensionRows({
        projectId: integration.projectId,
        source: "gsc",
        dimensionType: "country",
        dates: allDates,
        rows: countries,
      }),
      replaceDimensionRows({
        projectId: integration.projectId,
        source: "gsc",
        dimensionType: "device",
        dates: allDates,
        rows: devices,
      }),
    ]);

    const stillValid = await markIntegrationSynced(integrationId, expectedPropertyId);
    if (!stillValid) {
      await cleanupAfterStaleSync(integration.projectId, "gsc", integrationId);
      return { ok: false, message: abortMessage };
    }
    return { ok: true, message: "GSC sync completed." };
  } catch (error) {
    const message = formatGoogleError(error);
    await markIntegrationError(integrationId, expectedPropertyId, message);
    return { ok: false, message };
  }
}

async function syncGa4Integration(
  integration: ProjectIntegrationDocument,
): Promise<{ ok: boolean; message: string }> {
  const propertyId = integration.externalPropertyId?.trim();
  if (!propertyId) {
    return { ok: false, message: "GA4 property ID is missing." };
  }

  const expectedPropertyId = propertyId;
  const integrationId = integration._id as Types.ObjectId;
  const abortMessage = "GA4 Sync Aborted (Property Changed Or Disconnected).";

  try {
    const { startDate, endDate } = resolveSyncWindow(integration);
    if (startDate > endDate) {
      const stillValid = await markIntegrationSynced(integrationId, expectedPropertyId);
      return stillValid ? { ok: true, message: "Already up to date." } : { ok: false, message: abortMessage };
    }

    const normalizedId = normalizeGa4PropertyId(propertyId);
    const totals = await fetchGa4DailyTotals(normalizedId, startDate, endDate);

    if (!(await isSyncTargetStillValid(integrationId, expectedPropertyId))) {
      await cleanupAfterStaleSync(integration.projectId, "ga4", integrationId);
      return { ok: false, message: abortMessage };
    }

    for (const row of totals) {
      await AnalyticsDailyMetric.findOneAndUpdate(
        { projectId: integration.projectId, date: row.date, source: "ga4" },
        {
          $set: {
            sessions: row.sessions,
            totalUsers: row.totalUsers,
            newUsers: row.newUsers,
            engagedSessions: row.engagedSessions,
            organicSessions: row.organicSessions,
            averageSessionDuration: row.averageSessionDuration,
            screenPageViews: row.screenPageViews,
          },
        },
        { upsert: true, new: true },
      );
    }

    // Events were added after the first sync, so older projects need one 90-day event backfill.
    const eventsStart = integration.eventsBackfilledAt
      ? startDate
      : addUtcDays(endDate, -(ANALYTICS_BACKFILL_DAYS - 1));
    const [countries, landingPages, pages, channelGroups, events] = await Promise.all([
      fetchGa4TopDimensionsByDay(normalizedId, startDate, endDate, "country"),
      fetchGa4TopDimensionsByDay(normalizedId, startDate, endDate, "landingPage"),
      fetchGa4TopDimensionsByDay(normalizedId, startDate, endDate, "pagePath"),
      fetchGa4TopDimensionsByDay(normalizedId, startDate, endDate, "sessionDefaultChannelGroup"),
      fetchGa4TopEventsByDay(normalizedId, eventsStart, endDate),
    ]);

    if (!(await isSyncTargetStillValid(integrationId, expectedPropertyId))) {
      await cleanupAfterStaleSync(integration.projectId, "ga4", integrationId);
      return { ok: false, message: abortMessage };
    }

    // Always cover the full sync window so zero-traffic days clear stale top-N rows.
    const allDates = enumerateUtcDateRange(startDate, endDate);

    await Promise.all([
      replaceDimensionRows({
        projectId: integration.projectId,
        source: "ga4",
        dimensionType: "country",
        dates: allDates,
        rows: countries,
      }),
      replaceDimensionRows({
        projectId: integration.projectId,
        source: "ga4",
        dimensionType: "landing_page",
        dates: allDates,
        rows: landingPages,
      }),
      replaceDimensionRows({
        projectId: integration.projectId,
        source: "ga4",
        dimensionType: "page",
        dates: allDates,
        rows: pages,
      }),
      replaceDimensionRows({
        projectId: integration.projectId,
        source: "ga4",
        dimensionType: "channel_group",
        dates: allDates,
        rows: channelGroups,
      }),
      replaceDimensionRows({
        projectId: integration.projectId,
        source: "ga4",
        dimensionType: "event_name",
        dates: enumerateUtcDateRange(eventsStart, endDate),
        rows: events.map((row) => ({
          date: row.date,
          dimensionValue: row.eventName,
          eventCount: row.eventCount,
        })),
      }),
    ]);

    const stillValid = await markIntegrationSynced(integrationId, expectedPropertyId, {
      eventsBackfilledAt: new Date(),
    });
    if (!stillValid) {
      await cleanupAfterStaleSync(integration.projectId, "ga4", integrationId);
      return { ok: false, message: abortMessage };
    }
    return { ok: true, message: "GA4 sync completed." };
  } catch (error) {
    const message = formatGoogleError(error);
    await markIntegrationError(integrationId, expectedPropertyId, message);
    return { ok: false, message };
  }
}

export async function syncProjectIntegrations(
  projectId: string,
  services?: TGoogleIntegrationService[],
): Promise<TAnalyticsSyncResultDto> {
  const filter: Record<string, unknown> = {
    projectId,
    provider: "google",
    status: { $in: ["connected", "error"] },
    externalPropertyId: { $ne: null },
  };
  if (services?.length) {
    filter.service = { $in: services };
  }

  const integrations = await ProjectIntegration.find(filter);
  const result: TAnalyticsSyncResultDto = {
    projectId,
    gsc: null,
    ga4: null,
  };

  for (const integration of integrations) {
    if (integration.service === "gsc") {
      result.gsc = await syncGscIntegration(integration);
    } else if (integration.service === "ga4") {
      result.ga4 = await syncGa4Integration(integration);
    }
  }

  return result;
}

export async function syncAllConnectedProjects(): Promise<{
  projectsSynced: number;
  results: TAnalyticsSyncResultDto[];
}> {
  const integrations = await ProjectIntegration.find({
    provider: "google",
    status: { $in: ["connected", "error"] },
    externalPropertyId: { $ne: null },
  }).select("projectId");

  const projectIds = [...new Set(integrations.map((doc) => String(doc.projectId)))];

  const results: TAnalyticsSyncResultDto[] = [];
  for (const projectId of projectIds) {
    results.push(await syncProjectIntegrations(projectId));
    await sleep(ANALYTICS_SYNC_PROJECT_THROTTLE_MS);
  }

  return { projectsSynced: projectIds.length, results };
}

export function assertManualSyncAllowed(
  integrations: ProjectIntegrationDocument[],
): string | null {
  const now = Date.now();
  for (const integration of integrations) {
    if (!integration.lastSyncedAt) continue;
    const elapsed = now - integration.lastSyncedAt.getTime();
    if (elapsed < ANALYTICS_MANUAL_SYNC_COOLDOWN_MS) {
      const minutesLeft = Math.ceil((ANALYTICS_MANUAL_SYNC_COOLDOWN_MS - elapsed) / 60000);
      return `Refresh limited. Wait ${minutesLeft}m.`;
    }
  }
  return null;
}

export async function getProjectIntegrationsMap(
  projectId: string,
): Promise<{ gsc: TProjectIntegrationDto | null; ga4: TProjectIntegrationDto | null }> {
  const docs = await ProjectIntegration.find({ projectId, provider: "google" });
  const gsc = docs.find((doc) => doc.service === "gsc") ?? null;
  const ga4 = docs.find((doc) => doc.service === "ga4") ?? null;
  return {
    gsc: gsc ? serializeProjectIntegration(gsc) : null,
    ga4: ga4 ? serializeProjectIntegration(ga4) : null,
  };
}

export { GoogleNotConfiguredError };
