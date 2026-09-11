import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { listWorks, readWork, saveWork } from "./work-store.mjs";
import { resolveCoverPalette } from "./studio/cover-palettes.mjs";

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
  solution: "现在保存成 Markdown。",
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

test("saveWork writes markdown with frontmatter and body", () => {
  const root = makeTree();
  saveWork(root, sample);
  const featured = saveWork(root, {
    ...sample,
    title: "精选",
    slug: "featured-work",
    featured: true,
    body: "## 问题\n\n只写一条。",
    stack: ["Rust"],
    repo: "",
    url: "",
  });

  assert.equal(featured.files[0], "src/content/works/featured-work.md");
  const file = fs.readFileSync(path.join(root, featured.files[0]), "utf8");
  assert.match(file, /featured: true/);
  assert.match(file, /## 问题/);
  assert.doesNotMatch(file, /^repo:/m);

  const listed = listWorks(root);
  assert.equal(listed[0].slug, "featured-work");
  assert.equal(listed[1].slug, "demo-work");
  assert.deepEqual(listed[1].stack, ["Next.js", "TypeScript"]);
  assert.equal(listed[1].repo, "https://github.com/hhuuaanngg/mysite");
  assert.match(listed[1].body, /以前要改 TypeScript/);
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
    body: "## 方案\n\n一条",
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
  assert.equal(fs.existsSync(path.join(root, "src/content/works/demo-work.md")), false);
});

test("saveWork accepts palette id without hex fields", () => {
  const root = makeTree();
  const saved = saveWork(root, {
    ...sample,
    cover: { mark: "dw", palette: "mint" },
  });
  assert.equal(saved.cover.from, "#d8f3ea");
  assert.equal(saved.cover.to, "#b7e4d4");
  assert.equal(saved.cover.accent, "#0f7b6c");
});

test("invalid cover color is rejected", () => {
  const root = makeTree();
  assert.throws(
    () =>
      saveWork(root, {
        ...sample,
        cover: { ...sample.cover, from: "red" },
      }),
    /封面配色/,
  );
});

test("saveWork writes an optional cover image", () => {
  const root = makeTree();
  const blobs = new Map([["cover1", { buffer: Buffer.from("cover-bytes"), ext: ".png" }]]);
  const saved = saveWork(
    root,
    {
      ...sample,
      cover: { ...sample.cover, blob: "cover1" },
    },
    blobs,
  );
  assert.ok(saved.files.includes("public/works/demo-work.png"));
  assert.equal(saved.cover.image, "/works/demo-work.png");
  assert.equal(
    fs.readFileSync(path.join(root, "public/works/demo-work.png"), "utf8"),
    "cover-bytes",
  );
});

test("existing works use a known cover palette", () => {
  const works = listWorks(path.resolve(import.meta.dirname, ".."));
  for (const work of works) {
    assert.ok(resolveCoverPalette(work.cover).id);
  }
});

test("saveWork uses the first body image as cover when none is uploaded", () => {
  const root = makeTree();
  const blobs = new Map([["img1", { buffer: Buffer.from("pic"), ext: ".png" }]]);
  const saved = saveWork(
    root,
    {
      ...sample,
      body: "## 方案\n\n看图。\n\n![](/__blob__/img1.png)",
    },
    blobs,
  );
  assert.ok(saved.files.includes("public/works/gallery/demo-work/01.png"));
  assert.equal(saved.cover.image, "/works/gallery/demo-work/01.png");
  assert.match(saved.body, /\/works\/gallery\/demo-work\/01.png/);
});

test("repo works files load in original display order", () => {
  const works = listWorks(path.resolve(import.meta.dirname, ".."));
  assert.equal(works[0].slug, "frpc-editor");
  assert.equal(works[0].featured, true);
  assert.match(works[0].body, /## 问题/);
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
      "frp3",
    ],
  );
});

function snapshot(root) {
  return Object.fromEntries(fs.readdirSync(root, { recursive: true }).filter((name) => fs.statSync(path.join(root, name)).isFile()).sort().map((name) => [name, fs.readFileSync(path.join(root, name)).toString('base64')]));
}

const photoBlobs = new Map([
  ['a', { buffer: Buffer.from('A'), ext: '.png' }],
  ['b', { buffer: Buffer.from('B'), ext: '.png' }],
  ['cover', { buffer: Buffer.from('COVER'), ext: '.png' }],
]);

test("reordering work images and resaving preserves their bytes and the original cover", (t) => {
  const root = makeTree();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  saveWork(root, { ...sample, body: '![A](/__blob__/a.png)\n\n![B](/__blob__/b.png)' }, photoBlobs);
  const reordered = saveWork(root, { ...sample, previousSlug: sample.slug, body: '![B](/works/gallery/demo-work/02.png)\n\n![A](/works/gallery/demo-work/01.png)' });
  assert.match(reordered.body, /!\[B\]\(\/works\/gallery\/demo-work\/01.png\)/);
  assert.match(reordered.body, /!\[A\]\(\/works\/gallery\/demo-work\/02.png\)/);
  saveWork(root, { ...sample, previousSlug: sample.slug, body: reordered.body });
  assert.equal(fs.readFileSync(path.join(root, 'public/works/gallery/demo-work/01.png'), 'utf8'), 'B');
  assert.equal(fs.readFileSync(path.join(root, 'public/works/gallery/demo-work/02.png'), 'utf8'), 'A');
  assert.equal(fs.readFileSync(path.join(root, 'public', reordered.cover.image), 'utf8'), 'A');
});

for (const [name, patch, expected] of [
  ['invalid URL', { repo: 'ftp://example.com', cover: { ...sample.cover, blob: 'cover' } }, /http/],
  ['invalid palette', { cover: { ...sample.cover, from: 'red', keep: false } }, /封面配色/],
  ['missing cover upload', { cover: { ...sample.cover, blob: 'missing' } }, /封面/],
  ['missing body', { body: '', problem: '', solution: '', highlights: '' }, /正文/],
]) {
  test(`rejected work save (${name}) leaves all existing files unchanged`, (t) => {
    const root = makeTree();
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    saveWork(root, { ...sample, cover: { ...sample.cover, blob: 'cover' }, body: '![A](/__blob__/a.png)\n\n![B](/__blob__/b.png)' }, photoBlobs);
    const before = snapshot(root);
    assert.throws(() => saveWork(root, { ...sample, previousSlug: sample.slug, body: '![B](/works/gallery/demo-work/02.png)', ...patch }, photoBlobs), expected);
    assert.deepEqual(snapshot(root), before);
  });
}
