import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { getArticles } from "@/lib/articles";
import { getProjects } from "@/lib/projects";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${site.url}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...getProjects().map((project) => ({
      url: `${site.url}/work/${project.slug}/`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...getArticles().map((article) => ({
      url: `${site.url}/articles/${article.slug}/`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
