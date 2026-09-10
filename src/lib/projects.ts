import fs from "node:fs";
import path from "node:path";
import "server-only";
import type { Project, ProjectCover } from "@/lib/project-types";

export type { Project, ProjectCover };

const WORKS_DIR = path.join(process.cwd(), "src/content/works");
const COLOR = /^#[0-9a-fA-F]{6}$/;

function asString(value: unknown, field: string, file: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
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
  return {
    mark: asString(cover.mark, "cover.mark", file),
    from: asColor(cover.from, "cover.from", file),
    to: asColor(cover.to, "cover.to", file),
    accent: asColor(cover.accent, "cover.accent", file),
  };
}

function loadAll(): Project[] {
  if (!fs.existsSync(WORKS_DIR)) return [];

  const files = fs.readdirSync(WORKS_DIR).filter((name) => name.endsWith(".json"));

  const projects = files.map((file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(WORKS_DIR, file), "utf8")) as Record<
      string,
      unknown
    >;
    const slug = asString(raw.slug ?? file.slice(0, -".json".length), "slug", file);
    const repo = asOptionalString(raw.repo);
    const url = asOptionalString(raw.url);
    const project: Project = {
      slug,
      title: asString(raw.title, "title", file),
      year: asString(raw.year, "year", file),
      order: asOrder(raw.order, file),
      summary: asString(raw.summary, "summary", file),
      problem: asString(raw.problem, "problem", file),
      solution: asString(raw.solution, "solution", file),
      highlights: asStringList(raw.highlights, "highlights", file),
      stack: asStringList(raw.stack, "stack", file),
      featured: raw.featured === true,
      cover: asCover(raw.cover, file),
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

function getAll(): Project[] {
  if (process.env.NODE_ENV === "development") {
    return loadAll();
  }
  return (globalThis.__mysiteProjects ??= loadAll());
}

declare global {
  var __mysiteProjects: Project[] | undefined;
}

export function getProjects(): Project[] {
  return getAll();
}

export function getProject(slug: string): Project | undefined {
  return getAll().find((project) => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return getAll().filter((project) => project.featured);
}

export function getOtherProjects(): Project[] {
  return getAll().filter((project) => !project.featured);
}

export function getProjectsInDisplayOrder(): Project[] {
  return getAll();
}
