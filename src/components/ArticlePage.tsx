import { SiteImage as Image } from "@/components/SiteImage";
import { ArticleBody } from "@/components/ArticleBody";
import { TableOfContents } from "@/components/TableOfContents";
import type { Article } from "@/lib/article-types";
import { markdownStartsWithImage } from "@/lib/markdown-images";
import type { ArticleDocument } from "@/lib/article-types";
import { extractMarkdownToc } from "@/lib/markdown-toc";


function formatDate(value: string) {
  return value.replaceAll("-", ".");
}

function ArticlePager({
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
          href={`/articles/${newer.slug}`}
          className="max-w-[46%] text-accent hover:underline"
        >
          ← {newer.title}
        </a>
      ) : (
        <span />
      )}
      {older ? (
        <a
          href={`/articles/${older.slug}`}
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

export function ArticlePage({ article, articles }: { article: ArticleDocument; articles: Article[] }) {
  const index = articles.findIndex((item) => item.slug === article.slug);
  const newer = index > 0 ? articles[index - 1] : undefined;
  const older =
    index >= 0 && index < articles.length - 1 ? articles[index + 1] : undefined;
  const toc = extractMarkdownToc(article.content);

  return (
    <article className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-sm font-bold text-subtle">
        <a href="/#articles" className="hover:text-foreground">
          ← 文章
        </a>
      </p>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="inline-flex items-center rounded-full bg-yellow px-2.5 py-0.5 tracking-wide text-foreground">
            {article.category}
          </span>
          <time className="font-mono text-subtle" dateTime={article.date}>
            {formatDate(article.date)}
          </time>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 max-w-[65ch] text-lg leading-8 text-muted">
          {article.summary}
        </p>
      </header>

      {article.cover && !markdownStartsWithImage(article.content) ? (
        <div className="relative mt-10 aspect-[16/9] max-w-3xl overflow-hidden rounded-3xl border border-border bg-card paper-shadow">
          <Image
            src={article.cover}
            alt=""
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      {toc.length > 0 ? (
        <div className="mt-10 grid gap-12 md:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <ArticleBody content={article.content} className="space-y-6" />
            <ArticlePager newer={newer} older={older} />
          </div>
          <TableOfContents items={toc} />
        </div>
      ) : (
        <div className="mt-10 max-w-3xl">
          <ArticleBody content={article.content} className="space-y-6" />
          <ArticlePager newer={newer} older={older} />
        </div>
      )}
    </article>
  );
}
