import { afterEach, describe, expect, it, vi } from "vitest";

const connection = {
  siteUrl: "https://scentnsplendor.scentnsplendor.com",
  username: "admin",
  applicationPassword: "abcd EFGH ijkl MNOP qrst UVWX",
};

vi.mock("@/lib/integrations/wordpress/wp-source", () => ({
  wpConnectionForProject: vi.fn(async () => connection),
}));

import { publishBlogDraft } from "@/lib/seo-activities/publish-blog-draft";

const docHtml = `<html><head><style>.c0{font-weight:700}</style></head><body>
<h2><span>Intro</span></h2><p><span class="c0">Bold line</span></p><p><span></span></p>
</body></html>`;

function docResponse(url: string) {
  const response = new Response(docHtml, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  Object.defineProperty(response, "url", { value: url });
  return response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("publishBlogDraft", () => {
  it("downloads the public doc, converts it, and creates a WordPress draft", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.startsWith("https://docs.google.com/")) {
        return docResponse("https://docs.google.com/document/d/1AbC/export?format=html");
      }
      return new Response(JSON.stringify({ id: 99, status: "draft", link: "https://site/?p=99" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishBlogDraft("project-1", {
      title: "My post",
      docUrl: "https://docs.google.com/document/d/1AbC/edit",
    });

    expect(result).toMatchObject({ postId: 99, link: "https://site/?p=99" });
    const postCall = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    const body = JSON.parse(postCall[1].body as string);
    expect(body.title).toBe("My post");
    expect(body.status).toBe("draft");
    expect(body.content).toBe("<h2>Intro</h2><p><strong>Bold line</strong></p>");
  });

  it("does not call WordPress when the doc is private", async () => {
    const fetchMock = vi.fn(async () => {
      const response = new Response("<html>login</html>", { status: 200, headers: { "Content-Type": "text/html" } });
      Object.defineProperty(response, "url", { value: "https://accounts.google.com/ServiceLogin" });
      return response;
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      publishBlogDraft("project-1", { title: "My post", docUrl: "https://docs.google.com/document/d/1AbC/edit" })
    ).rejects.toMatchObject({ statusCode: 422 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uploads embedded images to the media library and points the post at them", async () => {
    const png = Buffer.from("png-bytes").toString("base64");
    const imageDoc = `<html><body><p><img alt="Table picture" src="data:image/png;base64,${png}"></p><p><span>After</span></p></body></html>`;
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith("https://docs.google.com/")) {
        const response = new Response(imageDoc, { status: 200, headers: { "Content-Type": "text/html" } });
        Object.defineProperty(response, "url", { value: url });
        return response;
      }
      if (url.endsWith("/wp-json/wp/v2/media")) {
        return new Response(JSON.stringify({ id: 501, source_url: "https://scentnsplendor.scentnsplendor.com/wp-content/uploads/doc-image-1.png" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
      expect(init?.method).toBe("POST");
      return new Response(JSON.stringify({ id: 99, status: "draft", link: "https://site/?p=99" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishBlogDraft(
      "project-1",
      { title: "My post", docUrl: "https://docs.google.com/document/d/1AbC/edit" },
      { uploadImages: true }
    );

    expect(result.mediaIds).toEqual([501]);
    const mediaCall = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(mediaCall[1].headers).toMatchObject({ "Content-Type": "image/png" });
    const postCall = fetchMock.mock.calls[2] as unknown as [string, RequestInit];
    const body = JSON.parse(postCall[1].body as string);
    expect(body.content).toContain('<img src="https://scentnsplendor.scentnsplendor.com/wp-content/uploads/doc-image-1.png" alt="Table picture">');
    expect(body.content).not.toContain("crawllex-image:");
  });

  it("deletes uploaded media when the draft cannot be created", async () => {
    const png = Buffer.from("png-bytes").toString("base64");
    const imageDoc = `<html><body><p><img src="data:image/png;base64,${png}"></p></body></html>`;
    const deleted: string[] = [];
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith("https://docs.google.com/")) {
        const response = new Response(imageDoc, { status: 200, headers: { "Content-Type": "text/html" } });
        Object.defineProperty(response, "url", { value: url });
        return response;
      }
      if (url.endsWith("/wp-json/wp/v2/media") && init?.method === "POST") {
        return new Response(JSON.stringify({ id: 777, source_url: "https://site/x.png" }), { status: 201, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/wp-json/wp/v2/media/777") && init?.method === "DELETE") {
        deleted.push(url);
        return new Response(JSON.stringify({ deleted: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ message: "Sorry, you cannot create posts." }), { status: 403, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      publishBlogDraft(
        "project-1",
        { title: "My post", docUrl: "https://docs.google.com/document/d/1AbC/edit" },
        { uploadImages: true }
      )
    ).rejects.toMatchObject({ statusCode: 422 });
    expect(deleted).toEqual(["https://scentnsplendor.scentnsplendor.com/wp-json/wp/v2/media/777?force=true"]);
  });
});

describe("publishBlogDraft without image uploads", () => {
  it("publishes the text and removes image placeholders when uploads are off", async () => {
    const png = Buffer.from("png-bytes").toString("base64");
    const imageDoc = `<html><body><p><span>Before</span></p><p><img alt="Chart" src="data:image/png;base64,${png}"></p><p><span>After</span></p></body></html>`;
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.startsWith("https://docs.google.com/")) {
        const response = new Response(imageDoc, { status: 200, headers: { "Content-Type": "text/html" } });
        Object.defineProperty(response, "url", { value: url });
        return response;
      }
      return new Response(JSON.stringify({ id: 5, status: "draft", link: "https://site/?p=5" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await publishBlogDraft("project-1", { title: "T", docUrl: "https://docs.google.com/document/d/1AbC/edit" });

    expect(fetchMock.mock.calls.some((c) => String(c[0]).endsWith("/wp/v2/media"))).toBe(false);
    const body = JSON.parse((fetchMock.mock.calls[1] as unknown as [string, RequestInit])[1].body as string);
    expect(body.content).toBe("<p>Before</p><p>After</p>");
  });
});
