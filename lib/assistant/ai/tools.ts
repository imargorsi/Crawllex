import { z } from "zod";

import { getAnalyticsDimensions, getAnalyticsOverview } from "@/lib/integrations/read-analytics";
import {
  ANALYTICS_DIMENSION_TYPES,
  ANALYTICS_MAX_RANGE_DAYS,
  ANALYTICS_SOURCES,
} from "@/lib/integrations/constants";
import { countLeadsInRange } from "@/lib/leads/list-leads";
import { getSeoActivityCounts } from "@/lib/seo-activities/list-seo-activities";
import { hasPermission } from "@/lib/rbac/access";

export const ASSISTANT_TOOL_ROW_LIMIT = 25;
const TEXT_LIMIT = 200;
const DAY_MS = 86_400_000;

export type TAssistantToolPermission = "leads.view" | "analytics.view" | "seo_activities.view";

export type TAssistantToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date Must Be YYYY-MM-DD.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Date Is Not Valid.");

function spanDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
}

function refineRange(value: { from: string; to: string }, ctx: z.RefinementCtx) {
  if (value.from > value.to) {
    ctx.addIssue({ code: "custom", path: ["to"], message: "To Must Be On Or After From." });
  }
  if (spanDays(value.from, value.to) > ANALYTICS_MAX_RANGE_DAYS) {
    ctx.addIssue({
      code: "custom",
      path: ["to"],
      message: `Range Must Be ${ANALYTICS_MAX_RANGE_DAYS} Days Or Fewer.`,
    });
  }
}

const rangeArgs = z.object({ from: isoDate, to: isoDate }).superRefine(refineRange);

const optionalRangeArgs = z
  .object({ from: isoDate.optional(), to: isoDate.optional() })
  .superRefine((value, ctx) => {
    if (value.from && value.to && value.from > value.to) {
      ctx.addIssue({ code: "custom", path: ["to"], message: "To Must Be On Or After From." });
    }
  });

const topDimensionsArgs = z
  .object({
    from: isoDate,
    to: isoDate,
    source: z.enum(ANALYTICS_SOURCES),
    dimensionType: z.enum(ANALYTICS_DIMENSION_TYPES),
    limit: z.number().int().min(1).max(ASSISTANT_TOOL_ROW_LIMIT).default(10),
  })
  .superRefine(refineRange);

type TRangeArgs = z.infer<typeof rangeArgs>;
type TOptionalRangeArgs = z.infer<typeof optionalRangeArgs>;
type TTopDimensionsArgs = z.infer<typeof topDimensionsArgs>;

const RANGE_PARAMETERS = {
  type: "OBJECT",
  properties: {
    from: { type: "STRING", description: "Start date, YYYY-MM-DD (inclusive)." },
    to: { type: "STRING", description: "End date, YYYY-MM-DD (inclusive)." },
  },
  required: ["from", "to"],
};

function truncate(value: string): string {
  return value.length > TEXT_LIMIT ? `${value.slice(0, TEXT_LIMIT)}…` : value;
}

