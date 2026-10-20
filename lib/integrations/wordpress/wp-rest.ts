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

async function wpFetch(
  connection: TWpConnection,
  path: string,
  method: "GET" | "POST",
  body?: Record<string, string>,
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
      },
      body: body ? JSON.stringify(body) : undefined,
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

export async function testWpConnection(
  connection: TWpConnection,
): Promise<{ id: number; name: string }> {
  const user = (await wpFetch(connection, "/users/me", "GET")) as { id: number; name: string };
  return { id: user.id, name: user.name };
}

export async function createWpDraft(
  connection: TWpConnection,
  input: TWpDraftInput,
): Promise<TWpDraftResult> {
  const post = (await wpFetch(
    connection,
    "/posts",
    "POST",
    buildWpDraftBody(input),
  )) as { id: number; status: string; link: string };

  if (post.status !== "draft") {
    throw new HttpError(502, `WordPress created the post as "${post.status}", not a draft.`);
  }
  return { id: post.id, status: post.status, link: post.link };
}
