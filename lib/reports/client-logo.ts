import { getR2Object } from "@/lib/storage/r2-client";

/** Largest client logo embedded in a report (bytes). */
const MAX_LOGO_BYTES = 1024 * 1024;

async function readLimited(stream: ReadableStream): Promise<Buffer | null> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_LOGO_BYTES) {
      console.warn(`[reports] Client logo exceeds ${MAX_LOGO_BYTES} bytes; not embedded.`);
      await reader.cancel();
      return null;
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

/**
 * Client logo as a data URI for the report. The stored logo is a private R2 object (`blob:{path}`).
 * Returns null when there is no logo or it is too large. The renderer makes no network calls, so the
 * logo must be embedded here.
 */
export async function loadClientLogoDataUri(logoImage: string | null): Promise<string | null> {
  if (!logoImage) return null;
  if (!logoImage.startsWith("blob:")) {
    console.warn(`[reports] Client logo has unexpected format (prefix "${logoImage.split(":")[0]}"); not embedded.`);
    return null;
  }

  const object = await getR2Object(logoImage.slice("blob:".length));
  if (!object) {
    console.warn("[reports] Client logo R2 object not found; not embedded.");
    return null;
  }
  if (!object.contentType.startsWith("image/")) {
    console.warn(`[reports] Client logo content type "${object.contentType}" is not an image; not embedded.`);
    return null;
  }

  const bytes = await readLimited(object.stream);
  if (!bytes) return null;
  return `data:${object.contentType};base64,${bytes.toString("base64")}`;
}

