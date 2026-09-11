import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { saveWork } from "./work-store.mjs";
import { saveArticle } from "./article-store.mjs";
import { initializePublishing, pendingChanges, snapshot } from "./publish-store.mjs";
import { buildRelease } from "./publisher.mjs";

test("real Astro build renders only the selected snapshot and keeps unfinished content out of all assets", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mysite-astro-publish-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aIwoAAAAASUVORK5CYII=", "base64");
  const save = (slug, body) => saveArticle(root, {
    title: slug, slug, previousSlug: fs.existsSync(path.join(root, `src/content/articles/${slug}.md`)) ? slug : "",
    category: "生活", date: "2026-09-11", summary: body, body, cover: { blob: "cover" },
  }, new Map([["cover", { buffer: png, ext: ".png" }]]));
  save("existing", "PUBLISHED_ORIGINAL_123");
  const saveProject = (slug, body) => saveWork(root, {
    title: slug, slug, previousSlug: fs.existsSync(path.join(root, `src/content/works/${slug}.md`)) ? slug : "",
    year: "2026", summary: body, body, stack: ["Astro"], cover: { mark: "A", palette: "mint" },
  });
  saveProject("existing-work", "PUBLISHED_WORK_123");
  initializePublishing(root);
  save("existing", "UNFINISHED_EDIT_456");
  save("selected", "READY_FOR_EXPORT_789");
  save("private-draft", "UNSELECTED_SECRET_987");
  saveProject("existing-work", "UNFINISHED_WORK_456");
  saveProject("selected-work", "## 原生正文\n\nREADY_WORK_789\n\n```ts\nconst answer = 42;\n```");
  saveProject("private-work", "UNSELECTED_WORK_987");
  const source = path.join(root, "release/source");
  snapshot(root, source, pendingChanges(root).filter((change) => change.key.includes("selected") && !change.key.includes("private")));
  const output = path.join(root, "release/site");
  await buildRelease(path.resolve(import.meta.dirname, ".."), source, output, { siteUrl: "https://portfolio.example.test" });
  const read = (name) => fs.readFileSync(path.join(output, name), "utf8");
  assert.match(read("articles/existing/index.html"), /PUBLISHED_ORIGINAL_123/);
  assert.match(read("articles/selected/index.html"), /READY_FOR_EXPORT_789/);
  assert.match(read("work/existing-work/index.html"), /PUBLISHED_WORK_123/);
  const workHtml = read("work/selected-work/index.html");
  assert.match(workHtml, /READY_WORK_789/);
  assert.match(workHtml, /astro-code/);
  assert.match(workHtml, /id="原生正文"/);
  assert.match(workHtml, /href="#原生正文"/);
  assert.equal(fs.existsSync(path.join(output, "work/private-work")), false);
  assert.equal(fs.existsSync(path.join(output, "articles/private-draft")), false);
  assert.equal(fs.existsSync(path.join(output, "articles/private-draft.png")), false);
  assert.match(read("sitemap.xml"), /https:\/\/portfolio.example.test\/articles\/selected\//);
  assert.match(read("index.html"), /https:\/\/portfolio.example.test\//);
  for (const name of fs.readdirSync(output, { recursive: true })) {
    const file = path.join(output, name);
    if (fs.statSync(file).isFile() && /\.(html|js|json|xml|txt)$/.test(name)) {
      assert.doesNotMatch(fs.readFileSync(file, "utf8"), /UNFINISHED_EDIT_456|UNSELECTED_SECRET_987|private-draft|UNFINISHED_WORK_456|UNSELECTED_WORK_987|private-work/);
    }
  }
  assert.equal(fs.existsSync(path.join(root, "release/build")), false);
  // A broken selected file must fail collection validation before exporting a site.
  const selectedFile = path.join(source, "src/content/articles/selected.md");
  fs.writeFileSync(selectedFile, fs.readFileSync(selectedFile, "utf8").replace('date: "2026-09-11"', 'date: "2026-02-30"'));
  await assert.rejects(buildRelease(path.resolve(import.meta.dirname, ".."), source, path.join(root, "invalid/site")), /date|有效日期|schema/i);
  assert.match(fs.readFileSync(path.join(root, "src/content/articles/existing.md"), "utf8"), /UNFINISHED_EDIT_456/);
});
