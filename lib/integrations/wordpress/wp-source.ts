import { HttpError } from "@/lib/api/http-errors";
import {
  createWpDraft,
  testWpConnection,
  type TWpConnection,
  type TWpDraftInput,
} from "@/lib/integrations/wordpress/wp-rest";
import { LEAD_SOURCE_PROVIDER } from "@/lib/leads/constants";
import { findProjectSource } from "@/lib/leads/manage-lead-source";
import { readLeadSourceWpPassword } from "@/lib/integrations/wordpress/wp-credentials";
import { LeadSource } from "@/models";

const NOT_VERIFIED_MESSAGE = "Verify the Crawllex plugin on this WordPress site first.";

/** Loads the stored WordPress connection for a project's lead source. Server-only. */
export async function wpConnectionForSource(projectId: string, sourceId: string): Promise<TWpConnection> {
  const source = await findProjectSource(projectId, sourceId);
  if (!source.siteUrl || !source.wpUsername) {
    throw new HttpError(422, NOT_VERIFIED_MESSAGE);
  }
  const applicationPassword = readLeadSourceWpPassword(source);
  if (!applicationPassword) {
    throw new HttpError(422, NOT_VERIFIED_MESSAGE);
  }
  return {
    siteUrl: source.siteUrl,
    username: source.wpUsername,
    applicationPassword,
  };
}

/** Connection for the project's connected WordPress lead source (the one-per-project MVP source). */
export async function wpConnectionForProject(projectId: string): Promise<TWpConnection> {
  const source = await LeadSource.findOne({
    projectId,
    provider: LEAD_SOURCE_PROVIDER,
    status: "connected",
  });
  if (!source) {
    throw new HttpError(422, "Connect WordPress for this project before pushing a blog.");
  }
  return wpConnectionForSource(projectId, String(source._id));
}

export async function checkWpSourceConnection(projectId: string, sourceId: string) {
  const connection = await wpConnectionForSource(projectId, sourceId);
  return testWpConnection(connection);
}

export async function pushWpDraft(projectId: string, sourceId: string, input: TWpDraftInput) {
  const connection = await wpConnectionForSource(projectId, sourceId);
  return createWpDraft(connection, input);
}
