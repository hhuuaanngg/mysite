import type { CollectionEntry } from "astro:content";

export type Project = Omit<CollectionEntry<"works">["data"], "slug"> & { slug: string };
export type ProjectCover = Project["cover"];
