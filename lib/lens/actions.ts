import { lensGet, lensPath, lensPost, lensPut } from "@/lib/lens/client";
import { LENS_FREQUENCY_MINUTES, frequencyFromMinutes, type TLensFrequency, type TLensSchedule } from "@/lib/lens/schedule";

/** Crawllex project fields Lens needs. The Lens project id is the Crawllex project id. */
export type TLensProject = { id: string; businessName: string; websiteUrl: string; status: string };

/**
 * Enrolls an approved project in Lens. Idempotent. Lens queues the first run only when the project has none,
 * so calling this again never repeats the first scan.
 */
export async function enrollLensProject(project: TLensProject): Promise<{ firstRunQueued: boolean }> {
  const body = await lensPost<{ firstRun: { jobId: string } | null }>(lensPath("projects", project.id, "enroll"), {
    name: project.businessName,
    websiteUrl: project.websiteUrl,
    status: project.status,
  });
  return { firstRunQueued: body.firstRun !== null };
}

/** Queues a manual check. The project must already be enrolled (the route checks this). */
export async function queueLensRun(project: TLensProject): Promise<{ jobId: string; status: string; created: boolean }> {
  return lensPost<{ jobId: string; status: string; created: boolean }>(lensPath("projects", project.id, "runs"), {});
}

/** The project's audit schedule in Lens. `frequency` is null when Lens has no schedule or a non-standard interval. */
export async function getLensSchedule(projectId: string): Promise<TLensSchedule> {
  const body = await lensGet<{ intervalMinutes: number | null; enabled: boolean; nextRunAt?: number }>(lensPath("projects", projectId, "schedule"));
  return {
    frequency: frequencyFromMinutes(body.intervalMinutes),
    enabled: body.enabled === true,
    nextRunAt: typeof body.nextRunAt === "number" ? new Date(body.nextRunAt).toISOString() : null,
  };
}

/** Sets how often Lens audits the project. Changing it keeps the cadence: the last audit plus the new interval. */
export async function setLensFrequency(projectId: string, frequency: TLensFrequency): Promise<void> {
  await lensPut(lensPath("projects", projectId, "schedule"), { intervalMinutes: LENS_FREQUENCY_MINUTES[frequency], enabled: true });
}
