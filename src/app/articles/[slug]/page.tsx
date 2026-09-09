import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/ArticleBody";
import { getArticleDocument, getArticles } from "@/lib/articles";
import { site } from "@/content/site";

type Props = { params: Promise<{ slug: string }> };

function formatDate(value: string) {
  return value.replaceAll("-", ".");
}

export function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleDocument(slug);
  if (!article) return { title: "未找到文章" };

  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      url: `${site.url}/articles/${article.slug}/`,
      images: [{ url: article.cover }],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleDocument(slug);
  if (!article) notFound();

  const articles = getArticles();
  const index = articles.findIndex((item) => item.slug === article.slug);
  const newer = index > 0 ? articles[index - 1] : undefined;
  const older =
    index >= 0 && index < articles.length - 1 ? articles[index + 1] : undefined;

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-sm font-bold text-subtle">
        <Link href="/#articles" className="hover:text-foreground">
          ← 文章
        </Link>
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

      <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl border border-border bg-card paper-shadow">
        <Image
          src={article.cover}
          alt=""
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover"
          priority
        />
      </div>

      <ArticleBody content={article.content} />

      <nav className="mt-16 flex flex-wrap items-start justify-between gap-4 border-t border-border pt-8 text-sm font-bold">
        {newer ? (
          <Link
            href={`/articles/${newer.slug}`}
            className="max-w-[46%] text-accent hover:underline"
          >
            ← {newer.title}
          </Link>
        ) : (
          <span />
        )}
        {older ? (
          <Link
            href={`/articles/${older.slug}`}
            className="max-w-[46%] text-right text-accent hover:underline"
          >
            {older.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
