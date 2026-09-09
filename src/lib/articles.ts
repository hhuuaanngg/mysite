import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import "server-only";
import type { Article, ArticleDocument } from "@/lib/article-types";

export type { Article, ArticleDocument };

const ARTICLES_DIR = path.join(process.cwd(), "src/content/articles");

function asString(value: unknown, field: string, file: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new Error(`${file} 缺少 frontmatter 字段 ${field}`);
}

function asDate(value: unknown, file: string): string {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    return asDate(new Date(value), file);
  }
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed.toISOString().slice(0, 10);
    }
    return trimmed;
  }
  throw new Error(`${file} 缺少有效的 date（YYYY-MM-DD）`);
}

function loadAll(): ArticleDocument[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];

  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((name) => name.endsWith(".md"));

  const documents = files.map((file) => {
    const slug = file.slice(0, -".md".length);
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8");
    const { data, content } = matter(raw);

    return {
      slug,
      title: asString(data.title, "title", file),
      date: asDate(data.date, file),
      category: asString(data.category, "category", file),
      summary: asString(data.summary, "summary", file),
      cover: asString(data.cover, "cover", file),
      content: content.trim(),
    };
  });

  return documents.sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return a.slug.localeCompare(b.slug);
  });
}

function getDocuments(): ArticleDocument[] {
  if (process.env.NODE_ENV === "development") {
    return loadAll();
  }
  return (globalThis.__mysiteArticles ??= loadAll());
}

declare global {
  var __mysiteArticles: ArticleDocument[] | undefined;
}

export function getArticles(): Article[] {
  return getDocuments().map((article) => ({
    slug: article.slug,
    title: article.title,
    date: article.date,
    category: article.category,
    summary: article.summary,
    cover: article.cover,
  }));
}

export function getArticleDocument(slug: string): ArticleDocument | undefined {
  return getDocuments().find((article) => article.slug === slug);
}
