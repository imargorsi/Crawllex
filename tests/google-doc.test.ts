import { describe, expect, it } from "vitest";

import { convertGoogleDoc, googleDocHtmlToWordPress } from "@/lib/seo-activities/google-doc";
import { parseGoogleDocId } from "@/lib/seo-activities/google-doc-url";

const googleExport = `<html><head><meta charset="utf-8"><style>.c0{font-weight:700}</style><title>My Doc</title></head>
<body class="c4">
  <h1 class="c2"><span class="c0">Main Heading</span></h1>
  <p class="c1"><span class="c3">Plain paragraph with </span><span class="c0">bold</span><span class="c3"> and </span><span style="font-style:italic">italic</span><span style="text-decoration:underline">under</span>.</p>
  <p class="c1"><span></span></p>
  <h2 class="c2"><span>Second level</span></h2>
  <h3 class="c2"><span>Third level</span></h3>
  <ul class="c5"><li class="c1"><span>First item</span></li><li><span>Second item with </span><a href="https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fpage&amp;sa=D">a link</a></li></ul>
  <ol><li><span>Numbered</span></li></ol>
  <p><img src="https://lh7-rt.googleusercontent.com/x.png"></p>
  <p class="c1"><span>Last paragraph</span></p>
  <p><span></span></p>
</body></html>`;

describe("Google Docs to WordPress HTML", () => {
  it("returns embedded images as uploads and points the content at them with tokens", () => {
    const png = Buffer.from("fake-png-bytes").toString("base64");
    const html = `<html><body><p><span>Text before</span></p><p><img alt="Chart" src="data:image/png;base64,${png}"></p><p><span>Text after</span></p></body></html>`;

    const out = convertGoogleDoc(html);

    expect(out.images).toHaveLength(1);
    expect(out.images[0]).toMatchObject({ contentType: "image/png", extension: "png", alt: "Chart" });
    expect(out.images[0]!.bytes.toString()).toBe("fake-png-bytes");
    expect(out.content).toBe(
      '<p>Text before</p><p><img src="crawllex-image:0" alt="Chart"></p><p>Text after</p>',
    );
  });

  it("drops remote images, which are not in the export", () => {
    const html = `<html><body><p><span>Text</span></p><p><img src="https://lh7-rt.googleusercontent.com/x.png"></p></body></html>`;

    const out = convertGoogleDoc(html);

    expect(out.images).toHaveLength(0);
    expect(out.content).toBe("<p>Text</p>");
  });

  it("keeps real Doc tables as WordPress tables", () => {
    const html = `<html><body><table><tbody><tr><td><p><span>Option</span></p></td><td><p><span>Steel</span></p></td></tr><tr><td><p><span>Cost</span></p></td><td><p><strong>High</strong></p></td></tr></tbody></table></body></html>`;

    const out = googleDocHtmlToWordPress(html);

    expect(out).toBe(
      '<figure class="wp-block-table" style="overflow-x:auto"><table><tbody><tr><td><p>Option</p></td><td><p>Steel</p></td></tr><tr><td><p>Cost</p></td><td><p><strong>High</strong></p></td></tr></tbody></table></figure>',
    );
  });

  it("turns a monospace paragraph run into one code block and keeps inline code inline", () => {
    const html = `<html><head><style>.m{font-family:Courier New}</style></head><body><p><span class="m">const a = 1;</span></p><p><span class="m">console.log(a);</span></p><p><span>Run </span><span class="m">npm test</span><span> to check.</span></p></body></html>`;

    const out = googleDocHtmlToWordPress(html);

    expect(out).toBe(
      '<pre class="wp-block-code"><code>const a = 1;\nconsole.log(a);</code></pre><p>Run <code>npm test</code> to check.</p>',
    );
  });

  it("turns a one-cell code table (Doc code block) into a code block", () => {
    const html = `<html><head><style>.m{font-family:Consolas}</style></head><body><table><tbody><tr><td><p><span class="m">if (x) {</span></p><p><span class="m">&nbsp;&nbsp;y();</span></p></td></tr></tbody></table></body></html>`;

    const out = googleDocHtmlToWordPress(html);

    expect(out).toBe('<pre class="wp-block-code"><code>if (x) {\n  y();</code></pre>');
  });

  it("refuses more images than the limit", () => {
    const png = Buffer.from("x").toString("base64");
    const img = `<img src="data:image/png;base64,${png}">`;
    const html = `<html><body>${img.repeat(31)}</body></html>`;

    expect(() => convertGoogleDoc(html)).toThrow(/more than 30 images/);
  });

  it("keeps headings, paragraphs, blank lines, lists, bold, italic, underline and links", () => {
    const out = googleDocHtmlToWordPress(googleExport);

    expect(out).toContain("<h1>Main Heading</h1>");
    expect(out).toContain("<h2>Second level</h2>");
    expect(out).toContain("<h3>Third level</h3>");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<em>italic</em>");
    expect(out).toContain("<u>under</u>");
    expect(out).toContain("<p>&nbsp;</p>");
    expect(out).toContain(
      '<ul><li>First item</li><li>Second item with <a href="https://example.com/page">a link</a></li></ul>'
    );
    expect(out).toContain("<ol><li>Numbered</li></ol>");
    expect(out).toContain("<p>Last paragraph</p>");
  });

  it("drops images, styles, classes, head content and trailing blank paragraphs", () => {
    const out = googleDocHtmlToWordPress(googleExport);

    expect(out).not.toMatch(/<img|<style|<title|class=|style=|My Doc|googleusercontent/);
    expect(out.endsWith("</p>")).toBe(true);
    expect(out.endsWith("<p>&nbsp;</p>")).toBe(false);
    expect(out).not.toContain("<script");
  });

  it("escapes text and refuses non-http links", () => {
    const out = googleDocHtmlToWordPress(
      `<body><p><span>5 &lt; 6 &amp; "quotes"</span></p><p><a href="javascript:alert(1)">bad</a></p></body>`
    );
    expect(out).toContain("5 &lt; 6 &amp; &quot;quotes&quot;");
    expect(out).not.toContain("javascript:");
    expect(out).toContain("bad");
  });
});

describe("parseGoogleDocId", () => {
  it("accepts public doc links and rejects other hosts", () => {
    expect(parseGoogleDocId("https://docs.google.com/document/d/1AbC_-xyz/edit?usp=sharing")).toBe("1AbC_-xyz");
    expect(parseGoogleDocId("https://docs.google.com/spreadsheets/d/1AbC/edit")).toBeNull();
    expect(parseGoogleDocId("https://evil.example.com/document/d/1AbC/edit")).toBeNull();
    expect(parseGoogleDocId("http://docs.google.com/document/d/1AbC/edit")).toBeNull();
    expect(parseGoogleDocId("not a url")).toBeNull();
  });
});
