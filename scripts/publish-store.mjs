import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";

export const CONTENT_DIRS = ["src/content/articles", "src/content/works"];
export const SOURCE_PATHS = [...CONTENT_DIRS, "public"];
export const releaseId = () => `${new Date().toISOString().replace(/[-:.]/g, "")}-${crypto.randomBytes(4).toString("hex")}`;
export const validId = (id) => typeof id === "string" && /^[0-9TZ]+-[a-f0-9]{8}$/.test(id);
export const stateDir = (root) => path.join(root, ".studio");
export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  fs.renameSync(temp, file);
}
export function readJson(file, fallback = null) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback;
}
export function copyTree(from, to) {
  if (!fs.existsSync(from)) return;
  // Never copy a symlink to credentials or files outside the content tree.
  if (fs.lstatSync(from).isSymbolicLink()) throw new Error(`内容不支持符号链接：${path.basename(from)}`);
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const name of fs.readdirSync(from)) copyTree(path.join(from, name), path.join(to, name));
  } else {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}
export function copySources(from, to) {
  for (const rel of SOURCE_PATHS) copyTree(path.join(from, rel), path.join(to, rel));
}
export function initializePublishing(root) {
  const dir = stateDir(root);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(path.join(dir, "initial"))) {
    const temp = path.join(dir, `initial-${crypto.randomUUID()}`);
    copySources(root, temp);
    fs.renameSync(temp, path.join(dir, "initial"));
  }
}
export function baselineRoot(root) {
  const state = readJson(path.join(stateDir(root), "state.json"), {});
  if (!state.current) return path.join(stateDir(root), "initial");
  if (!validId(state.current)) throw new Error("发布记录损坏，请从备份恢复");
  const source = path.join(stateDir(root), "releases", state.current, "source");
  if (!fs.existsSync(source)) throw new Error("缺少已发布原稿，请从备份恢复");
  return source;
}
export function localAsset(source, url) {
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  const pathname = decodeURIComponent(url.split(/[?#]/)[0]);
  if (pathname.includes("\\") || pathname.includes("\0")) throw new Error("素材地址不合法");
  const rel = `public${pathname}`;
  const resolved = path.resolve(source, rel);
  if (!resolved.startsWith(path.join(path.resolve(source), "public") + path.sep)) throw new Error("素材路径越界");
  return rel;
}
function references(source, text) {
  const parsed = matter(text);
  const assets = new Set();
  function add(url) {
    if (typeof url !== "string") return;
    const rel = localAsset(source, url);
    if (rel) assets.add(rel);
  }
  add(typeof parsed.data.cover === "string" ? parsed.data.cover : parsed.data.cover?.image);
  function walk(node) {
    // Local links may be attachments; navigation links without an extension are routes.
    if (node.type === "image" || ((node.type === "link" || node.type === "definition") && /\.[a-z0-9]+(?:[?#]|$)/i.test(node.url || ""))) add(node.url);
    for (const child of node.children || []) walk(child);
  }
  walk(unified().use(remarkParse).parse(parsed.content));
  return [...assets].sort();
}
function fileHash(file) {
  if (!fs.existsSync(file)) return "missing";
  if (fs.lstatSync(file).isSymbolicLink() || !fs.statSync(file).isFile()) throw new Error("素材必须是普通文件");
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
export function documents(source) {
  const docs = new Map();
  for (const dir of CONTENT_DIRS) {
    if (!fs.existsSync(path.join(source, dir))) continue;
    for (const name of fs.readdirSync(path.join(source, dir)).filter((n) => n.endsWith(".md"))) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(name)) throw new Error(`文章文件名不合法：${name}`);
      const rel = `${dir}/${name}`;
      const text = fs.readFileSync(path.join(source, rel), "utf8");
      const assets = references(source, text);
      const hash = crypto.createHash("sha256").update(text);
      for (const asset of assets) hash.update(asset).update(fileHash(path.join(source, asset)));
      docs.set(rel, { key: rel, title: String(matter(text).data.title || name), kind: dir.endsWith("articles") ? "文章" : "作品", assets, hash: hash.digest("hex") });
    }
  }
  return docs;
}
export function pendingChanges(root) {
  const before = documents(baselineRoot(root));
  const after = documents(root);
  return [...new Set([...before.keys(), ...after.keys()])].flatMap((key) => {
    const old = before.get(key), next = after.get(key);
    if (old?.hash === next?.hash) return [];
    return [{ key, title: (next || old).title, kind: (next || old).kind,
      change: !next ? "删除" : !old ? "新草稿" : "修改草稿", revision: next?.hash || "deleted" }];
  });
}
export function snapshot(root, target, selection) {
  if (!Array.isArray(selection)) throw new Error("请选择要发布的草稿");
  const pending = new Map(pendingChanges(root).map((c) => [c.key, c]));
  const keys = new Set();
  for (const item of selection) {
    if (!item || pending.get(item.key)?.revision !== item.revision || keys.has(item.key)) throw new Error("草稿发生变化，请刷新发布清单后重试");
    keys.add(item.key);
  }
  const base = baselineRoot(root);
  copySources(base, target);
  // Site-wide illustrations and icons follow the website code, separately from article media.
  for (const name of fs.existsSync(path.join(root, "public")) ? fs.readdirSync(path.join(root, "public")) : []) {
    if (!["articles", "works"].includes(name)) copyTree(path.join(root, "public", name), path.join(target, "public", name));
  }
  const drafts = documents(root), previous = documents(base);
  for (const key of keys) {
    const doc = drafts.get(key);
    if (!doc) {
      fs.rmSync(path.join(target, key), { force: true });
      continue;
    }
    copyTree(path.join(root, key), path.join(target, key));
    for (const asset of doc.assets) {
      if (!fs.existsSync(path.join(root, asset))) throw new Error(`${doc.title} 缺少素材：${asset}`);
      for (const [otherKey, other] of previous) {
        if (!keys.has(otherKey) && other.assets.includes(asset) && fileHash(path.join(base, asset)) !== fileHash(path.join(root, asset))) {
          throw new Error(`素材与「${other.title}」共用，请一并选择相关草稿`);
        }
      }
      copyTree(path.join(root, asset), path.join(target, asset));
    }
  }
  const selectedDocs = documents(target);
  const used = new Set([...selectedDocs.values()].flatMap((doc) => doc.assets));
  // Remove old article media too: a deleted or unselected draft must not remain downloadable.
  for (const category of ["articles", "works"]) {
    function prune(dir) {
      if (!fs.existsSync(dir)) return;
      for (const name of fs.readdirSync(dir)) {
        const file = path.join(dir, name);
        if (fs.statSync(file).isDirectory()) prune(file);
        else if (!used.has(path.relative(target, file).split(path.sep).join("/"))) fs.unlinkSync(file);
      }
    }
    prune(path.join(target, "public", category));
  }
  for (const doc of selectedDocs.values()) for (const asset of doc.assets) {
    if (!fs.existsSync(path.join(target, asset))) throw new Error(`${doc.title} 缺少素材：${asset}`);
  }
}
export function saveRevision(root) {
  const id = releaseId();
  copySources(root, path.join(stateDir(root), "revisions", id));
  return id;
}
