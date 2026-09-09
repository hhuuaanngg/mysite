"use client";

import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { getArticles } from "@/content/articles";
import { ARTICLE_PAGE_SIZE, paginate } from "@/lib/pagination";

export function ArticleList({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (page: number) => void;
}) {
  const { items, totalPages } = paginate(getArticles(), page, ARTICLE_PAGE_SIZE);

  function goTo(next: number) {
    onPageChange(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("articles")?.scrollIntoView({
      block: "start",
      behavior: reduce ? "auto" : "smooth",
    });
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={goTo}
        label="文章分页"
      />
    </>
  );
}
