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
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card paper-shadow transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="relative h-44 overflow-hidden sm:h-48">
        <Image
          src={article.cover}
          alt=""
          width={960}
          height={640}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-full bg-yellow px-2.5 py-0.5 text-foreground">
            {article.category}
          </span>
          <time className="font-mono text-subtle" dateTime={article.date}>
            {formatDate(article.date)}
          </time>
        </div>
        <h3 className="text-lg font-extrabold tracking-tight text-foreground group-hover:text-accent">
          {article.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-6 text-muted">
          {article.summary}
        </p>
        <span className="mt-auto text-sm font-bold text-accent">阅读全文 ↗</span>
      </div>
    </a>
  );
}
