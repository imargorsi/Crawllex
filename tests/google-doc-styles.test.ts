import { describe, expect, it } from "vitest";

import { convertGoogleDoc, googleDocHtmlToWordPress } from "@/lib/seo-activities/google-doc";

describe("Google Docs styles on blog output", () => {
  it("keeps justified and centered paragraphs from the Doc's class and inline styles", () => {
    const html = `<html><head><style>.c1{text-align:justify}.c2{text-align:center}</style></head><body><p class="c1"><span>Body text</span></p><p style="text-align:center"><span>Centered</span></p><h2 class="c2"><span>Title</span></h2></body></html>`;

    expect(googleDocHtmlToWordPress(html)).toBe(
      '<p style="text-align:justify">Body text</p><p style="text-align:center">Centered</p><h2 style="text-align:center">Title</h2>',
    );
  });

  it("keeps cell background, borders and alignment from the Doc's table styles", () => {
    const html = `<html><head><style>.c7{background-color:#d9d9d9}</style></head><body><table><tbody><tr><td class="c7" style="border-left:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top"><p><span>Header</span></p></td><td style="background-color:#ffffff"><p><span>Plain</span></p></td></tr></tbody></table></body></html>`;

    expect(googleDocHtmlToWordPress(html)).toBe(
      '<figure class="wp-block-table" style="overflow-x:auto"><table><tbody><tr><td style="vertical-align:top;background-color:#d9d9d9;border-top:solid #000000 1pt;border-left:solid #000000 1pt"><p>Header</p></td><td><p>Plain</p></td></tr></tbody></table></figure>',
    );
  });

  it("keeps text color on spans but drops the default black", () => {
    const html = `<html><head><style>.c3{color:#ff0000}.c4{color:#000000}</style></head><body><p><span class="c3">Red</span><span class="c4"> black</span></p></body></html>`;

    expect(googleDocHtmlToWordPress(html)).toBe('<p><span style="color:#ff0000">Red</span> black</p>');
  });

  it("drops style values outside the allow-list", () => {
    const html = `<html><body><p style="text-align:javascript:x;font-size:99px;color:expression(1)"><span>Safe</span></p></body></html>`;

    expect(googleDocHtmlToWordPress(html)).toBe("<p>Safe</p>");
  });

  it("still turns a gray one-cell code table into a code block", () => {
    const html = `<html><head><style>.m{font-family:Consolas}</style></head><body><table><tbody><tr><td style="background-color:#f3f3f3"><p style="text-align:left"><span class="m">x = 1;</span></p></td></tr></tbody></table></body></html>`;

    expect(googleDocHtmlToWordPress(html)).toBe('<pre class="wp-block-code"><code>x = 1;</code></pre>');
  });

  it("uses Docs API alt text in document order when the count matches", () => {
    const png = Buffer.from("a").toString("base64");
    const html = `<html><body><p><img src="data:image/png;base64,${png}"></p><p><img src="data:image/png;base64,${png}" alt="export alt"></p></body></html>`;

    const out = convertGoogleDoc(html, ["First chart", ""]);

    expect(out.images.map((i) => i.alt)).toEqual(["First chart", "export alt"]);
    expect(out.content).toContain('alt="First chart"');
  });

  it("ignores Docs API alt text when the image count does not match", () => {
    const png = Buffer.from("a").toString("base64");
    const html = `<html><body><p><img src="data:image/png;base64,${png}"></p></body></html>`;

    expect(convertGoogleDoc(html, ["one", "two"]).images[0]!.alt).toBe("");
  });
});

describe("image placeholder removal with styled paragraphs", () => {
  it("removes an image-only paragraph that carries alignment", async () => {
    const { stripImagePlaceholders } = await import("@/lib/seo-activities/publish-blog-draft");
    const content = '<p>Before</p><p style="text-align:center"><img src="crawllex-image:0" alt="Chart"></p><p>After</p>';

    expect(stripImagePlaceholders(content)).toBe("<p>Before</p><p>After</p>");
  });
});
