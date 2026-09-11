import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  applyPlan,
  parseArgs,
  planArticle,
  slugify,
  todayISO,
} from "./new-article.mjs";

function makeTree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "new-article-"));
  fs.mkdirSync(path.join(root, "src/content/articles"), { recursive: true });
  fs.mkdirSync(path.join(root, "public/articles/gallery"), { recursive: true });
  return root;
}

function writeJpg(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from("fake-image"));
}

test("slugify keeps english and drops chinese", () => {
  assert.equal(slugify("Qingdao 2026"), "qingdao-2026");
  assert.equal(slugify("青岛"), "");
});

test("parseArgs collects repeated body flags", () => {
  const flags = parseArgs([
    "--title",
    "海边",
    "--body",
    "第一段",
    "--body",
    "第二段",
    "--dry-run",
  ]);
  assert.equal(flags.title, "海边");
  assert.deepEqual(flags.body, ["第一段", "第二段"]);
  assert.equal(flags["dry-run"], true);
});

test("planArticle copies a photo folder into markdown", () => {
  const root = makeTree();
  const photos = path.join(root, "photos");
  writeJpg(path.join(photos, "cover.jpg"));
  writeJpg(path.join(photos, "b.jpg"));
  writeJpg(path.join(photos, "a.jpg"));

  const plan = planArticle({
    root,
    title: "青岛",
    slug: "qingdao-2026",
    category: "摄影",
    summary: "海边走了一圈。",
    date: "2026-09-09",
    from: photos,
  });

  applyPlan(plan);

  const markdownPath = path.join(root, "src/content/articles/qingdao-2026.md");
  const markdown = fs.readFileSync(markdownPath, "utf8");
  assert.match(markdown, /title: "青岛"/);
  assert.match(markdown, /cover: "\/articles\/qingdao-2026.jpg"/);
  assert.match(markdown, /!\[\]\(\/articles\/gallery\/qingdao-2026\/01.jpg\)/);
  assert.match(markdown, /!\[\]\(\/articles\/gallery\/qingdao-2026\/02.jpg\)/);
  assert.equal(markdown.includes("cover.jpg"), false);
  assert.equal(
    fs.existsSync(path.join(root, "public/articles/qingdao-2026.jpg")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(root, "public/articles/gallery/qingdao-2026/01.jpg")),
    true,
  );
});

test("chinese title without slug fails clearly", () => {
  const root = makeTree();
  assert.throws(
    () =>
      planArticle({
        root,
        title: "青岛",
        category: "摄影",
        summary: "海边",
        allowEmpty: true,
      }),
    /slug/,
  );
});

test("refuses to overwrite an existing slug", () => {
  const root = makeTree();
  fs.writeFileSync(
    path.join(root, "src/content/articles/qingdao-2026.md"),
    "---\n---\n",
  );
  assert.throws(
    () =>
      planArticle({
        root,
        title: "青岛",
        slug: "qingdao-2026",
        category: "摄影",
        summary: "海边",
        allowEmpty: true,
      }),
    /已有文章/,
  );
});

test("todayISO is YYYY-MM-DD", () => {
  assert.match(todayISO(new Date("2026-09-09T12:00:00")), /^\d{4}-\d{2}-\d{2}$/);
});
