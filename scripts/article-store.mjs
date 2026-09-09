import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
export const BLOB_PREFIX = "/__blob__/";
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function todayISO(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function assertSlug(slug) {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`slug 只能用小写英文、数字和连字符：${slug || "（空）"}`);
  }
}

function asString(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function asDateString(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  return asString(value);
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function padIndex(index, total) {
  const width = total >= 100 ? 3 : 2;
  return String(index).padStart(width, "0");
}

function articlesDir(root) {
  return path.join(root, "src/content/articles");
}

function publicArticlesDir(root) {
  return path.join(root, "public/articles");
}

function galleryDir(root, slug) {
  return path.join(publicArticlesDir(root), "gallery", slug);
}

function assertInside(root, target) {
  const rel = path.relative(root, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("非法路径");
  }
}

function normalizeExt(ext) {
  const value = String(ext || "").toLowerCase();
  if (value === ".jpeg") return ".jpg";
  return IMAGE_EXT.has(value) ? value : ".jpg";
}

function extFromName(name) {
  return normalizeExt(path.extname(name || ""));
}

export function listCoverFiles(root, slug) {
  const dir = publicArticlesDir(root);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.startsWith(`${slug}.`))
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .map((name) => path.join(dir, name));
}

export function listArticles(root) {
  const dir = articlesDir(root);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const slug = name.slice(0, -".md".length);
      const parsed = matter(fs.readFileSync(path.join(dir, name), "utf8"));
      return {
        slug,
        title: asString(parsed.data.title) || slug,
        date: asDateString(parsed.data.date),
        category: asString(parsed.data.category),
        summary: asString(parsed.data.summary),
        cover: asString(parsed.data.cover),
      };
    })
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return a.slug.localeCompare(b.slug);
    });
}

