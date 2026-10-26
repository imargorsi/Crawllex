import sharp from "sharp";

import type { TDocImage } from "@/lib/seo-activities/google-doc";

/** Widest an image is kept. Blog columns are narrower than this, so bigger files only slow the upload. */
export const BLOG_IMAGE_MAX_WIDTH = 1600;
export const BLOG_IMAGE_WEBP_QUALITY = 80;

export type TUploadImage = {
  contentType: string;
  extension: string;
  bytes: Buffer;
};

/**
 * Shrinks a Doc image before upload: resized to BLOG_IMAGE_MAX_WIDTH and re-encoded as WebP.
 * If the image cannot be decoded, the original bytes are uploaded unchanged.
 */
export async function optimizeDocImage(image: TDocImage): Promise<TUploadImage> {
  try {
    const bytes = await sharp(image.bytes, { failOn: "error" })
      .rotate()
      .resize({ width: BLOG_IMAGE_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: BLOG_IMAGE_WEBP_QUALITY })
      .toBuffer();
    return { contentType: "image/webp", extension: "webp", bytes };
  } catch {
    return { contentType: image.contentType, extension: image.extension, bytes: image.bytes };
  }
}
