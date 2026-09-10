export function markdownStartsWithImage(content: string) {
  return /^!\[[^\]]*\]\([^)]+\)/.test(content.trim());
}

export function firstMarkdownImageSrc(markdown: string) {
  const match = /!\[[^\]]*\]\(([^)]+)\)/.exec(markdown);
  const src = match?.[1]?.trim();
  if (!src) return undefined;
  if (src.startsWith("/works/") || src.startsWith("/articles/")) return src;
  return undefined;
}
