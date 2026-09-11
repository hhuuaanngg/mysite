import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BLOB_PREFIX,
  deleteArticleFiles,
  listArticles,
  readArticle,
  saveArticle,
  todayISO,
} from "./article-store.mjs";
import { deleteWork, listWorks, readWork, saveWork } from "./work-store.mjs";
import { createPublisher } from "./publisher.mjs";

import { SITE_ORIGIN, STUDIO_HOST, STUDIO_PORT } from "./ports.mjs";

export { STUDIO_HOST, STUDIO_PORT };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STUDIO_DIR = path.join(HERE, "studio");
const ROOT = process.env.MYSITE_ROOT || path.resolve(HERE, "..");
const MAX_BLOB = 25 * 1024 * 1024;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function send(res, status, body, headers = {}) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body ?? "");
  res.writeHead(status, {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: http:; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'",
    ...headers,
    "Content-Length": payload.length,
  });
  res.end(payload);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), {
    "Content-Type": "application/json; charset=utf-8",
  });
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("内容太大"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function extFrom(name, contentType) {
  const fromName = path.extname(name || "").toLowerCase();
  if (fromName) return fromName === ".jpeg" ? ".jpg" : fromName;
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/gif") return ".gif";
  return ".jpg";
}

function safeBlobId(id) {
  return /^[a-zA-Z0-9_-]+$/.test(id || "") ? id : null;
}

function parseUrl(req) {
  return new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
}

export function createStudioServer({
  root = ROOT,
  blobDir = fs.mkdtempSync(path.join(os.tmpdir(), "mysite-studio-")),
  publisher = createPublisher(root),
} = {}) {
  const blobs = new Map();

  const server = http.createServer(async (req, res) => {
    try {
      const url = parseUrl(req);
      const method = req.method || "GET";
      const hostname = url.hostname;
      if (!["127.0.0.1", "localhost", "[::1]"].includes(hostname) ||
        (req.headers.origin && req.headers.origin !== url.origin) ||
        req.headers["sec-fetch-site"] === "cross-site") {
        sendJson(res, 403, { error: "内容工坊只接受本机同源请求" });
        return;
      }
      if (["PUT", "POST"].includes(method) && !url.pathname.startsWith("/api/blobs/") &&
        !req.headers["content-type"]?.startsWith("application/json")) {
        sendJson(res, 415, { error: "请使用 JSON 请求" }); return;
      }

      if (url.pathname === "/api/publishing" && method === "GET") {
        sendJson(res, 200, publisher.status()); return;
      }
      if (url.pathname.startsWith("/api/publishing/") && ["PUT", "POST"].includes(method)) {
        const payload = JSON.parse((await readBody(req, 200_000)).toString("utf8"));
        const action = url.pathname.slice("/api/publishing/".length);
        if (action === "settings" && method === "PUT") sendJson(res, 200, { settings: publisher.configure(payload) });
        else if (action === "credentials" && method === "PUT") { publisher.credential(payload.type, payload.data); sendJson(res, 200, { ok: true }); }
        else if (action === "check" && method === "POST") sendJson(res, 200, await publisher.check());
        else if (action === "start" && method === "POST") { const { id } = await publisher.start(payload); sendJson(res, 202, { id }); }
        else if (action === "rollback" && method === "POST") sendJson(res, 200, await publisher.revert(payload.id));
        else if (action === "backup" && method === "POST") sendJson(res, 200, await publisher.backup());
        else if (action === "recover" && method === "POST") sendJson(res, 200, await publisher.recover());
        else sendJson(res, 404, { error: "没有这个操作" });
        return;
      }
      const download = url.pathname.match(/^\/api\/publishing\/(artifacts|backups)\/([0-9TZ]+-[a-f0-9]{8})$/);
      if (download && method === "GET") {
        const file = download[1] === "artifacts" ? publisher.artifact(download[2]) : publisher.backupFile(download[2]);
        if (!fs.existsSync(file)) { sendJson(res, 404, { error: "文件尚未生成" }); return; }
        res.writeHead(200, { "Content-Type": "application/gzip", "Content-Disposition": `attachment; filename="mysite-${download[1]}-${download[2]}.tar.gz"`, "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" });
        fs.createReadStream(file).pipe(res); return;
      }

      if (method === "GET" && url.pathname === "/api/health") {
        sendJson(res, 200, { ok: true, site: SITE_ORIGIN });
        return;
      }

      if (method === "GET" && url.pathname === "/api/meta") {
        sendJson(res, 200, {
          today: todayISO(),
          site: SITE_ORIGIN,
          blobPrefix: BLOB_PREFIX,
        });
        return;
      }

      if (method === "GET" && url.pathname === "/api/articles") {
        sendJson(res, 200, { articles: listArticles(root) });
        return;
      }

      const articleMatch = url.pathname.match(/^\/api\/articles\/([a-z0-9-]+)$/);
      if (articleMatch && method === "GET") {
        const article = readArticle(root, articleMatch[1]);
        if (!article) {
          sendJson(res, 404, { error: "没有这篇文章" });
          return;
        }
        sendJson(res, 200, { article });
        return;
      }

      if (articleMatch && method === "DELETE") {
        const slug = articleMatch[1];
        if (!readArticle(root, slug)) {
          sendJson(res, 404, { error: "没有这篇文章" });
          return;
        }
        publisher.mutate(() => deleteArticleFiles(root, slug));
        sendJson(res, 200, { ok: true, slug });
        return;
      }

      if (method === "PUT" && url.pathname === "/api/articles") {
        const payload = JSON.parse((await readBody(req, 2_000_000)).toString("utf8"));
        const saved = publisher.mutate(() => saveArticle(root, payload, blobs));
        sendJson(res, 200, { ok: true, article: saved });
        return;
      }

      if (method === "GET" && url.pathname === "/api/works") {
        sendJson(res, 200, { works: listWorks(root) });
        return;
      }

      const workMatch = url.pathname.match(/^\/api\/works\/([a-z0-9-]+)$/);
      if (workMatch && method === "GET") {
        const work = readWork(root, workMatch[1]);
        if (!work) {
          sendJson(res, 404, { error: "没有这个作品" });
          return;
        }
        sendJson(res, 200, { work });
        return;
      }

      if (workMatch && method === "DELETE") {
        const slug = workMatch[1];
        if (!readWork(root, slug)) {
          sendJson(res, 404, { error: "没有这个作品" });
          return;
        }
        publisher.mutate(() => deleteWork(root, slug));
        sendJson(res, 200, { ok: true, slug });
        return;
      }

      if (method === "PUT" && url.pathname === "/api/works") {
        const payload = JSON.parse((await readBody(req, 2_000_000)).toString("utf8"));
        const saved = publisher.mutate(() => saveWork(root, payload, blobs));
        sendJson(res, 200, { ok: true, work: saved });
        return;
      }

      const blobMatch = url.pathname.match(/^\/api\/blobs\/([a-zA-Z0-9_-]+)$/);
      if (blobMatch && method === "PUT") {
        const id = safeBlobId(blobMatch[1]);
        const body = await readBody(req, MAX_BLOB);
        const ext = extFrom(url.searchParams.get("name"), req.headers["content-type"]);
        if (![".jpg", ".png", ".webp", ".gif"].includes(ext)) throw new Error("仅支持 JPG、PNG、WebP 和 GIF 图片");
        const file = path.join(blobDir, `${id}${ext}`);
        fs.writeFileSync(file, body);
        blobs.set(id, { ext, file, buffer: body });
        sendJson(res, 200, { id, src: `${BLOB_PREFIX}${id}${ext}` });
        return;
      }

      if (blobMatch && method === "GET") {
        const blob = blobs.get(blobMatch[1]);
        if (!blob) {
          sendJson(res, 404, { error: "找不到缓存图片" });
          return;
        }
        send(res, 200, blob.buffer, {
          "Content-Type": MIME[blob.ext] || "application/octet-stream",
        });
        return;
      }

      if (method === "GET" && url.pathname.startsWith("/media/")) {
        const rel = url.pathname.slice("/media/".length);
        const target = path.resolve(path.join(root, "public", rel));
        const publicRoot = path.resolve(path.join(root, "public"));
        if (!target.startsWith(publicRoot + path.sep) && target !== publicRoot) {
          sendJson(res, 403, { error: "非法路径" });
          return;
        }
        if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
          send(res, 404, "not found", { "Content-Type": "text/plain" });
          return;
        }
        send(res, 200, fs.readFileSync(target), {
          "Content-Type": MIME[path.extname(target).toLowerCase()] || "application/octet-stream",
        });
        return;
      }

      if (method === "GET" && url.pathname === "/vendor/marked.esm.js") {
        const file = path.join(ROOT, "node_modules/marked/lib/marked.esm.js");
        send(res, 200, fs.readFileSync(file), {
          "Content-Type": "text/javascript; charset=utf-8",
        });
        return;
      }

      if (method === "GET") {
        const file =
          url.pathname === "/"
            ? path.join(STUDIO_DIR, "index.html")
            : path.join(STUDIO_DIR, path.normalize(url.pathname).replace(/^\/+/, ""));
        if (!file.startsWith(STUDIO_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          send(res, 404, "not found", { "Content-Type": "text/plain" });
          return;
        }
        send(res, 200, fs.readFileSync(file), {
          "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        });
        return;
      }

      sendJson(res, 405, { error: "不支持的请求" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 400, { error: message });
    }
  });

  server.blobDir = blobDir;
  server.blobs = blobs;
  server.root = root;
  return server;
}

export function startStudio({
  host = STUDIO_HOST,
  port = STUDIO_PORT,
  root = ROOT,
} = {}) {
  const server = createStudioServer({ root });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.url = `http://${host}:${port}`;
      resolve(server);
    });
  });
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (invokedDirectly) {
  startStudio()
    .then((server) => {
      console.log(`内容工坊  ${server.url}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
