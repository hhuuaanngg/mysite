import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { listWorks, readWork, saveWork } from "./work-store.mjs";

function makeTree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "work-store-"));
  fs.mkdirSync(path.join(root, "src/content/works"), { recursive: true });
  return root;
}

const sample = {
  title: "测试项目",
  slug: "demo-work",
  year: "2026",
  summary: "用来验证工坊写入。",
  problem: "以前要改 TypeScript。",
  solution: "现在保存成 JSON。",
  highlights: "一条要点\n另一条要点",
  stack: "Next.js, TypeScript",
  repo: "https://github.com/hhuuaanngg/mysite",
  cover: {
    mark: "dw",
    from: "#fde8d8",
    to: "#f7c9b4",
    accent: "#c4552a",
  },
};

test("saveWork writes JSON and featured items come first", () => {
  const root = makeTree();
  saveWork(root, sample);
  const featured = saveWork(root, {
    ...sample,
    title: "精选",
    slug: "featured-work",
    featured: true,
    highlights: ["只写一条"],
    stack: ["Rust"],
    repo: "",
    url: "",
  });

  assert.equal(featured.files[0], "src/content/works/featured-work.json");
  const file = fs.readFileSync(path.join(root, featured.files[0]), "utf8");
  assert.match(file, /"featured": true/);
  assert.doesNotMatch(file, /"repo":/);

  const listed = listWorks(root);
  assert.equal(listed[0].slug, "featured-work");
  assert.equal(listed[1].slug, "demo-work");
  assert.deepEqual(listed[1].stack, ["Next.js", "TypeScript"]);
  assert.equal(listed[1].repo, "https://github.com/hhuuaanngg/mysite");
});

test("checking featured makes that work the only featured item", () => {
  const root = makeTree();
  saveWork(root, { ...sample, featured: true });
  saveWork(root, {
    ...sample,
    title: "新精选",
    slug: "new-featured",
    featured: true,
    repo: "",
    highlights: ["一条"],
    stack: ["Go"],
  });

  const listed = listWorks(root);
  assert.equal(listed[0].slug, "new-featured");
  assert.equal(listed[0].featured, true);
  assert.equal(listed[1].slug, "demo-work");
  assert.equal(listed[1].featured, false);
});

test("saveWork refuses to overwrite another slug from 新建", () => {
  const root = makeTree();
  saveWork(root, sample);
  assert.throws(
    () =>
      saveWork(root, {
        ...sample,
        title: "另一个",
      }),
    /已有作品/,
  );
});

test("saveWork keeps order when renaming slug", () => {
  const root = makeTree();
  saveWork(root, sample);
  const saved = saveWork(root, {
    ...sample,
    slug: "demo-renamed",
    previousSlug: "demo-work",
  });
  assert.equal(saved.order, 0);
  assert.equal(readWork(root, "demo-work"), null);
  assert.equal(readWork(root, "demo-renamed")?.title, "测试项目");
});

test("invalid cover color is rejected", () => {
  const root = makeTree();
  assert.throws(
    () =>
      saveWork(root, {
        ...sample,
        cover: { ...sample.cover, from: "red" },
      }),
    /#RRGGBB/,
  );
});

test("repo works files load in original display order", () => {
  const works = listWorks(path.resolve(import.meta.dirname, ".."));
  assert.equal(works[0].slug, "frpc-editor");
  assert.equal(works[0].featured, true);
  assert.deepEqual(
    works.map((work) => work.slug),
    [
      "frpc-editor",
      "blog-hjy-me",
      "champiere",
      "damowang",
      "net-assistant",
      "iplay-theme",
      "custom-html-code",
      "theme-2c",
    ],
  );
});
