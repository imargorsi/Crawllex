import { HttpError } from "@/lib/api/http-errors";
import {
  createWpDraft,
  deleteWpMedia,
  trashWpPost,
  uploadWpMedia,
  type TWpConnection,
} from "@/lib/integrations/wordpress/wp-rest";
import { wpConnectionForProject } from "@/lib/integrations/wordpress/wp-source";
import {
  GOOGLE_DOC_IMAGE_TOKEN_PREFIX,
  GOOGLE_DOC_MAX_CHARS,
  convertGoogleDoc,
  fetchPublicGoogleDocHtml,
} from "@/lib/seo-activities/google-doc";

/**
 * Image uploads are off by default. Uploads to client WordPress hosts hit gateway timeouts (504),
 * so the post is published without images until another media approach is in place.
 */
export const BLOG_UPLOAD_IMAGES = false;

/** Removes the image placeholders from the content when images are not uploaded. */
export function stripImagePlaceholders(content: string): string {
  return content
    .replace(/<p><img src="crawllex-image:\d+"[^>]*><\/p>/g, "")
    .replace(/<img src="crawllex-image:\d+"[^>]*>/g, "");
}

export type TBlogPublishOptions = { uploadImages?: boolean };

export type TPublishedBlogDraft = {
  postId: number;
  link: string;
  pushedAt: Date;
  /** Media library items uploaded for this draft. Kept so a failed save can delete them. */
  mediaIds: number[];
};

/**
 * Converts a public Google Doc into a WordPress post body and creates it as a draft.
 * Embedded images are uploaded to the WordPress media library first. If anything fails,
 * the uploads made so far are deleted, so a retry does not leave duplicates.
 */
export async function publishBlogDraft(
  projectId: string,
  input: { title: string; docUrl: string },
  options: TBlogPublishOptions = {}
): Promise<TPublishedBlogDraft> {
  const uploadImages = options.uploadImages ?? BLOG_UPLOAD_IMAGES;
  const connection = await wpConnectionForProject(projectId);
  const converted = convertGoogleDoc(await fetchPublicGoogleDocHtml(input.docUrl));
  if (!converted.content) {
    throw new HttpError(422, "The Google Doc has no text to publish.");
  }
  if (converted.content.length > GOOGLE_DOC_MAX_CHARS) {
    throw new HttpError(422, "The Google Doc text is too long to publish.");
  }

  const mediaIds: number[] = [];
  try {
    let content = converted.content;
    if (!uploadImages) {
      content = stripImagePlaceholders(content);
    }
    for (const [index, image] of (uploadImages ? converted.images : []).entries()) {
      const media = await uploadWpMedia(connection, {
        filename: `doc-image-${index + 1}.${image.extension}`,
        contentType: image.contentType,
        bytes: image.bytes,
      });
      mediaIds.push(media.id);
      const token = `src="${GOOGLE_DOC_IMAGE_TOKEN_PREFIX}${index}"`;
      content = content.replace(token, `src="${media.url.replace(/"/g, "&quot;")}"`);
    }

    const draft = await createWpDraft(connection, { title: input.title, content });
    return { postId: draft.id, link: draft.link, pushedAt: new Date(), mediaIds };
  } catch (error) {
    await deleteBlogMedia(connection, mediaIds);
    throw error;
  }
}

/** Deletes media uploaded for a draft. Best effort, one item at a time. */
async function deleteBlogMedia(connection: TWpConnection, mediaIds: number[]): Promise<void> {
  for (const mediaId of mediaIds) {
    await deleteWpMedia(connection, mediaId).catch(() => undefined);
  }
}

/** Undoes publishBlogDraft when Crawllex cannot save the activity. Best effort. */
export async function discardBlogDraft(projectId: string, postId: number, mediaIds: number[] = []): Promise<void> {
  try {
    const connection = await wpConnectionForProject(projectId);
    await trashWpPost(connection, postId).catch(() => undefined);
    await deleteBlogMedia(connection, mediaIds);
  } catch {
    // Never mask the original save error with a cleanup error.
  }
}
