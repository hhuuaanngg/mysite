"use client";

import { useState } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import type { Article } from "@/lib/article-types";
import { ARTICLE_PAGE_SIZE, paginate } from "@/lib/pagination";

export function ArticleList({
  articles,
}: {
  articles: Article[];
}) {
  const [requestedPage, setPage] = useState(1);
  const { items, page, totalPages } = paginate(articles, requestedPage, ARTICLE_PAGE_SIZE);

  function goTo(next: number) {
    setPage(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("showcase-heading")?.scrollIntoView({
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
