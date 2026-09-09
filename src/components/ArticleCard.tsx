import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/article-types";

function formatDate(value: string) {
  return value.replaceAll("-", ".");
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex h-full min-h-[9.5rem] flex-row overflow-hidden rounded-3xl border border-border bg-card paper-shadow transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="relative w-[7.25rem] min-h-[9.5rem] shrink-0 self-stretch sm:w-36 md:w-40">
        {article.cover ? (
          <Image
            src={article.cover}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-yellow px-3 text-center text-xs font-extrabold">
            {article.category}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-full bg-yellow px-2.5 py-0.5 text-foreground">
            {article.category}
          </span>
          <time className="font-mono text-subtle" dateTime={article.date}>
            {formatDate(article.date)}
          </time>
        </div>
        <h3 className="text-base font-extrabold leading-snug tracking-tight text-foreground group-hover:text-accent sm:text-lg">
          {article.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-6 text-muted">
          {article.summary}
        </p>
        <span className="text-sm font-bold text-accent">阅读全文</span>
      </div>
    </Link>
  );
}
