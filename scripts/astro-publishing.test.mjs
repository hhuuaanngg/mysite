import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
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
  initializePublishing(root);
  save("existing", "UNFINISHED_EDIT_456");
  save("selected", "READY_FOR_EXPORT_789");
  save("private-draft", "UNSELECTED_SECRET_987");
  const source = path.join(root, "release/source");
  snapshot(root, source, pendingChanges(root).filter((change) => change.key.includes("selected") && !change.key.includes("private")));
  const output = path.join(root, "release/site");
  await buildRelease(path.resolve(import.meta.dirname, ".."), source, output, { siteUrl: "https://portfolio.example.test" });
  const read = (name) => fs.readFileSync(path.join(output, name), "utf8");
  assert.match(read("articles/existing/index.html"), /PUBLISHED_ORIGINAL_123/);
  assert.match(read("articles/selected/index.html"), /READY_FOR_EXPORT_789/);
  assert.equal(fs.existsSync(path.join(output, "articles/private-draft")), false);
  assert.equal(fs.existsSync(path.join(output, "articles/private-draft.png")), false);
  assert.match(read("sitemap.xml"), /https:\/\/portfolio.example.test\/articles\/selected\//);
  assert.match(read("index.html"), /https:\/\/portfolio.example.test\//);
  for (const name of fs.readdirSync(output, { recursive: true })) {
    const file = path.join(output, name);
    if (fs.statSync(file).isFile() && /\.(html|js|json|xml|txt)$/.test(name)) {
      assert.doesNotMatch(fs.readFileSync(file, "utf8"), /UNFINISHED_EDIT_456|UNSELECTED_SECRET_987|private-draft/);
    }
  }
  assert.equal(fs.existsSync(path.join(root, "release/build")), false);
  assert.match(fs.readFileSync(path.join(root, "src/content/articles/existing.md"), "utf8"), /UNFINISHED_EDIT_456/);
});
