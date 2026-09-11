import { site } from "@/content/site";
import { getArticles } from "@/lib/articles";
import { getProjects } from "@/lib/projects";

const escapeXml = (value: string) => value.replace(/[<>&"']/g, (char) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
})[char]!);

export function GET() {
  const modified = new Date().toISOString();
  const routes = [
    { path: "/", priority: 1 },
    ...getProjects().map(({ slug }) => ({ path: `/work/${slug}/`, priority: 0.8 })),
    ...getArticles().map(({ slug }) => ({ path: `/articles/${slug}/`, priority: 0.7 })),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(({ path, priority }) => `<url><loc>${escapeXml(new URL(path, site.url).href)}</loc><lastmod>${modified}</lastmod><changefreq>monthly</changefreq><priority>${priority}</priority></url>`).join("")}</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
