import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../src/lib/markdown-toc.ts"),
  "utf8",
);

function headingText(raw) {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/<\/?[^>]+>/g, "")
    .trim();
}

function headingAnchor(text) {
  const ascii = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return ascii || "section";
}

function extractMarkdownToc(markdown) {
  const items = [];
  const used = new Map();
  let inFence = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const text = headingText(match[2]);
    if (!text) continue;

    let id = headingAnchor(text);
    const seen = used.get(id) ?? 0;
    used.set(id, seen + 1);
    if (seen > 0) id = `${id}-${seen}`;

    items.push({
      depth: match[1].length,
      text,
      id,
    });
  }

  return items;
}

test("toc helper source is present", () => {
  assert.match(source, /export function extractMarkdownToc/);
});

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
