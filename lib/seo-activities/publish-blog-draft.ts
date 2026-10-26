import { HttpError } from "@/lib/api/http-errors";
import { createWpDraft, trashWpPost } from "@/lib/integrations/wordpress/wp-rest";
import { wpConnectionForProject } from "@/lib/integrations/wordpress/wp-source";
import {
  GOOGLE_DOC_MAX_CHARS,
  fetchPublicGoogleDocHtml,
  googleDocHtmlToWordPress,
} from "@/lib/seo-activities/google-doc";

/**
 * Converts a public Google Doc into a WordPress post body and creates it as a draft.
 * Throws before creating anything if the doc is private, empty, or WordPress refuses the post.
 */
export async function publishBlogDraft(
  projectId: string,
  input: { title: string; docUrl: string }
): Promise<{ postId: number; link: string; pushedAt: Date }> {
  const connection = await wpConnectionForProject(projectId);
  const content = googleDocHtmlToWordPress(await fetchPublicGoogleDocHtml(input.docUrl));
  if (!content) {
    throw new HttpError(422, "The Google Doc has no text to publish.");
  }
  if (content.length > GOOGLE_DOC_MAX_CHARS) {
    throw new HttpError(422, "The Google Doc text is too long to publish.");
  }

  const draft = await createWpDraft(connection, { title: input.title, content });
  return { postId: draft.id, link: draft.link, pushedAt: new Date() };
}

/** Undoes publishBlogDraft when Crawllex cannot save the activity. Best effort. */
export async function discardBlogDraft(projectId: string, postId: number): Promise<void> {
  try {
    const connection = await wpConnectionForProject(projectId);
    await trashWpPost(connection, postId);
  } catch {
    // Never mask the original save error with a cleanup error.
  }
}
