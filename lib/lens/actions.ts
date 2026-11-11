import { lensPath, lensPost } from "@/lib/lens/client";

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

/** Queues a manual check. Enrolls first, so projects approved before enrollment existed can be checked. */
export async function queueLensRun(project: TLensProject): Promise<{ jobId: string; status: string; created: boolean }> {
  await enrollLensProject(project);
  return lensPost<{ jobId: string; status: string; created: boolean }>(lensPath("projects", project.id, "runs"), {});
}
