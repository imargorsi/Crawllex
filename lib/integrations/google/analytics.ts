import { google } from "googleapis";

import { classifyEvent, isContactKind } from "@/lib/analytics/event-summary";
import { topRowsPerDay } from "@/lib/analytics/top-rows-per-day";
import { ANALYTICS_DIMENSION_TOP_N } from "@/lib/integrations/constants";
import {
  createAnalyticsAuth,
  withGoogleBackoff,
} from "@/lib/integrations/google/auth";

export type TGa4DailyTotals = {
  date: string;
  sessions: number;
  totalUsers: number;
  newUsers: number;
  engagedSessions: number;
  organicSessions: number;
  averageSessionDuration: number;
  screenPageViews: number;
};

export type TGa4DimensionRow = {
  date: string;
  dimensionValue: string;
  sessions: number;
  totalUsers: number;
};

function normalizeGa4PropertyId(propertyId: string): string {
  const trimmed = propertyId.trim();
  if (trimmed.startsWith("properties/")) return trimmed;
  return `properties/${trimmed}`;
}

function formatGa4Date(value: string): string {
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return value;
}

export async function listGa4Properties(): Promise<Array<{ id: string; name: string }>> {
  const auth = createAnalyticsAuth();
  const admin = google.analyticsadmin({ version: "v1beta", auth });

  const accountSummaries: Array<{ id: string; name: string }> = [];
  let pageToken: string | undefined;

  do {
    const response = await withGoogleBackoff(() =>
      admin.accountSummaries.list({ pageSize: 200, pageToken }),
    );

    for (const account of response.data.accountSummaries ?? []) {
      for (const property of account.propertySummaries ?? []) {
        if (!property.property) continue;
        accountSummaries.push({
          id: property.property,
          name: property.displayName
            ? `${property.displayName} (${property.property})`
            : property.property,
        });
      }
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return accountSummaries.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchGa4DailyTotals(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<TGa4DailyTotals[]> {
  const auth = createAnalyticsAuth();
  const dataApi = google.analyticsdata({ version: "v1beta", auth });
  const property = normalizeGa4PropertyId(propertyId);

  const [coreResponse, organicResponse] = await Promise.all([
    withGoogleBackoff(() =>
      dataApi.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "date" }],
          metrics: [
            { name: "sessions" },
            { name: "totalUsers" },
            { name: "newUsers" },
            { name: "engagedSessions" },
            { name: "averageSessionDuration" },
            { name: "screenPageViews" },
          ],
          limit: "25000",
          returnPropertyQuota: true,
        },
      }),
    ),
    withGoogleBackoff(() =>
      dataApi.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "date" }],
          metrics: [{ name: "sessions" }],
          dimensionFilter: {
            filter: {
              fieldName: "sessionDefaultChannelGroup",
              stringFilter: {
                matchType: "EXACT",
                value: "Organic Search",
              },
            },
          },
          limit: "25000",
          returnPropertyQuota: true,
        },
      }),
    ),
  ]);

  const organicByDate = new Map<string, number>();
  for (const row of organicResponse.data.rows ?? []) {
    const date = formatGa4Date(row.dimensionValues?.[0]?.value ?? "");
    if (!date) continue;
    organicByDate.set(date, Number(row.metricValues?.[0]?.value ?? 0));
  }

  return (coreResponse.data.rows ?? [])
    .map((row) => {
      const date = formatGa4Date(row.dimensionValues?.[0]?.value ?? "");
      return {
        date,
        sessions: Number(row.metricValues?.[0]?.value ?? 0),
        totalUsers: Number(row.metricValues?.[1]?.value ?? 0),
        newUsers: Number(row.metricValues?.[2]?.value ?? 0),
        engagedSessions: Number(row.metricValues?.[3]?.value ?? 0),
        averageSessionDuration: Number(row.metricValues?.[4]?.value ?? 0),
        screenPageViews: Number(row.metricValues?.[5]?.value ?? 0),
        organicSessions: organicByDate.get(date) ?? 0,
      };
    })
    .filter((row) => Boolean(row.date));
}

async function fetchGa4DimensionRows(
  propertyId: string,
  startDate: string,
  endDate: string,
  dimensionName: "country" | "landingPage" | "pagePath" | "sessionDefaultChannelGroup",
): Promise<TGa4DimensionRow[]> {
  const auth = createAnalyticsAuth();
  const dataApi = google.analyticsdata({ version: "v1beta", auth });
  const property = normalizeGa4PropertyId(propertyId);

  const response = await withGoogleBackoff(() =>
    dataApi.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }, { name: dimensionName }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: String(ANALYTICS_DIMENSION_TOP_N * 120),
        returnPropertyQuota: true,
      },
    }),
  );

  return (response.data.rows ?? [])
    .map((row) => ({
      date: formatGa4Date(row.dimensionValues?.[0]?.value ?? ""),
      dimensionValue: row.dimensionValues?.[1]?.value ?? "",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      totalUsers: Number(row.metricValues?.[1]?.value ?? 0),
    }))
    .filter((row) => row.date && row.dimensionValue);
}

export async function fetchGa4TopDimensionsByDay(
  propertyId: string,
  startDate: string,
  endDate: string,
  dimensionName: "country" | "landingPage" | "pagePath" | "sessionDefaultChannelGroup",
): Promise<TGa4DimensionRow[]> {
  const rows = await fetchGa4DimensionRows(propertyId, startDate, endDate, dimensionName);
  return topRowsPerDay(
    rows,
    ANALYTICS_DIMENSION_TOP_N,
    (a, b) => b.sessions - a.sessions || b.totalUsers - a.totalUsers,
  );
}

export { normalizeGa4PropertyId };

export type TGa4EventRow = {
  date: string;
  eventName: string;
  eventCount: number;
};

/** Top GA4 events per day by event count. Includes every event name the property records. */
export async function fetchGa4TopEventsByDay(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<TGa4EventRow[]> {
  const auth = createAnalyticsAuth();
  const dataApi = google.analyticsdata({ version: "v1beta", auth });
  const property = normalizeGa4PropertyId(propertyId);

  const response = await withGoogleBackoff(() =>
    dataApi.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }, { name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: String(ANALYTICS_DIMENSION_TOP_N * 120),
        returnPropertyQuota: true,
      },
    }),
  );

  const parsed: TGa4EventRow[] = [];
  for (const row of response.data.rows ?? []) {
    const date = formatGa4Date(row.dimensionValues?.[0]?.value ?? "");
    const eventName = row.dimensionValues?.[1]?.value ?? "";
    if (!date || !eventName) continue;
    parsed.push({ date, eventName, eventCount: Number(row.metricValues?.[0]?.value ?? 0) });
  }

  // Contact clicks (call, email, WhatsApp) stay even when outside the per-day top N.
  return topRowsPerDay(
    parsed,
    ANALYTICS_DIMENSION_TOP_N,
    (a, b) => b.eventCount - a.eventCount,
    (row) => isContactKind(classifyEvent(row.eventName)),
  );
}
