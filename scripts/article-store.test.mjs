import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readArticle, saveArticle } from "./article-store.mjs";

function makeTree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "article-store-"));
  fs.mkdirSync(path.join(root, "src/content/articles"), { recursive: true });
  fs.mkdirSync(path.join(root, "public/articles/gallery"), { recursive: true });
  return root;
}

test("saveArticle writes markdown, cover and numbered gallery", () => {
  const root = makeTree();
  const blobs = new Map([
    ["cover1", { buffer: Buffer.from("cover-bytes"), ext: ".jpg" }],
    ["g1", { buffer: Buffer.from("one"), ext: ".jpg" }],
    ["g2", { buffer: Buffer.from("two"), ext: ".png" }],
  ]);

  const saved = saveArticle(
    root,
    {
      title: "青岛",
      slug: "qingdao-2026",
      category: "摄影",
      summary: "海边走了一圈。",
      date: "2026-09-09",
      body: "风很大。\n\n![](/__blob__/g1.jpg)\n\n![](/__blob__/g2.png)",
      cover: { blob: "cover1" },
    },
    blobs,
  );

  assert.equal(saved.slug, "qingdao-2026");
  const markdown = fs.readFileSync(
    path.join(root, "src/content/articles/qingdao-2026.md"),
    "utf8",
  );
  assert.match(markdown, /title: "青岛"/);
  assert.match(markdown, /!\[\]\(\/articles\/gallery\/qingdao-2026\/01.jpg\)/);
  assert.match(markdown, /!\[\]\(\/articles\/gallery\/qingdao-2026\/02.png\)/);
  assert.equal(
    fs.readFileSync(path.join(root, "public/articles/qingdao-2026.jpg"), "utf8"),
    "cover-bytes",
  );
  assert.equal(
    fs.readFileSync(
      path.join(root, "public/articles/gallery/qingdao-2026/02.png"),
      "utf8",
    ),
    "two",
  );

  const loaded = readArticle(root, "qingdao-2026");
  assert.equal(loaded.title, "青岛");
  assert.match(loaded.body, /风很大/);
});

test("saveArticle refuses to overwrite another slug from 新建", () => {
  const root = makeTree();
  saveArticle(root, {
    title: "A",
    slug: "alpha",
    category: "生活",
    summary: "s",
    date: "2026-09-09",
    body: "hi",
    allowEmpty: true,
  });
  assert.throws(
    () =>
      saveArticle(root, {
        title: "B",
        slug: "alpha",
        category: "生活",
        summary: "s",
        date: "2026-09-09",
        body: "nope",
        allowEmpty: true,
      }),
    /已有文章/,
  );
});
