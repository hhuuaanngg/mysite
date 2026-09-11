import matter from "gray-matter";
import type { Article, ArticleDocument } from "@/lib/article-types";

export type { Article, ArticleDocument };

export { markdownStartsWithImage } from "@/lib/markdown-images";

const sources = import.meta.glob("../content/articles/*.md", { eager: true, query: "?raw", import: "default" }) as Record<string, string>;

function optionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

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
  const files = Object.keys(sources);

  const documents = files.map((file) => {
    const slug = file.split("/").pop()!.slice(0, -".md".length);
    const raw = sources[file];
    const { data, content } = matter(raw);

    return {
      slug,
      title: asString(data.title, "title", file),
      date: asDate(data.date, file),
      category: asString(data.category, "category", file),
      summary: asString(data.summary, "summary", file),
      cover: optionalString(data.cover),
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
  return loadAll();
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
