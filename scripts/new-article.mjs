#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { pathToFileURL } from "node:url";
import matter from "gray-matter";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const COVER_NAMES = new Set(["cover.jpg", "cover.jpeg", "cover.png", "cover.webp"]);
const BODY_NAMES = new Set(["article.md", "index.md", "post.md"]);
const SUGGESTED_CATEGORIES = ["摄影", "生活", "主题"];

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

export function parseArgs(argv) {
  const flags = {};
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--") continue;
    if (token === "-h" || token === "--help") {
      flags.help = true;
      continue;
    }
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];
    const isBoolean =
      next === undefined || next.startsWith("--") || next === "-h";

    if (isBoolean) {
      flags[key] = true;
      continue;
    }

    i += 1;
    if (key === "body") {
      flags.body = [...(flags.body ?? []), next];
    } else {
      flags[key] = next;
    }
  }

  flags._ = positional;
  return flags;
}

export function listImages(dir) {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((name) => !name.startsWith("."))
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => path.join(dir, name));
}

function padIndex(index, total) {
  const width = total >= 100 ? 3 : 2;
  return String(index).padStart(width, "0");
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function isCoverFile(filePath) {
  return COVER_NAMES.has(path.basename(filePath).toLowerCase());
}

function readDraft(fromDir) {
  if (!fromDir) return { body: "", data: {}, cover: undefined, images: [] };

  const resolved = path.resolve(fromDir);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`找不到草稿目录：${fromDir}`);
  }

  const names = fs.readdirSync(resolved).filter((name) => !name.startsWith("."));
  const bodyName = names.find((name) => BODY_NAMES.has(name.toLowerCase()));
  let data = {};
  let body = "";

  if (bodyName) {
    const parsed = matter(fs.readFileSync(path.join(resolved, bodyName), "utf8"));
    data = parsed.data ?? {};
    body = parsed.content.trim();
  }

  const cover = names
    .filter((name) => COVER_NAMES.has(name.toLowerCase()))
    .sort()
    .map((name) => path.join(resolved, name))[0];

  const images = listImages(resolved).filter((file) => !isCoverFile(file));

  return { body, data, cover, images, slugHint: slugify(path.basename(resolved)) };
}

function existingSlugs(root) {
  const dir = path.join(root, "src/content/articles");
  if (!fs.existsSync(dir)) return new Set();
  return new Set(
    fs
      .readdirSync(dir)
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.slice(0, -".md".length)),
  );
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

export function buildMarkdown({ title, date, category, summary, cover, body, imagePaths }) {
  const paragraphs = [];
  if (body.trim()) paragraphs.push(body.trim());
  if (imagePaths.length > 0 && !/!\[[^\]]*\]\(/m.test(body)) {
    paragraphs.push(imagePaths.map((src) => `![](${src})`).join("\n\n"));
  }

  return `---
title: ${yamlQuote(title)}
date: ${yamlQuote(date)}
category: ${yamlQuote(category)}
summary: ${yamlQuote(summary)}
cover: ${yamlQuote(cover)}
---

${paragraphs.join("\n\n")}
`;
}

