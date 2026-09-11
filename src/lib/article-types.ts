import type { CollectionEntry } from "astro:content";

// Type-only imports keep the content layer out of hydrated React islands.
export type Article = CollectionEntry<"articles">["data"] & { slug: string };
