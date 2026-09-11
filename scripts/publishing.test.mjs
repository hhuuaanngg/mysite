import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import http from "node:http";
import { initializePublishing, snapshot, pendingChanges, baselineRoot, readJson } from "./publish-store.mjs";
import { createPublisher } from "./publisher.mjs";
import { saveArticle } from "./article-store.mjs";
import { validateSettings } from "./ssh-deploy.mjs";
import { createStudioServer } from "./studio-server.mjs";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mysite-publishing-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "public"), { recursive: true });
  save(root, "old-post", "online original", "original image");
  initializePublishing(root);
  return root;
}
function save(root, slug, body, image) {
  return saveArticle(root, { title: slug, slug, previousSlug: fs.existsSync(path.join(root, `src/content/articles/${slug}.md`)) ? slug : "", category: "生活", date: "2026-09-10", summary: body, body, cover: { blob: "img" } }, new Map([["img", { buffer: Buffer.from(image), ext: ".png" }]]));
}
function content(root, slug) { return fs.readFileSync(path.join(root, `src/content/articles/${slug}.md`), "utf8"); }
async function fakeBuild(root, source, output) {
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "index.html"), fs.readFileSync(path.join(source, "src/content/articles/old-post.md")));
}
const settings = { host: "127.0.0.1", user: "deploy", port: 22, remotePath: "/srv/mysite", siteUrl: "https://example.com" };

