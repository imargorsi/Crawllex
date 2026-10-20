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
});
