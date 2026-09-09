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

export const STUDIO_PORT = 8787;
export const STUDIO_HOST = "127.0.0.1";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STUDIO_DIR = path.join(HERE, "studio");
const ROOT = process.env.MYSITE_ROOT || path.resolve(HERE, "..");
const MAX_BLOB = 25 * 1024 * 1024;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
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
} = {}) {
  const blobs = new Map();

  const server = http.createServer(async (req, res) => {
    try {
      const url = parseUrl(req);
      const method = req.method || "GET";

      if (method === "GET" && url.pathname === "/api/health") {
        sendJson(res, 200, { ok: true, site: "http://127.0.0.1:3000" });
        return;
      }

      if (method === "GET" && url.pathname === "/api/meta") {
        sendJson(res, 200, {
          today: todayISO(),
          site: "http://127.0.0.1:3000",
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
        deleteArticleFiles(root, slug);
        sendJson(res, 200, { ok: true, slug });
        return;
      }

      if (method === "PUT" && url.pathname === "/api/articles") {
        const payload = JSON.parse((await readBody(req, 2_000_000)).toString("utf8"));
        const saved = saveArticle(root, payload, blobs);
        sendJson(res, 200, { ok: true, article: saved });
        return;
      }

      const blobMatch = url.pathname.match(/^\/api\/blobs\/([a-zA-Z0-9_-]+)$/);
      if (blobMatch && method === "PUT") {
        const id = safeBlobId(blobMatch[1]);
        const body = await readBody(req, MAX_BLOB);
        const ext = extFrom(url.searchParams.get("name"), req.headers["content-type"]);
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
      console.log(`文章工坊  ${server.url}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
