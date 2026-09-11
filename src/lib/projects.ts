import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import "server-only";
import { firstMarkdownImageSrc } from "@/lib/markdown-images";
import type { Project, ProjectCover, ProjectDocument } from "@/lib/project-types";

export type { Project, ProjectCover, ProjectDocument };

const WORKS_DIR = path.join(process.cwd(), "src/content/works");
const COLOR = /^#[0-9a-fA-F]{6}$/;

function asString(value: unknown, field: string, file: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  throw new Error(`${file} 缺少字段 ${field}`);
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

function asStringList(value: unknown, field: string, file: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${file} 缺少字段 ${field}`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      throw new Error(`${file} 的 ${field}[${index}] 必须是非空字符串`);
    }
    return item.trim();
  });
}

function asColor(value: unknown, field: string, file: string): string {
  const color = asString(value, field, file);
  if (!COLOR.test(color)) {
    throw new Error(`${file} 的 ${field} 必须是 #RRGGBB`);
  }
  return color.toLowerCase();
}

function asOrder(value: unknown, file: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  throw new Error(`${file} 缺少有效的 order`);
}

function asCover(value: unknown, file: string): ProjectCover {
  if (!value || typeof value !== "object") {
    throw new Error(`${file} 缺少 cover`);
  }
  const cover = value as Record<string, unknown>;
  const image =
    typeof cover.image === "string" && cover.image.trim()
      ? cover.image.trim()
      : undefined;
  return {
    mark: asString(cover.mark, "cover.mark", file),
    from: asColor(cover.from, "cover.from", file),
    to: asColor(cover.to, "cover.to", file),
    accent: asColor(cover.accent, "cover.accent", file),
    ...(image ? { image } : {}),
  };
}

function toProject(doc: ProjectDocument): Project {
  const { content, ...project } = doc;
  void content;
  return project;
}

function loadAll(): ProjectDocument[] {
  if (!fs.existsSync(WORKS_DIR)) return [];

  const files = fs.readdirSync(WORKS_DIR).filter((name) => name.endsWith(".md"));

  const projects = files.map((file) => {
    const parsed = matter(fs.readFileSync(path.join(WORKS_DIR, file), "utf8"));
    const data = parsed.data as Record<string, unknown>;
    const slug = asString(data.slug ?? file.slice(0, -".md".length), "slug", file);
    const repo = asOptionalString(data.repo);
    const url = asOptionalString(data.url);
    const content = parsed.content.trim();
    const cover = asCover(data.cover, file);
    if (!cover.image) {
      const fromBody = firstMarkdownImageSrc(content);
      if (fromBody) cover.image = fromBody;
    }
    const project: ProjectDocument = {
      slug,
      title: asString(data.title, "title", file),
      year: asString(data.year, "year", file),
      order: asOrder(data.order, file),
      summary: asString(data.summary, "summary", file),
      content,
      stack: asStringList(data.stack, "stack", file),
      featured: data.featured === true,
      cover,
    };
    if (repo) project.repo = repo;
    if (url) project.url = url;
    return project;
  });

  return projects.sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
    if (a.order !== b.order) return a.order - b.order;
    return a.slug.localeCompare(b.slug);
  });
}

function getAll(): ProjectDocument[] {
  if (process.env.NODE_ENV === "development") {
    return loadAll();
  }
  return (globalThis.__mysiteProjects ??= loadAll());
}

declare global {
  var __mysiteProjects: ProjectDocument[] | undefined;
}

export function getProjects(): Project[] {
  return getAll().map(toProject);
}

export function getProject(slug: string): ProjectDocument | undefined {
  return getAll().find((project) => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return getAll().filter((project) => project.featured).map(toProject);
}

export function getOtherProjects(): Project[] {
  return getAll().filter((project) => !project.featured).map(toProject);
}

export function getProjectsInDisplayOrder(): Project[] {
  return getProjects();
}
