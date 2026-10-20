import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/lib/api/http-errors";
import {
  buildWpDraftBody,
  createWpDraft,
  testWpConnection,
  wpAuthHeader,
  wpRestUrl,
  type TWpConnection,
} from "@/lib/integrations/wordpress/wp-rest";

const connection: TWpConnection = {
  siteUrl: "https://scentnsplendor.scentnsplendor.com/",
  username: "admin",
  applicationPassword: "abcd EFGH ijkl MNOP qrst UVWX",
};

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WordPress REST client", () => {
  it("builds Basic auth and the REST url without a double slash", () => {
    expect(wpAuthHeader("admin", "pw")).toBe(`Basic ${Buffer.from("admin:pw").toString("base64")}`);
    expect(wpRestUrl("https://example.com/", "/posts")).toBe("https://example.com/wp-json/wp/v2/posts");
  });

  it("always sends status draft, ignoring anything else", () => {
    const body = buildWpDraftBody({ title: "T", content: "C", excerpt: "E" });
    expect(body).toEqual({ title: "T", content: "C", excerpt: "E", status: "draft" });
    expect(buildWpDraftBody({ title: "T", content: "C" })).not.toHaveProperty("excerpt");
  });

  it("creates a draft with auth and returns id, status and link", async () => {
    const fetchMock = stubFetch(201, {
      id: 42,
      status: "draft",
      link: "https://scentnsplendor.scentnsplendor.com/?p=42",
    });
    const result = await createWpDraft(connection, { title: "T", content: "<p>C</p>" });

    expect(result).toEqual({ id: 42, status: "draft", link: "https://scentnsplendor.scentnsplendor.com/?p=42" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://scentnsplendor.scentnsplendor.com/wp-json/wp/v2/posts");
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("error");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      wpAuthHeader("admin", "abcd EFGH ijkl MNOP qrst UVWX"),
    );
    expect(JSON.parse(init.body as string)).toMatchObject({ status: "draft" });
  });

  it("refuses to publish: a post not created as draft throws", async () => {
    stubFetch(201, { id: 7, status: "publish", link: "https://x" });
    await expect(createWpDraft(connection, { title: "T", content: "C" })).rejects.toBeInstanceOf(HttpError);
  });

  it("maps WordPress 401 to 422 with its message", async () => {
    stubFetch(401, { code: "rest_forbidden", message: "Invalid username or password." });
    await expect(testWpConnection(connection)).rejects.toMatchObject({
      statusCode: 422,
      message: "Invalid username or password.",
    });
  });

  it("refuses non-HTTPS sites before any request", async () => {
    const fetchMock = stubFetch(200, {});
    await expect(
      testWpConnection({ ...connection, siteUrl: "http://insecure.example.com" }),
    ).rejects.toBeInstanceOf(HttpError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
