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
import { optimizeDocImage } from "@/lib/seo-activities/optimize-doc-image";

/**
 * Images are shrunk before upload (see optimize-doc-image.ts) and uploaded one at a time.
 * Turn off to publish text only.
 */
export const BLOG_UPLOAD_IMAGES = true;

/** Attempts per image. A 502/504 from the WordPress host is retried after these waits. */
export const MEDIA_UPLOAD_ATTEMPTS = 3;
export const MEDIA_UPLOAD_RETRY_DELAYS_MS = [2_000, 5_000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function uploadWithRetry(
  connection: TWpConnection,
  input: { filename: string; contentType: string; bytes: Buffer }
): Promise<{ id: number; url: string }> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await uploadWpMedia(connection, input);
    } catch (error) {
      const gatewayError = error instanceof HttpError && error.statusCode === 502;
      if (!gatewayError || attempt >= MEDIA_UPLOAD_ATTEMPTS) throw error;
      await sleep(MEDIA_UPLOAD_RETRY_DELAYS_MS[attempt - 1] ?? 5_000);
    }
  }
}

/** Removes the image placeholders from the content when images are not uploaded. */
export function stripImagePlaceholders(content: string): string {
  return content
    .replace(/<p><img src="crawllex-image:\d+"[^>]*><\/p>/g, "")
    .replace(/<img src="crawllex-image:\d+"[^>]*>/g, "");
}

export type TBlogPublishOptions = { uploadImages?: boolean };

export type TBlogSeoFields = {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
};

/**
 * Placeholders used until the blog form has SEO inputs. Remove once the form sends real values.
 */
export const DUMMY_META_DESCRIPTION = "Placeholder meta description. Replace before publishing.";
export const DUMMY_FOCUS_KEYWORD = "placeholder keyword";

/** Rank Math post meta keys. */
export function rankMathMeta(title: string, seo: TBlogSeoFields = {}): Record<string, string> {
  return {
    rank_math_title: seo.metaTitle || title,
    rank_math_description: seo.metaDescription || DUMMY_META_DESCRIPTION,
    rank_math_focus_keyword: seo.focusKeyword || DUMMY_FOCUS_KEYWORD,
  };
}

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
  input: { title: string; docUrl: string; seo?: TBlogSeoFields },
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
    // Unique per push, so a new upload never collides with files left by earlier pushes.
    const batch = Date.now().toString(36);
    for (const [index, original] of (uploadImages ? converted.images : []).entries()) {
      const image = await optimizeDocImage(original);
      const media = await uploadWithRetry(connection, {
        filename: `doc-${batch}-${index + 1}.${image.extension}`,
        contentType: image.contentType,
        bytes: image.bytes,
      });
      mediaIds.push(media.id);
      const token = `src="${GOOGLE_DOC_IMAGE_TOKEN_PREFIX}${index}"`;
      content = content.replace(token, `src="${media.url.replace(/"/g, "&quot;")}"`);
    }

    const meta = rankMathMeta(input.title, input.seo);
    const draft = await createWpDraft(connection, { title: input.title, content, meta });
    if (!draft.meta?.rank_math_title) {
      // The post is created, but WordPress did not store the Rank Math fields over REST.
      console.warn(`Rank Math meta not saved on WordPress post ${draft.id}. Register the fields for REST.`);
    }
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
