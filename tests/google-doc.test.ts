import { describe, expect, it } from "vitest";

import { googleDocHtmlToWordPress } from "@/lib/seo-activities/google-doc";
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
  it("keeps headings, paragraphs, blank lines, lists, bold, italic, underline and links", () => {
    const out = googleDocHtmlToWordPress(googleExport);

    expect(out).toContain("<h1>Main Heading</h1>");
    expect(out).toContain("<h2>Second level</h2>");
    expect(out).toContain("<h3>Third level</h3>");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<em>italic</em>");
    expect(out).toContain("<u>under</u>");
    expect(out).toContain("<p>&nbsp;</p>");
    expect(out).toContain("<ul><li>First item</li><li>Second item with <a href=\"https://example.com/page\">a link</a></li></ul>");
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
      `<body><p><span>5 &lt; 6 &amp; "quotes"</span></p><p><a href="javascript:alert(1)">bad</a></p></body>`,
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
