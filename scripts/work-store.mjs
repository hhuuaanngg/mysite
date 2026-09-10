import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  BLOB_PREFIX,
  assertSlug,
  parseMarkdownImages,
  slugify,
} from "./article-store.mjs";

const COLOR = /^#[0-9a-fA-F]{6}$/;
const HTTP = /^https?:\/\/.+/i;
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function worksDir(root) {
  return path.join(root, "src/content/works");
}

function galleryDir(root, slug) {
  return path.join(root, "public/works/gallery", slug);
}

function asString(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function asLines(value) {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  return asString(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function asTags(value) {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  return asString(value)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function asBool(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function asOrder(value) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

function asColor(value, field) {
  const color = asString(value);
  if (!COLOR.test(color)) {
    throw new Error(`${field} 必须是 #RRGGBB，例如 #fde8d8`);
  }
  return color.toLowerCase();
}

function asOptionalUrl(value, field) {
  const url = asString(value);
  if (!url) return "";
  if (!HTTP.test(url)) throw new Error(`${field} 必须是 http(s) 链接`);
  return url;
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function yamlList(items) {
  return items.map((item) => `  - ${yamlQuote(item)}`).join("\n");
}

function padIndex(index, total) {
  const width = total >= 100 ? 3 : 2;
  return String(index).padStart(width, "0");
}

function normalizeExt(ext) {
  const value = String(ext || "").toLowerCase();
  if (value === ".jpeg") return ".jpg";
  return IMAGE_EXT.has(value) ? value : ".jpg";
}

function extFromName(name) {
  return normalizeExt(path.extname(name || ""));
}

function workPath(root, slug) {
  return path.join(worksDir(root), `${slug}.md`);
}

function jsonPath(root, slug) {
  return path.join(worksDir(root), `${slug}.json`);
}

function assertInside(root, target) {
  const rel = path.relative(root, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("非法路径");
  }
}

function blobIdFromSrc(src) {
  if (!src.startsWith(BLOB_PREFIX)) return null;
  return src.slice(BLOB_PREFIX.length).replace(/\.[a-z0-9]+$/i, "");
}

function resolveLocalFile(root, src) {
  if (!src.startsWith("/works/") && !src.startsWith("/articles/")) return null;
  const target = path.join(root, "public", src.replace(/^\/+/, ""));
  assertInside(path.join(root, "public"), target);
  return fs.existsSync(target) ? target : null;
}

function removeDirIfEmpty(dir) {
  if (!fs.existsSync(dir)) return;
  const left = fs.readdirSync(dir);
  if (left.length === 0) fs.rmdirSync(dir);
}

export function composeWorkBody(input) {
  const body = String(input.body ?? "").trim();
  if (body) return body;
  const problem = asString(input.problem);
  const solution = asString(input.solution);
  const highlights = asLines(input.highlights);
  const parts = [];
  if (problem) parts.push(`## 问题\n\n${problem}`);
  if (solution) parts.push(`## 方案\n\n${solution}`);
  if (highlights.length > 0) {
    parts.push(`## 技术要点\n\n${highlights.map((item) => `- ${item}`).join("\n")}`);
  }
  return parts.join("\n\n");
}

function normalizeWork(input) {
  const slug = asString(input.slug);
  assertSlug(slug);
  const title = asString(input.title);
  const year = asString(input.year);
  const summary = asString(input.summary);
  const body = composeWorkBody(input);
  const stack = asTags(input.stack);
  const cover = input.cover && typeof input.cover === "object" ? input.cover : {};
  const mark = asString(cover.mark);
  const missing = [];
  if (!title) missing.push("标题");
  if (!year) missing.push("年份");
  if (!summary) missing.push("摘要");
  if (!body) missing.push("正文");
  if (stack.length === 0) missing.push("技术栈");
  if (!mark) missing.push("封面字母");
  if (missing.length > 0) throw new Error(`缺少${missing.join("、")}`);
  if (mark.length > 8) throw new Error("封面字母最多 8 个字符");

  const order = asOrder(input.order);
  const work = {
    slug,
    title,
    year,
    order: order ?? 0,
    summary,
    body,
    stack,
    featured: asBool(input.featured),
    cover: {
      mark,
      from: asColor(cover.from, "起始色"),
      to: asColor(cover.to, "结束色"),
      accent: asColor(cover.accent, "强调色"),
    },
  };
  const repo = asOptionalUrl(input.repo, "GitHub");
  const url = asOptionalUrl(input.url, "线上地址");
  if (repo) work.repo = repo;
  if (url) work.url = url;
  return work;
}

function parseWorkFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const slugFromName = path.basename(file).replace(/\.(md|json)$/, "");
  if (file.endsWith(".json")) {
    const data = JSON.parse(raw);
    return normalizeWork({ ...data, slug: asString(data.slug) || slugFromName });
  }
  const parsed = matter(raw);
  const cover = parsed.data.cover && typeof parsed.data.cover === "object" ? parsed.data.cover : {};
  return normalizeWork({
    ...parsed.data,
    slug: asString(parsed.data.slug) || slugFromName,
    cover,
    body: parsed.content.replace(/^\n+/, "").replace(/\n+$/, ""),
  });
}

export function compareWorks(a, b) {
  const featuredA = Boolean(a.featured);
  const featuredB = Boolean(b.featured);
  if (featuredA !== featuredB) return featuredA ? -1 : 1;
  if (a.order !== b.order) return a.order - b.order;
  return a.slug.localeCompare(b.slug);
}

export function listWorks(root) {
  const dir = worksDir(root);
  if (!fs.existsSync(dir)) return [];
  const names = fs.readdirSync(dir);
  const slugs = new Set();
  const works = [];
  for (const name of names) {
    if (!name.endsWith(".md") && !name.endsWith(".json")) continue;
    const slug = name.replace(/\.(md|json)$/, "");
    if (slugs.has(slug)) continue;
    const preferred = names.includes(`${slug}.md`) ? `${slug}.md` : name;
    slugs.add(slug);
    works.push(parseWorkFile(path.join(dir, preferred)));
  }
  return works.sort(compareWorks);
}

export function readWork(root, slug) {
  assertSlug(slug);
  const md = workPath(root, slug);
  if (fs.existsSync(md)) return parseWorkFile(md);
  const json = jsonPath(root, slug);
  if (fs.existsSync(json)) return parseWorkFile(json);
  return null;
}

function nextOrder(root) {
  const works = listWorks(root);
  if (works.length === 0) return 0;
  return Math.max(...works.map((work) => work.order)) + 1;
}

export function serializeWork(work) {
  const featuredLine = work.featured ? "featured: true\n" : "";
  const repoLine = work.repo ? `repo: ${yamlQuote(work.repo)}\n` : "";
  const urlLine = work.url ? `url: ${yamlQuote(work.url)}\n` : "";
  return `---
title: ${yamlQuote(work.title)}
year: ${yamlQuote(work.year)}
order: ${work.order}
${featuredLine}summary: ${yamlQuote(work.summary)}
stack:
${yamlList(work.stack)}
${repoLine}${urlLine}cover:
  mark: ${yamlQuote(work.cover.mark)}
  from: ${yamlQuote(work.cover.from)}
  to: ${yamlQuote(work.cover.to)}
  accent: ${yamlQuote(work.cover.accent)}
---

${work.body.trim()}
`;
}

export function deleteWork(root, slug) {
  assertSlug(slug);
  const md = workPath(root, slug);
  if (fs.existsSync(md)) fs.unlinkSync(md);
  const json = jsonPath(root, slug);
  if (fs.existsSync(json)) fs.unlinkSync(json);
  const gallery = galleryDir(root, slug);
  if (fs.existsSync(gallery)) fs.rmSync(gallery, { recursive: true, force: true });
}

function rewriteBodyImages(root, slug, bodyIn, blobs) {
  const images = parseMarkdownImages(bodyIn);
  const localImages = [];
  for (const image of images) {
    const blobId = blobIdFromSrc(image.src);
    if (blobId) {
      const blob = blobs.get(blobId);
      if (!blob) throw new Error(`找不到刚上传的图片 ${blobId}`);
      localImages.push({
        src: image.src,
        buffer: blob.buffer,
        ext: normalizeExt(blob.ext || extFromName(image.src)),
      });
      continue;
    }
    if (image.src.startsWith("http://") || image.src.startsWith("https://")) continue;
    const file = resolveLocalFile(root, image.src);
    if (!file) throw new Error(`正文里的图片不存在：${image.src}`);
    localImages.push({
      src: image.src,
      buffer: fs.readFileSync(file),
      ext: normalizeExt(path.extname(file)),
    });
  }

  const galleryPublic = [];
  const srcMap = new Map();
  localImages.forEach((image, index) => {
    const filename = `${padIndex(index + 1, localImages.length)}${image.ext}`;
    const publicPath = `/works/gallery/${slug}/${filename}`;
    galleryPublic.push({
      publicPath,
      abs: path.join(galleryDir(root, slug), filename),
      buffer: image.buffer,
    });
    srcMap.set(image.src, publicPath);
  });

  let body = bodyIn;
  for (const [from, to] of srcMap) {
    if (from === to) continue;
    body = body.split(from).join(to);
  }

  const galleryRoot = galleryDir(root, slug);
  const previousGalleryFiles = fs.existsSync(galleryRoot)
    ? fs.readdirSync(galleryRoot).map((name) => path.join(galleryRoot, name))
    : [];
  const keepAbs = new Set(galleryPublic.map((item) => item.abs));
  const written = [];

  if (galleryPublic.length > 0) fs.mkdirSync(galleryRoot, { recursive: true });
  for (const item of galleryPublic) {
    fs.writeFileSync(item.abs, item.buffer);
    written.push(path.relative(root, item.abs));
  }
  for (const file of previousGalleryFiles) {
    if (!keepAbs.has(file)) fs.unlinkSync(file);
  }
  removeDirIfEmpty(galleryRoot);

  return { body: body.trim(), files: written };
}

export function saveWork(root, input, blobs = new Map()) {
  const title = asString(input.title);
  const slug = slugify(input.slug || "") || slugify(title);
  if (!slug) throw new Error("缺少 slug（中文标题需要英文短名）");
  assertSlug(slug);
  const previousSlug = asString(input.previousSlug);
  if (previousSlug && previousSlug !== slug) assertSlug(previousSlug);

  const existing = readWork(root, slug);
  if (existing && previousSlug !== slug) {
    throw new Error(`已有作品 ${slug}。请从左侧打开再编辑。`);
  }

  const previous =
    previousSlug && previousSlug !== slug ? readWork(root, previousSlug) : existing;
  const order = asOrder(input.order) ?? previous?.order ?? nextOrder(root);
  const { body, files: imageFiles } = rewriteBodyImages(
    root,
    slug,
    composeWorkBody({ ...input, title }),
    blobs,
  );

  const work = normalizeWork({
    ...input,
    slug,
    title,
    order,
    body,
  });

  const dir = worksDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const file = workPath(root, slug);
  const markdown = serializeWork(work);
  fs.writeFileSync(file, markdown.endsWith("\n") ? markdown : `${markdown}\n`);
  const leftoverJson = jsonPath(root, slug);
  if (fs.existsSync(leftoverJson)) fs.unlinkSync(leftoverJson);

  const files = [path.relative(root, file), ...imageFiles];

  if (work.featured) {
    for (const other of listWorks(root)) {
      if (other.slug === work.slug || !other.featured) continue;
      other.featured = false;
      const otherFile = workPath(root, other.slug);
      fs.writeFileSync(otherFile, serializeWork(other));
      const otherJson = jsonPath(root, other.slug);
      if (fs.existsSync(otherJson)) fs.unlinkSync(otherJson);
      files.push(path.relative(root, otherFile));
    }
  }

  if (previousSlug && previousSlug !== slug) {
    deleteWork(root, previousSlug);
  }

  return {
    ...work,
    preview: `/work/${slug}/`,
    files,
  };
}