test("selecting one draft preserves published text and image of another edited post", (t) => {
  const root = fixture(t);
  save(root, "old-post", "unfinished private edit", "private old image");
  save(root, "ready-post", "ready", "ready image");
  save(root, "secret-post", "secret", "secret image");
  const selection = pendingChanges(root).filter((c) => c.key.includes("ready-post"));
  const target = path.join(root, "candidate");
  snapshot(root, target, selection);
  assert.match(content(target, "old-post"), /online original/);
  assert.doesNotMatch(content(target, "old-post"), /unfinished/);
  assert.equal(fs.readFileSync(path.join(target, "public/articles/old-post.png"), "utf8"), "original image");
  assert.match(content(target, "ready-post"), /ready/);
  assert.equal(fs.existsSync(path.join(target, "src/content/articles/secret-post.md")), false);
  assert.equal(fs.existsSync(path.join(target, "public/articles/secret-post.png")), false);
});
test("stale selection is rejected, missing media fails, selected deletion removes original media", (t) => {
  const root = fixture(t);
  save(root, "new-post", "first", "first");
  const selection = pendingChanges(root);
  save(root, "new-post", "second", "second");
  assert.throws(() => snapshot(root, path.join(root, "stale"), selection), /草稿发生变化/);
  fs.unlinkSync(path.join(root, "public/articles/new-post.png"));
  assert.throws(() => snapshot(root, path.join(root, "missing"), pendingChanges(root)), /缺少素材/);
  fs.unlinkSync(path.join(root, "src/content/articles/old-post.md"));
  const deletion = pendingChanges(root).filter((c) => c.change === "删除");
  snapshot(root, path.join(root, "deleted"), deletion);
  assert.equal(fs.existsSync(path.join(root, "deleted/public/articles/old-post.png")), false);
});
test("generation never promotes; failed upload preserves baseline; successful publish survives restart and supports rollback", async (t) => {
  const root = fixture(t);
  let failUpload = false;
  const uploads = [];
  const publisher = createPublisher(root, { build: fakeBuild, deploy: async (...args) => { if (failUpload) throw new Error("network interrupted"); uploads.push(args[2]); }, rollback: async () => {} });
  publisher.configure(settings);
  save(root, "old-post", "first published", "first image");
  const firstGenerated = await (await publisher.start({ selection: pendingChanges(root) })).completion;
  assert.equal(firstGenerated.status, "generated");
  assert.equal(pendingChanges(root).length, 1);
  assert.match(content(baselineRoot(root), "old-post"), /online original/);
  failUpload = true;
  const failed = await (await publisher.start({ mode: "deploy", selection: pendingChanges(root) })).completion;
  assert.equal(failed.status, "failed");
  assert.equal(fs.existsSync(path.join(root, ".studio/publish.lock")), false);
  assert.match(content(baselineRoot(root), "old-post"), /online original/);
  failUpload = false;
  const first = await (await publisher.start({ mode: "deploy", selection: pendingChanges(root) })).completion;
  assert.equal(first.status, "published");
  assert.equal(pendingChanges(root).length, 0);
  save(root, "old-post", "second published", "second image");
  const second = await (await publisher.start({ mode: "deploy", selection: pendingChanges(root) })).completion;
  assert.equal(createPublisher(root).status().state.current, second.id);
  await publisher.revert(first.id);
  assert.equal(publisher.status().state.current, first.id);
  assert.match(content(root, "old-post"), /second published/);
  assert.match(content(baselineRoot(root), "old-post"), /first published/);
  assert.equal(uploads.length, 2);
});
test("build failure, duplicate publish and writes during publishing do not affect source", async (t) => {
  const root = fixture(t);
  let finish;
  const gate = new Promise((resolve) => { finish = resolve; });
  const publisher = createPublisher(root, { build: async () => { await gate; throw new Error("build failed"); } });
  const running = await publisher.start();
  await assert.rejects(() => publisher.start(), /正在处理任务/);
  assert.throws(() => publisher.mutate(() => save(root, "bad", "bad", "bad")), /正在处理任务/);
  finish();
  const job = await running.completion;
  assert.equal(job.status, "failed");
  assert.match(job.error, /build failed/);
  assert.equal(publisher.status().busy, false);
});
test("backup omits credentials and preserves recoverable original files", async (t) => {
  const root = fixture(t);
  const publisher = createPublisher(root);
  publisher.configure(settings);
  publisher.credential("key", "-----BEGIN OPENSSH PRIVATE KEY-----\nprivate-secret\n-----END OPENSSH PRIVATE KEY-----");
  publisher.mutate(() => save(root, "old-post", "edited", "edited"));
  const backup = await publisher.backup();
  const { run } = await import("./ssh-deploy.mjs");
  const listing = await run("tar", ["-tzf", publisher.backupFile(backup.id)]);
  assert.match(listing, /src\/content\/articles\/old-post.md/);
  assert.match(listing, /\.studio\/revisions/);
  assert.doesNotMatch(listing, /id_ed25519|settings.json/);
});
test("SSH settings reject command injection, unsafe paths and URL credentials", () => {
  for (const change of [{ host: "x;touch /tmp/pwn" }, { user: "-oProxyCommand=x" }, { remotePath: "/" }, { remotePath: "/srv/../etc" }, { siteUrl: "https://user:password@example.com" }, { siteUrl: "javascript:alert(1)" }]) {
    assert.throws(() => validateSettings({ ...settings, ...change }));
  }
});
test("studio blocks cross-origin writes and DNS rebinding; same-origin draft stays pending", async (t) => {
  const root = fixture(t);
  const server = createStudioServer({ root });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) };
  assert.equal((await fetch(`${base}/api/publishing/settings`, { ...request, headers: { ...request.headers, Origin: "https://evil.example" } })).status, 403);
  const rebound = await new Promise((resolve, reject) => {
    http.get(`${base}/api/publishing`, { headers: { Host: "evil.example" } }, (response) => { response.resume(); resolve(response.statusCode); }).on("error", reject);
  });
  assert.equal(rebound, 403);
  assert.equal((await fetch(`${base}/api/publishing/settings`, request)).status, 200);
  const response = await fetch(`${base}/api/articles`, { ...request, body: JSON.stringify({ title: "New", slug: "new", category: "生活", summary: "draft", body: "private draft", allowEmpty: true }) });
  assert.equal(response.status, 200);
  const status = await fetch(`${base}/api/publishing`).then((r) => r.json());
  assert.equal(status.changes.length, 1);
  assert.equal(readJson(path.join(root, ".studio/state.json")), null);
});
