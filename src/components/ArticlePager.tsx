import type { Article } from "@/lib/article-types";

export function ArticlePager({
  newer,
  older,
}: {
  newer?: Article;
  older?: Article;
}) {
  return (
    <nav className="mt-16 flex flex-wrap items-start justify-between gap-4 border-t border-border pt-8 text-sm font-bold">
      {newer ? (
        <a
          href={`/articles/${newer.slug}/`}
          className="max-w-[46%] text-accent hover:underline"
        >
          ← {newer.title}
        </a>
      ) : (
        <span />
      )}
      {older ? (
        <a
          href={`/articles/${older.slug}/`}
          className="max-w-[46%] text-right text-accent hover:underline"
        >
          {older.title} →
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}
