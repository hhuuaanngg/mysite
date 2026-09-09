"use client";

import { useState } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { SectionHeading } from "@/components/SectionHeading";
import { getArticles } from "@/content/articles";
import { ARTICLE_PAGE_SIZE, paginate } from "@/lib/pagination";

export function ArticleList() {
  const [page, setPage] = useState(1);
  const { items, totalPages } = paginate(getArticles(), page, ARTICLE_PAGE_SIZE);

  function goTo(next: number) {
    setPage(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById("articles")
      ?.scrollIntoView({
        block: "start",
        behavior: reduce ? "auto" : "smooth",
      });
  }

  return (
    <section id="articles" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading
          eyebrow="02 / 文章"
          title="最近在写"
          description="摄影、生活和做过的主题。点进去是全文，仍在 blog.hjy.me。"
        />
        <div className="mt-10 flex flex-col gap-5">
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
      </div>
    </section>
  );
}
