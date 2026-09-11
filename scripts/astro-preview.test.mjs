import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { saveArticle, deleteArticleFiles } from "./article-store.mjs";
import { saveWork, deleteWork } from "./work-store.mjs";
import { buildRelease } from "./publisher.mjs";
import { initializePublishing, snapshot } from "./publish-store.mjs";

async function availablePort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

test("publishing while preview is running must not replace its React development runtime", { timeout: 60000 }, async (t) => {
  const repo = path.resolve(import.meta.dirname, "..");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mysite-preview-build-"));
  const port = await availablePort();
  let studioPort = await availablePort();
  while (studioPort === port) studioPort = await availablePort();
  for (const name of ["src", "scripts", "public", "package.json", "package-lock.json", "astro.config.mjs", "tsconfig.json"]) {
    fs.cpSync(path.join(repo, name), path.join(root, name), { recursive: true });
  }
  // Match the production publisher's shared dependency installation.
  fs.symlinkSync(path.join(repo, "node_modules"), path.join(root, "node_modules"), "dir");
  const child = spawn(process.execPath, ["scripts/dev.mjs"], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "development", SITE_PORT: String(port), STUDIO_PORT: String(studioPort), ASTRO_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (chunk) => { logs += chunk; });
  child.stderr.on("data", (chunk) => { logs += chunk; });
  t.after(async () => {
    if (child.exitCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    }
    fs.rmSync(root, { recursive: true, force: true });
  });
  const origin = `http://127.0.0.1:${port}`;
  async function get(url, includes = "", status = 200) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(logs);
      try {
        const response = await fetch(new URL(url, origin), { signal: AbortSignal.timeout(2000) });
        const html = await response.text();
        if (response.status === status && html.includes(includes)) return html;
      } catch { /* Wait for server startup/dependency optimization. */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Preview failed to serve ${url}\n${logs}`);
  }
  await get("/");
  const componentBefore = await get("/src/components/Showcase.tsx");
  const runtimeUrl = componentBefore.match(/from\s+"([^"]*react_jsx-dev-runtime\.js[^"]*)"/)?.[1];
  assert.ok(runtimeUrl, "preview should import the optimized JSX development runtime");
  const runtimeBefore = await get(runtimeUrl);
  assert.doesNotMatch(runtimeBefore, /exports\.jsxDEV\s*=\s*(?:void 0|undefined)/);

  // Content collection watchers must see studio-created and edited Markdown.
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aIwoAAAAASUVORK5CYII=", "base64");
  const articleInput = { title: "实时文章", slug: "live-collection", category: "生活", date: "2026-09-11", summary: "实时预览", body: "## LIVE_ARTICLE_CREATED", cover: { blob: "cover" } };
  saveArticle(root, articleInput, new Map([["cover", { buffer: png, ext: ".png" }]]));
  await get("/articles/live-collection/", "LIVE_ARTICLE_CREATED");
  saveArticle(root, { ...articleInput, previousSlug: articleInput.slug, body: "## LIVE_ARTICLE_EDITED" }, new Map([["cover", { buffer: png, ext: ".png" }]]));
  const updatedArticle = await get("/articles/live-collection/", "LIVE_ARTICLE_EDITED");
  assert.ok(updatedArticle.includes('href="#live-article-edited"'));
  assert.ok(!updatedArticle.includes("LIVE_ARTICLE_CREATED"));
  const projectInput = { title: "实时作品", slug: "live-work", year: "2026", summary: "作品预览", stack: ["Astro"], body: "## LIVE_WORK_CREATED", cover: { mark: "A", palette: "mint" } };
  saveWork(root, projectInput);
  await get("/work/live-work/", "LIVE_WORK_CREATED");
  saveWork(root, { ...projectInput, previousSlug: projectInput.slug, body: "## LIVE_WORK_EDITED" });
  await get("/work/live-work/", "LIVE_WORK_EDITED");
  saveWork(root, { ...projectInput, slug: "renamed-work", previousSlug: projectInput.slug, body: "## LIVE_WORK_RENAMED" });
  await get("/work/renamed-work/", "LIVE_WORK_RENAMED");
  await get("/work/live-work/", "", 404);

  initializePublishing(root);
  const source = path.join(root, ".studio/test-release/source");
  snapshot(root, source, []);
  await buildRelease(root, source, path.join(root, ".studio/test-release/site"));

  // Reloading the page after publishing must receive the same working runtime.
  const runtimeAfter = await get(runtimeUrl);
  assert.equal(runtimeAfter, runtimeBefore, "production build overwrote the live development dependency cache");
  assert.doesNotMatch(runtimeAfter, /exports\.jsxDEV\s*=\s*(?:void 0|undefined)/);
  assert.equal(await get("/src/components/Showcase.tsx"), componentBefore);
  const html = await get("/");
  for (const title of ["精选项目", "作品分页", "社交媒体"]) assert.ok(html.includes(title));
  deleteArticleFiles(root, "live-collection");
  deleteWork(root, "renamed-work");
  await get("/articles/live-collection/", "", 404);
  await get("/work/renamed-work/", "", 404);
});
