import { HttpError } from "@/lib/api/http-errors";

export const WP_REQUEST_TIMEOUT_MS = 15_000;

export type TWpConnection = {
  siteUrl: string;
  username: string;
  applicationPassword: string;
};

export type TWpDraftInput = {
  title: string;
  content: string;
  excerpt?: string;
};

export type TWpDraftResult = {
  id: number;
  status: string;
  link: string;
};

export function wpAuthHeader(username: string, applicationPassword: string): string {
  return `Basic ${Buffer.from(`${username}:${applicationPassword}`, "utf8").toString("base64")}`;
}

export function wpRestUrl(siteUrl: string, path: string): string {
  return `${siteUrl.replace(/\/+$/, "")}/wp-json/wp/v2${path}`;
}

/** The status is fixed to draft here. Callers cannot publish through this path. */
export function buildWpDraftBody(input: TWpDraftInput): Record<string, string> {
  return {
    title: input.title,
    content: input.content,
    ...(input.excerpt ? { excerpt: input.excerpt } : {}),
    status: "draft",
  };
}

/** Raw bytes for the media endpoint. The filename and content type go in the headers. */
type TWpRawBody = { bytes: Buffer; contentType: string; filename: string };

async function wpFetch(
  connection: TWpConnection,
  path: string,
  method: "GET" | "POST" | "DELETE",
  body?: Record<string, string>,
  raw?: TWpRawBody
): Promise<unknown> {
  if (!connection.siteUrl.startsWith("https://")) {
    throw new HttpError(422, "The WordPress site must use HTTPS.");
  }

  let response: Response;
  try {
    response = await fetch(wpRestUrl(connection.siteUrl, path), {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(WP_REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: wpAuthHeader(connection.username, connection.applicationPassword),
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(raw
          ? {
              "Content-Type": raw.contentType,
              "Content-Disposition": `attachment; filename="${raw.filename}"`,
            }
          : {}),
      },
      body: raw ? new Uint8Array(raw.bytes) : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new HttpError(502, "Could not reach the WordPress site.");
  }

  const json = (await response.json().catch(() => null)) as { message?: string } | null;
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? 422 : 502;
    throw new HttpError(status, json?.message ?? `WordPress returned ${response.status}.`);
  }
  return json;
}

export async function testWpConnection(connection: TWpConnection): Promise<{ id: number; name: string }> {
  const user = (await wpFetch(connection, "/users/me", "GET")) as { id: number; name: string };
  return { id: user.id, name: user.name };
}

export async function createWpDraft(connection: TWpConnection, input: TWpDraftInput): Promise<TWpDraftResult> {
  const post = (await wpFetch(connection, "/posts", "POST", buildWpDraftBody(input))) as {
    id: number;
    status: string;
    link: string;
  };

  if (post.status !== "draft") {
    // The post must not stay live. Move it to the trash before failing.
    await trashWpPost(connection, post.id).catch(() => undefined);
    throw new HttpError(502, `WordPress created the post as "${post.status}", not a draft.`);
  }
  return { id: post.id, status: post.status, link: post.link };
}

/** Moves a post to the WordPress trash (no force delete). Used to undo a draft Crawllex could not save. */
export async function trashWpPost(connection: TWpConnection, postId: number): Promise<void> {
  await wpFetch(connection, `/posts/${postId}`, "DELETE");
}

export type TWpMediaInput = {
  filename: string;
  contentType: string;
  bytes: Buffer;
};

export type TWpMediaResult = {
  id: number;
  url: string;
};

/** Keeps letters, digits, dot, dash and underscore. Strips anything that could break the header. */
export function safeWpFilename(filename: string): string {
  const cleaned = filename.replace(/[^A-Za-z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned.length > 0 && cleaned !== "." ? cleaned : "image";
}

/** Uploads one image to the WordPress media library. The upload is a real media item, not a post. */
export async function uploadWpMedia(connection: TWpConnection, input: TWpMediaInput): Promise<TWpMediaResult> {
  const json = (await wpFetch(connection, "/media", "POST", undefined, {
    bytes: input.bytes,
    contentType: input.contentType,
    filename: safeWpFilename(input.filename),
  })) as { id: number; source_url: string };
  return { id: json.id, url: json.source_url };
}

/** Permanently deletes a media item. Used only to undo uploads from a push that failed. */
export async function deleteWpMedia(connection: TWpConnection, mediaId: number): Promise<void> {
  await wpFetch(connection, `/media/${mediaId}?force=true`, "DELETE");
}
