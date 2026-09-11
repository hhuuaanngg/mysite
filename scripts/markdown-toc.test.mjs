import assert from "node:assert/strict";
import test from "node:test";
import config from "../astro.config.mjs";

// Exercise the exact processor configured for Astro, including its heading metadata.
const renderer = await config.markdown.processor.createRenderer(config.markdown);

test("native Markdown headings retain existing anchors and ignore fenced code", async () => {
  const markdown = "Intro\n=====\n\n## Actual\n\n~~~js\n## Code example\n~~~\n\n> ### Nested\n\n## Same\n\n## Same\n\n## Same-1\n\n## **Bold** &amp; [Link](https://example.com)\n\n##\n\n## 中文目录";
  const { code, metadata } = await renderer.render(markdown);
  assert.deepEqual(metadata.headings.map(({ slug }) => slug), ["intro", "actual", "nested", "same", "same-1", "same-1-1", "bold-link", "section", "中文目录"]);
  const renderedIds = [...code.matchAll(/<h[123][^>]* id="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(renderedIds, metadata.headings.map(({ slug }) => slug));
  assert.equal(metadata.headings.at(-3).text, "Bold & Link");
});

test("native Markdown preserves tables, captions, links and adds build-time code highlighting", async () => {
  const { code } = await renderer.render('![说明](/articles/photo.jpg)\n\n![DCIM_01.jpg](/articles/photo.jpg)\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n- [x] done\n\n[外部](https://example.com)\n\n[内部](/work/frpc-editor/)\n\n```ts\nconst answer = 42;\n```\n\n`inline`');
  assert.match(code, /<figure[^>]*><div[^>]*><img[^>]*loading="lazy"/);
  assert.match(code, /<figcaption[^>]*>说明<\/figcaption>/);
  assert.equal((code.match(/<figcaption/g) ?? []).length, 1);
  assert.doesNotMatch(code, /<p[^>]*>\s*<figure/);
  assert.match(code, /<div class="overflow-x-auto">\s*<table/);
  assert.match(code, /type="checkbox"[^>]*checked[^>]*disabled/);
  assert.match(code, /href="https:\/\/example.com"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(code, /astro-code/);
  assert.match(code, /<span style="color:/);
  assert.match(code, /<code class="rounded-md[^>]*>inline<\/code>/);
});

test("native renderer keeps raw HTML as text and rejects executable Markdown URLs", async () => {
  const { code } = await renderer.render('<script>alert(1)</script>\n\n[bad](javascript:alert%281%29)\n\n![bad](javascript:alert%281%29)');
  assert.doesNotMatch(code, /<script|(?:href|src)="javascript:/);
  assert.match(code, /&#x3C;script>|&lt;script&gt;/);
});
