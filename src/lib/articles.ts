import { getCollection, type CollectionEntry } from "astro:content";
import type { Article } from "./article-types";

export function toArticle(entry: CollectionEntry<"articles">): Article {
  return { ...entry.data, slug: entry.id };
}

export async function getArticles(): Promise<Article[]> {
  return (await getCollection("articles"))
    .map(toArticle)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
