import Image from "next/image";
import type { Article } from "@/content/articles";

function formatDate(value: string) {
  return value.replaceAll("-", ".");
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      href={article.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full min-h-[9.5rem] flex-row overflow-hidden rounded-3xl border border-border bg-card paper-shadow transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="relative w-[7.25rem] shrink-0 self-stretch min-h-[9.5rem] sm:w-36 md:w-40">
        <Image
          src={article.cover}
          alt=""
          fill
          sizes="160px"
          className="object-cover"
        />
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
        <span className="text-sm font-bold text-accent">阅读全文 ↗</span>
      </div>
    </a>
  );
}
