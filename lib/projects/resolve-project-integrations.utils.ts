import type { Types } from "mongoose";

import {
  GOOGLE_INTEGRATION_SERVICES,
  GOOGLE_PROVIDER,
} from "@/lib/integrations/constants";
import { LEAD_SOURCE_PROVIDER } from "@/lib/leads/constants";
import { LeadSource, ProjectIntegration } from "@/models";
import type { TProjectListIntegrations } from "@/types/project.types";

const DISCONNECTED: TProjectListIntegrations = {
  gsc: "disconnected",
  ga4: "disconnected",
  wordpress: "disconnected",
};

/**
 * Batch-load compact Google integration statuses for project list rows.
 * Missing docs count as disconnected (same as Settings empty state).
 */
export async function resolveProjectIntegrationsMap(
  projectIds: Types.ObjectId[],
): Promise<Map<string, TProjectListIntegrations>> {
  const map = new Map<string, TProjectListIntegrations>();
  if (projectIds.length === 0) return map;

  for (const id of projectIds) {
    map.set(id.toString(), { ...DISCONNECTED });
  }

  const docs = await ProjectIntegration.find({
    projectId: { $in: projectIds },
    provider: GOOGLE_PROVIDER,
    service: { $in: [...GOOGLE_INTEGRATION_SERVICES] },
  })
    .select("projectId service status")
    .lean();

  for (const doc of docs) {
    const key = doc.projectId.toString();
    const current = map.get(key) ?? { ...DISCONNECTED };
    if (doc.service === "gsc" || doc.service === "ga4") {
      current[doc.service] = doc.status;
    }
    map.set(key, current);
  }

  const leadSources = await LeadSource.find({
    projectId: { $in: projectIds },
    provider: LEAD_SOURCE_PROVIDER,
  })
    .select("projectId status")
    .lean();

  for (const doc of leadSources) {
    const key = doc.projectId.toString();
    const current = map.get(key) ?? { ...DISCONNECTED };
    current.wordpress = doc.status === "error" ? "error" : "connected";
    map.set(key, current);
  }

  return map;
}
