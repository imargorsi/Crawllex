import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { optimizeDocImage, BLOG_IMAGE_MAX_WIDTH } from "@/lib/seo-activities/optimize-doc-image";

describe("optimizeDocImage", () => {
  it("resizes a wide PNG and re-encodes it as WebP", async () => {
    const png = await sharp({
      create: { width: 3000, height: 1000, channels: 3, background: { r: 200, g: 40, b: 40 } },
    })
      .png()
      .toBuffer();

    const out = await optimizeDocImage({ contentType: "image/png", extension: "png", bytes: png, alt: "" });

    expect(out.contentType).toBe("image/webp");
    expect(out.extension).toBe("webp");
    const meta = await sharp(out.bytes).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(BLOG_IMAGE_MAX_WIDTH);
    expect(out.bytes.length).toBeLessThan(png.length);
  });

  it("keeps a small image at its size and does not enlarge it", async () => {
    const png = await sharp({
      create: { width: 300, height: 200, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();

    const out = await optimizeDocImage({ contentType: "image/png", extension: "png", bytes: png, alt: "" });

    expect((await sharp(out.bytes).metadata()).width).toBe(300);
  });

  it("falls back to the original bytes when the image cannot be decoded", async () => {
    const junk = Buffer.from("not an image");

    const out = await optimizeDocImage({ contentType: "image/png", extension: "png", bytes: junk, alt: "" });

    expect(out).toEqual({ contentType: "image/png", extension: "png", bytes: junk });
  });
});
