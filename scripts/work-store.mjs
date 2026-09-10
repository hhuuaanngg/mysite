import fs from "node:fs";
import path from "node:path";
import { assertSlug, slugify } from "./article-store.mjs";

const COLOR = /^#[0-9a-fA-F]{6}$/;
const HTTP = /^https?:\/\/.+/i;

function worksDir(root) {
  return path.join(root, "src/content/works");
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

function workPath(root, slug) {
  return path.join(worksDir(root), `${slug}.json`);
}

function parseWorkFile(file) {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const slug = asString(raw.slug) || path.basename(file, ".json");
  return normalizeWork({ ...raw, slug });
}

function normalizeWork(input) {
  const slug = asString(input.slug);
  assertSlug(slug);
  const title = asString(input.title);
  const year = asString(input.year);
  const summary = asString(input.summary);
  const problem = asString(input.problem);
  const solution = asString(input.solution);
  const highlights = asLines(input.highlights);
  const stack = asTags(input.stack);
  const cover = input.cover && typeof input.cover === "object" ? input.cover : {};
  const mark = asString(cover.mark);
  const missing = [];
  if (!title) missing.push("标题");
  if (!year) missing.push("年份");
  if (!summary) missing.push("摘要");
  if (!problem) missing.push("问题");
  if (!solution) missing.push("方案");
  if (highlights.length === 0) missing.push("要点");
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
    problem,
    solution,
    highlights,
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
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => parseWorkFile(path.join(dir, name)))
    .sort(compareWorks);
}

export function readWork(root, slug) {
  assertSlug(slug);
  const file = workPath(root, slug);
  if (!fs.existsSync(file)) return null;
  return parseWorkFile(file);
}

function nextOrder(root) {
  const works = listWorks(root);
  if (works.length === 0) return 0;
  return Math.max(...works.map((work) => work.order)) + 1;
}

function serializeWork(work) {
  const data = {
    slug: work.slug,
    title: work.title,
    year: work.year,
    order: work.order,
    summary: work.summary,
    problem: work.problem,
    solution: work.solution,
    highlights: work.highlights,
    stack: work.stack,
    cover: work.cover,
  };
  if (work.featured) data.featured = true;
  if (work.repo) data.repo = work.repo;
  if (work.url) data.url = work.url;
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function deleteWork(root, slug) {
  assertSlug(slug);
  const file = workPath(root, slug);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function saveWork(root, input) {
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

  const work = normalizeWork({
    ...input,
    slug,
    title,
    order,
  });

  const dir = worksDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const file = workPath(root, slug);
  fs.writeFileSync(file, serializeWork(work));

  if (previousSlug && previousSlug !== slug) {
    deleteWork(root, previousSlug);
  }

  return {
    ...work,
    preview: `/work/${slug}/`,
    files: [path.relative(root, file)],
  };
}
