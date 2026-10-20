import { HttpError } from "@/lib/api/http-errors";
import {
  createWpDraft,
  testWpConnection,
  type TWpConnection,
  type TWpDraftInput,
} from "@/lib/integrations/wordpress/wp-rest";
import { findProjectSource } from "@/lib/leads/manage-lead-source";
import { readLeadSourceWpPassword } from "@/lib/leads/wp-credentials";

const NOT_VERIFIED_MESSAGE = "Verify the Crawllex plugin on this WordPress site first.";

/** Loads the stored WordPress connection for a project's lead source. Server-only. */
export async function wpConnectionForSource(
  projectId: string,
  sourceId: string,
): Promise<TWpConnection> {
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

export async function checkWpSourceConnection(projectId: string, sourceId: string) {
  const connection = await wpConnectionForSource(projectId, sourceId);
  return testWpConnection(connection);
}

export async function pushWpDraft(projectId: string, sourceId: string, input: TWpDraftInput) {
  const connection = await wpConnectionForSource(projectId, sourceId);
  return createWpDraft(connection, input);
}
