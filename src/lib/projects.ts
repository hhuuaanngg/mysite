import { getCollection, type CollectionEntry } from "astro:content";
import { firstMarkdownImageSrc } from "./markdown-images";
import type { Project } from "./project-types";

export function toProject(entry: CollectionEntry<"works">): Project {
  const cover = { ...entry.data.cover };
  if (!cover.image) cover.image = firstMarkdownImageSrc(entry.body ?? "");
  return { ...entry.data, slug: entry.id, cover };
}

export async function getProjects(): Promise<Project[]> {
  return (await getCollection("works")).map(toProject).sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.order - b.order || a.slug.localeCompare(b.slug);
  });
}