export const ASSISTANT_TOOLS = {
  get_leads_count: {
    name: "get_leads_count",
    description: "Count leads received in a date range. Returns a number only, never lead details.",
    permission: "leads.view",
    args: rangeArgs,
    parameters: RANGE_PARAMETERS,
    run: async (projectId: string, args: TRangeArgs) => ({
      from: args.from,
      to: args.to,
      leads: await countLeadsInRange(projectId, args.from, args.to),
    }),
  },

  get_analytics_overview: {
    name: "get_analytics_overview",
    description:
      "Search Console and GA4 totals for a date range: clicks, impressions, CTR, average position, sessions, users, new users, organic sessions, page views, engagement rate, average session duration.",
    permission: "analytics.view",
    args: rangeArgs,
    parameters: RANGE_PARAMETERS,
    run: async (projectId: string, args: TRangeArgs) => {
      const overview = await getAnalyticsOverview(projectId, { from: args.from, to: args.to });
      return {
        from: args.from,
        to: args.to,
        gsc: {
          clicks: overview.cards.clicks.value ?? null,
          impressions: overview.cards.impressions.value ?? null,
          ctr: overview.cards.ctr.value ?? null,
          averagePosition: overview.cards.position.value ?? null,
        },
        ga4: {
          sessions: overview.ga4.sessions,
          totalUsers: overview.ga4.totalUsers,
          newUsers: overview.ga4.newUsers,
          organicSessions: overview.ga4.organicSessions,
        },
        engagement: {
          pageViews: overview.engagement.pageViews.value ?? null,
          engagementRate: overview.engagement.engagementRate.value ?? null,
          avgSessionDurationSeconds: overview.engagement.avgSessionDuration.value ?? null,
        },
      };
    },
  },

  get_analytics_top_dimensions: {
    name: "get_analytics_top_dimensions",
    description:
      "Top rows of one dimension for a source in a date range. Source gsc uses clicks; ga4 uses sessions. Dimensions: query, page, country, device, landing_page, channel_group.",
    permission: "analytics.view",
    args: topDimensionsArgs,
    parameters: {
      type: "OBJECT",
      properties: {
        from: RANGE_PARAMETERS.properties.from,
        to: RANGE_PARAMETERS.properties.to,
        source: { type: "STRING", enum: [...ANALYTICS_SOURCES] },
        dimensionType: { type: "STRING", enum: [...ANALYTICS_DIMENSION_TYPES] },
        limit: { type: "INTEGER", description: "Rows to return, 1 to 25. Default 10." },
      },
      required: ["from", "to", "source", "dimensionType"],
    },
    run: async (projectId: string, args: TTopDimensionsArgs) => {
      const dto = await getAnalyticsDimensions(projectId, {
        from: args.from,
        to: args.to,
        source: args.source,
        dimensionType: args.dimensionType,
        limit: args.limit,
      });
      return {
        source: args.source,
        dimensionType: args.dimensionType,
        from: args.from,
        to: args.to,
        rows: dto.rows.slice(0, args.limit).map((row) => ({
          value: truncate(row.dimensionValue),
          clicks: row.clicks ?? null,
          impressions: row.impressions ?? null,
          ctr: row.ctr ?? null,
          position: row.position ?? null,
          sessions: row.sessions ?? null,
          totalUsers: row.totalUsers ?? null,
        })),
      };
    },
  },

  get_seo_activity_counts: {
    name: "get_seo_activity_counts",
    description:
      "Count logged SEO activities by type (blogs, backlinks, technical, etc.) in an optional date range.",
    permission: "seo_activities.view",
    args: optionalRangeArgs,
    parameters: {
      type: "OBJECT",
      properties: {
        from: { type: "STRING", description: "Start date, YYYY-MM-DD (optional)." },
        to: { type: "STRING", description: "End date, YYYY-MM-DD (optional)." },
      },
    },
    run: async (projectId: string, args: TOptionalRangeArgs) => ({
      from: args.from ?? null,
      to: args.to ?? null,
      counts: await getSeoActivityCounts(projectId, args.from ?? null, args.to ?? null),
    }),
  },
};

export type TAssistantToolName = keyof typeof ASSISTANT_TOOLS;

export const ASSISTANT_TOOL_NAMES = Object.keys(ASSISTANT_TOOLS) as TAssistantToolName[];

export function assistantToolDeclarations() {
  return ASSISTANT_TOOL_NAMES.map((name) => {
    const tool = ASSISTANT_TOOLS[name];
    return { name: tool.name, description: tool.description, parameters: tool.parameters };
  });
}

/**
 * Runs one tool call from the model. Project scope and permission come from the server,
 * never from the model. Returns an error object instead of throwing so the model can recover.
 */
export async function executeAssistantTool(
  name: string,
  rawArgs: unknown,
  projectId: string,
  permissions: readonly string[],
): Promise<TAssistantToolResult> {
  if (!(ASSISTANT_TOOL_NAMES as string[]).includes(name)) {
    return { ok: false, error: "Unknown Tool." };
  }
  const tool = ASSISTANT_TOOLS[name as TAssistantToolName];

  if (!hasPermission(permissions, tool.permission)) {
    return { ok: false, error: "Not Permitted For This Project." };
  }

  const parsed = tool.args.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  try {
    const data = await (tool.run as (p: string, a: unknown) => Promise<unknown>)(
      projectId,
      parsed.data,
    );
    return { ok: true, data };
  } catch (error) {
    console.error(`[assistant-ai] Tool ${name} failed.`, error);
    return { ok: false, error: "Data Is Temporarily Unavailable." };
  }
}