export function readArticle(root, slug) {
  assertSlug(slug);
  const file = path.join(articlesDir(root), `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  const parsed = matter(fs.readFileSync(file, "utf8"));
  return {
    slug,
    title: asString(parsed.data.title),
    date: asDateString(parsed.data.date),
    category: asString(parsed.data.category),
    summary: asString(parsed.data.summary),
    cover: asString(parsed.data.cover),
    body: parsed.content.replace(/^\n+/, "").replace(/\n+$/, ""),
  };
}

export function parseMarkdownImages(markdown) {
  const matches = [];
  const pattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match = pattern.exec(markdown);
  while (match) {
    matches.push({
      alt: match[1],
      src: match[2].trim(),
      raw: match[0],
    });
    match = pattern.exec(markdown);
  }
  return matches;
}

function buildMarkdown({ title, date, category, summary, cover, body }) {
  return `---
title: ${yamlQuote(title)}
date: ${yamlQuote(date)}
category: ${yamlQuote(category)}
summary: ${yamlQuote(summary)}
cover: ${yamlQuote(cover)}
---

${body.trim()}
`;
}

function blobIdFromSrc(src) {
  if (!src.startsWith(BLOB_PREFIX)) return null;
  return src.slice(BLOB_PREFIX.length).replace(/\.[a-z0-9]+$/i, "");
}

function resolveLocalFile(root, src) {
  if (!src.startsWith("/articles/")) return null;
  const target = path.join(root, "public", src.replace(/^\/+/, ""));
  assertInside(path.join(root, "public"), target);
  return fs.existsSync(target) ? target : null;
}

function removeDirIfEmpty(dir) {
  if (!fs.existsSync(dir)) return;
  const left = fs.readdirSync(dir);
  if (left.length === 0) fs.rmdirSync(dir);
}

export function deleteArticleFiles(root, slug) {
  assertSlug(slug);
  const md = path.join(articlesDir(root), `${slug}.md`);
  if (fs.existsSync(md)) fs.unlinkSync(md);
  for (const file of listCoverFiles(root, slug)) fs.unlinkSync(file);
  const gallery = galleryDir(root, slug);
  if (fs.existsSync(gallery)) fs.rmSync(gallery, { recursive: true, force: true });
}

export function saveArticle(root, input, blobs = new Map()) {
  const title = asString(input.title);
  const category = asString(input.category);
  const summary = asString(input.summary);
  const date = asDateString(input.date) || todayISO();
  const slug = slugify(input.slug || "") || slugify(title);
  const previousSlug = asString(input.previousSlug);
  const bodyIn = String(input.body ?? "");
  const allowEmpty = Boolean(input.allowEmpty);

  const missing = [];
  if (!title) missing.push("标题");
  if (!category) missing.push("分类");
  if (!summary) missing.push("摘要");
  if (!slug) missing.push("slug（中文标题需要英文短名）");
  if (missing.length > 0) throw new Error(`缺少${missing.join("、")}`);
  assertSlug(slug);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`date 必须是 YYYY-MM-DD：${date}`);
  }

  if (previousSlug && previousSlug !== slug) assertSlug(previousSlug);

  const existing = readArticle(root, slug);
  if (existing && previousSlug !== slug) {
    throw new Error(`已有文章 ${slug}。请从左侧打开再编辑。`);
  }

  const images = parseMarkdownImages(bodyIn);
  const localImages = [];
  for (const image of images) {
    const blobId = blobIdFromSrc(image.src);
    if (blobId) {
      const blob = blobs.get(blobId);
      if (!blob) throw new Error(`找不到刚上传的图片 ${blobId}`);
      localImages.push({
        alt: image.alt,
        src: image.src,
        buffer: blob.buffer,
        ext: normalizeExt(blob.ext || extFromName(image.src)),
      });
      continue;
    }
    if (image.src.startsWith("http://") || image.src.startsWith("https://")) {
      continue;
    }
    const file = resolveLocalFile(root, image.src);
    if (!file) {
      throw new Error(`正文里的图片不存在：${image.src}`);
    }
    localImages.push({
      alt: image.alt,
      src: image.src,
      buffer: fs.readFileSync(file),
      ext: normalizeExt(path.extname(file)),
    });
  }

  let coverBuffer = null;
  let coverExt = ".jpg";
  const coverInput = input.cover ?? null;

  if (coverInput?.blob) {
    const blob = blobs.get(coverInput.blob);
    if (!blob) throw new Error("找不到刚上传的封面");
    coverBuffer = blob.buffer;
    coverExt = normalizeExt(blob.ext || coverInput.ext);
  } else if (coverInput?.keep !== false) {
    const fromSlug = previousSlug || slug;
    const currentCover =
      (existing && slug === fromSlug ? existing.cover : null) ||
      (previousSlug ? readArticle(root, previousSlug)?.cover : null) ||
      (existing ? existing.cover : "");
    const coverFile = currentCover
      ? resolveLocalFile(root, currentCover)
      : listCoverFiles(root, fromSlug)[0];
    if (coverFile) {
      coverBuffer = fs.readFileSync(coverFile);
      coverExt = normalizeExt(path.extname(coverFile));
    }
  }

  if (!coverBuffer && localImages.length > 0) {
    coverBuffer = localImages[0].buffer;
    coverExt = localImages[0].ext;
  }

  if (!coverBuffer && !allowEmpty) {
    throw new Error("请上传封面，或勾选「暂时没有图」。");
  }

  const galleryPublic = [];
  const srcMap = new Map();
  localImages.forEach((image, index) => {
    const filename = `${padIndex(index + 1, localImages.length)}${image.ext}`;
    const publicPath = `/articles/gallery/${slug}/${filename}`;
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

  if (galleryPublic.length > 0 && !/!\[[^\]]*\]\(/m.test(body)) {
    body = `${body.trim()}\n\n${galleryPublic
      .map((item) => `![](${item.publicPath})`)
      .join("\n\n")}\n`;
  }

  const coverPublic = `/articles/${slug}${coverBuffer ? coverExt : ".jpg"}`;
  const markdown = buildMarkdown({
    title,
    date,
    category,
    summary,
    cover: coverPublic,
    body,
  });

  const written = [];
  const mdPath = path.join(articlesDir(root), `${slug}.md`);
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, markdown.endsWith("\n") ? markdown : `${markdown}\n`);
  written.push(path.relative(root, mdPath));

  if (coverBuffer) {
    const coverPath = path.join(publicArticlesDir(root), `${slug}${coverExt}`);
    fs.mkdirSync(path.dirname(coverPath), { recursive: true });
    fs.writeFileSync(coverPath, coverBuffer);
    written.push(path.relative(root, coverPath));
    for (const leftover of listCoverFiles(root, slug)) {
      if (leftover !== coverPath) fs.unlinkSync(leftover);
    }
  }

  const galleryRoot = galleryDir(root, slug);
  const previousGalleryFiles = fs.existsSync(galleryRoot)
    ? fs.readdirSync(galleryRoot).map((name) => path.join(galleryRoot, name))
    : [];
  const keepAbs = new Set(galleryPublic.map((item) => item.abs));

  if (galleryPublic.length > 0) {
    fs.mkdirSync(galleryRoot, { recursive: true });
  }
  for (const item of galleryPublic) {
    fs.writeFileSync(item.abs, item.buffer);
    written.push(path.relative(root, item.abs));
  }
  for (const file of previousGalleryFiles) {
    if (!keepAbs.has(file)) fs.unlinkSync(file);
  }
  removeDirIfEmpty(galleryRoot);

  if (previousSlug && previousSlug !== slug) {
    deleteArticleFiles(root, previousSlug);
  }

  return {
    slug,
    title,
    date,
    category,
    summary,
    cover: coverPublic,
    body: body.trim(),
    preview: `/articles/${slug}/`,
    files: written,
  };
}
