import articleBlocks from "@/content/article-blocks.json";
import type { ArticleBlock } from "@/content/articles";

export function getArticleBlocks(slug: string) {
  const blocks = (articleBlocks as Record<string, ArticleBlock[]>)[slug];
  return blocks ?? [];
}
