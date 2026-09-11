import type { MarkdownHeading } from "astro";

export type TocItem = { depth: 1 | 2 | 3; text: string; id: string };

// Consume headings collected by Astro's render(), without parsing the body twice.
export function toTableOfContents(headings: MarkdownHeading[]): TocItem[] {
  return headings.filter((heading) => heading.depth <= 3).map((heading) => ({
    depth: heading.depth as 1 | 2 | 3,
    text: heading.text.trim() || "无标题",
    id: heading.slug,
  }));
}
