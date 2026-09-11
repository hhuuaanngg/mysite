import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Exercise the production module without requiring Node's TypeScript loader.
const source = readFileSync(new URL("../src/lib/markdown-toc.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText.replace(/from "([^"]+)"/g, (_, name) => `from "${import.meta.resolve(name)}"`);
const { extractMarkdownToc, remarkHeadingIds } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

test("extracts three heading levels and skips fenced code", () => {
  const toc = extractMarkdownToc(`# 大标题

intro

## 问题

text

\`\`\`
## 不是目录
\`\`\`

### 细节

## 方案
`);
  assert.deepEqual(
    toc.map((item) => [item.depth, item.id, item.text]),
    [
      [1, "大标题", "大标题"],
      [2, "问题", "问题"],
      [3, "细节", "细节"],
      [2, "方案", "方案"],
    ],
  );
});

test("duplicate headings get numbered ids", () => {
  const toc = extractMarkdownToc("## Same\n\n## Same\n");
  assert.equal(toc[0].id, "same");
  assert.equal(toc[1].id, "same-1");
});


test("TOC links match rendered headings for CommonMark syntax", () => {
  const markdown = "Intro\n=====\n\n## Actual\n\n~~~js\n## Code example\n~~~\n\n> ### Nested\n\n## Same\n\n## Same\n\n## Same-1\n\n## **Bold** &amp; [Link](https://example.com)\n\n##";
  const toc = extractMarkdownToc(markdown);
  assert.deepEqual(toc.map(({ text }) => text), ["Intro", "Actual", "Nested", "Same", "Same", "Same-1", "Bold & Link", "无标题"]);
  assert.equal(new Set(toc.map(({ id }) => id)).size, toc.length);
  const html = renderToStaticMarkup(React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkGfm, remarkHeadingIds],
  }, markdown));
  const renderedIds = [...html.matchAll(/<h[123] id="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(renderedIds, toc.map(({ id }) => id));
});