export function planArticle(options) {
  const root = path.resolve(options.root ?? process.cwd());
  const draft = readDraft(options.from);
  const title = asString(options.title) || asString(draft.data.title);
  const category = asString(options.category) || asString(draft.data.category);
  const summary = asString(options.summary) || asString(draft.data.summary);
  const date =
    asString(options.date) || asDateString(draft.data.date) || todayISO();
  const slug =
    slugify(options.slug || "") ||
    slugify(asString(draft.data.slug)) ||
    slugify(title) ||
    draft.slugHint ||
    "";

  const missing = [];
  if (!title) missing.push("title");
  if (!category) missing.push("category");
  if (!summary) missing.push("summary");
  if (!slug) missing.push("slug（中文标题需要手动给英文短名，例如 --slug qingdao-2026）");
  if (missing.length > 0) {
    throw new Error(`缺少：${missing.join("、")}`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`slug 只能用小写英文、数字和连字符：${slug}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`date 必须是 YYYY-MM-DD：${date}`);
  }

  if (existingSlugs(root).has(slug) && !options.force) {
    throw new Error(`已有文章 ${slug}.md。换个 --slug，或加 --force 覆盖。`);
  }

  const imageDir = options.images ? path.resolve(options.images) : undefined;
  const extraImages = imageDir ? listImages(imageDir).filter((file) => !isCoverFile(file)) : [];
  const gallerySources = [...draft.images, ...extraImages];

  let coverSource =
    (options.cover ? path.resolve(options.cover) : undefined) ||
    draft.cover ||
    (imageDir
      ? listImages(imageDir).find((file) => isCoverFile(file))
      : undefined) ||
    gallerySources[0];

  if (!coverSource && !options.allowEmpty) {
    throw new Error(
      "没有封面。用 --cover 指定一张图，或 --images / --from 指向图片目录，或加 --allow-empty。",
    );
  }

  if (coverSource && !fs.existsSync(coverSource)) {
    throw new Error(`找不到封面：${coverSource}`);
  }

  const coverExt = coverSource
    ? path.extname(coverSource).toLowerCase().replace(".jpeg", ".jpg")
    : ".jpg";
  const coverPublic = `/articles/${slug}${coverExt}`;
  const galleryPublic = gallerySources.map((file, index) => {
    const ext = path.extname(file).toLowerCase().replace(".jpeg", ".jpg");
    const filename = `${padIndex(index + 1, gallerySources.length)}${ext}`;
    return {
      from: file,
      to: path.join(root, "public/articles/gallery", slug, filename),
      publicPath: `/articles/gallery/${slug}/${filename}`,
    };
  });

  const bodyParts = [
    ...((options.body ?? []).map((part) => String(part).trim()).filter(Boolean)),
    draft.body,
  ].filter(Boolean);
  const bodyFile = options["body-file"] || options.bodyFile;
  if (bodyFile) {
    bodyParts.push(fs.readFileSync(path.resolve(bodyFile), "utf8").trim());
  }

  const markdown = buildMarkdown({
    title,
    date,
    category,
    summary,
    cover: coverPublic,
    body: bodyParts.join("\n\n"),
    imagePaths: galleryPublic.map((item) => item.publicPath),
  });

  const writes = [
    {
      kind: "write",
      to: path.join(root, "src/content/articles", `${slug}.md`),
      content: markdown,
    },
  ];

  if (coverSource) {
    writes.push({
      kind: "copy",
      from: coverSource,
      to: path.join(root, "public/articles", `${slug}${coverExt}`),
    });
  }

  for (const image of galleryPublic) {
    writes.push({ kind: "copy", from: image.from, to: image.to });
  }

  return {
    slug,
    title,
    date,
    category,
    summary,
    coverPublic,
    markdown,
    writes,
    preview: `/articles/${slug}/`,
  };
}

export function applyPlan(plan, { dryRun = false } = {}) {
  if (dryRun) return plan;

  for (const item of plan.writes) {
    fs.mkdirSync(path.dirname(item.to), { recursive: true });
    if (item.kind === "write") {
      fs.writeFileSync(item.to, item.content);
    } else {
      fs.copyFileSync(item.from, item.to);
    }
  }

  return plan;
}

export function helpText() {
  return `新增文章（不用改 TypeScript，也不用找 AI 来回改）

可视化（推荐）
  npm run dev
  打开 http://127.0.0.1:8787 或站点上的「写文章」
  点「保存到仓库」即生成 Markdown / 封面 / 相册

命令行
  npm run new:article
  npm run new:article -- --title "青岛" --slug qingdao-2026 --category 摄影 --summary "海边走了一圈。" --images ~/Pictures/qingdao

最快：把草稿丢进一个文件夹再导入
  drafts/qingdao-2026/article.md   # 标题/分类/摘要/正文
  drafts/qingdao-2026/cover.jpg    # 封面，不会进正文相册
  drafts/qingdao-2026/*.jpg        # 正文图
  npm run new:article -- --from drafts/qingdao-2026

参数
  --title        标题
  --slug         英文短名，中文标题必填
  --category     摄影 / 生活 / 主题
  --summary      列表上的一两句
  --date         YYYY-MM-DD，默认今天
  --images       图片文件夹
  --cover        封面图；不填则用文件夹里的 cover.jpg，再不行用第一张
  --body         正文段落，可重复
  --body-file    从文件读正文
  --from         草稿目录
  --allow-empty  允许暂时没有图
  --force        覆盖已有 slug
  --dry-run      只预览，不写盘
`;
}

async function promptMissing(flags) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = async (label, fallback = "") => {
    const suffix = fallback ? ` [${fallback}]` : "";
    const answer = (await rl.question(`${label}${suffix}: `)).trim();
    return answer || fallback;
  };

  try {
    flags.title = flags.title || (await ask("标题"));
    flags.category =
      flags.category ||
      (await ask(`分类（${SUGGESTED_CATEGORIES.join(" / ")}）`, "摄影"));
    flags.summary = flags.summary || (await ask("摘要"));
    const autoSlug = slugify(flags.title);
    flags.slug = flags.slug || (await ask("slug（英文短名）", autoSlug));
    flags.date = flags.date || (await ask("日期", todayISO()));
    flags.images = flags.images || (await ask("图片目录（可空）"));
    flags.cover = flags.cover || (await ask("封面图（可空）"));
    if (!flags.images && !flags.cover && !flags.from) {
      const empty = (await ask("没有图也先建文件？(y/N)", "N")).toLowerCase();
      flags["allow-empty"] = empty === "y" || empty === "yes";
    }
  } finally {
    rl.close();
  }

  return flags;
}

function printPlan(plan, { dryRun }) {
  const lines = [
    dryRun ? "预览（未写盘）" : "已创建",
    "",
    `  ${plan.title}  ·  ${plan.category}  ·  ${plan.date}`,
    `  预览  http://localhost:3000${plan.preview}`,
    "",
  ];

  for (const item of plan.writes) {
    const relative = path.relative(process.cwd(), item.to) || item.to;
    lines.push(`  ${item.kind === "write" ? "写" : "拷"}  ${relative}`);
  }

  lines.push(
    "",
    "打开 Markdown 改正文即可。不要改 src/lib 或 JSON。",
    "有 dev server 的话刷新首页「文章」就能看到。",
  );

  console.log(lines.join("\n"));
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log(helpText());
    return;
  }

  const needsPrompt =
    !flags.title &&
    !flags.from &&
    !flags.slug &&
    process.stdin.isTTY &&
    process.stdout.isTTY;

  if (needsPrompt) {
    await promptMissing(flags);
  }

  if (!flags.title && !flags.from && !flags.help) {
    console.error(helpText());
    process.exitCode = 1;
    return;
  }

  const plan = planArticle({
    root: flags.root,
    title: flags.title,
    slug: flags.slug,
    category: flags.category,
    summary: flags.summary,
    date: flags.date,
    images: flags.images,
    cover: flags.cover,
    body: flags.body,
    "body-file": flags["body-file"],
    from: flags.from,
    force: Boolean(flags.force),
    allowEmpty: Boolean(flags["allow-empty"] || flags.allowEmpty),
  });

  applyPlan(plan, { dryRun: Boolean(flags["dry-run"] || flags.dryRun) });
  printPlan(plan, { dryRun: Boolean(flags["dry-run"] || flags.dryRun) });
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
