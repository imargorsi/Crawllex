import { HttpError } from "@/lib/api/http-errors";
import { createWpDraft } from "@/lib/integrations/wordpress/wp-rest";
import { wpConnectionForProject } from "@/lib/integrations/wordpress/wp-source";
import { fetchPublicGoogleDocHtml, googleDocHtmlToWordPress } from "@/lib/seo-activities/google-doc";

/**
 * Converts a public Google Doc into a WordPress post body and creates it as a draft.
 * Throws before creating anything if the doc is private, empty, or WordPress refuses the post.
 */
export async function publishBlogDraft(
  projectId: string,
  input: { title: string; docUrl: string },
): Promise<{ postId: number; link: string; pushedAt: Date }> {
  const connection = await wpConnectionForProject(projectId);
  const content = googleDocHtmlToWordPress(await fetchPublicGoogleDocHtml(input.docUrl));
  if (!content) {
    throw new HttpError(422, "The Google Doc has no text to publish.");
  }

  const draft = await createWpDraft(connection, { title: input.title, content });
  return { postId: draft.id, link: draft.link, pushedAt: new Date() };
}
