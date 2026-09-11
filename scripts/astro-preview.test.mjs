import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
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
  async function get(url) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(logs);
      try {
        const response = await fetch(new URL(url, origin), { signal: AbortSignal.timeout(2000) });
        if (response.ok) return await response.text();
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
});
