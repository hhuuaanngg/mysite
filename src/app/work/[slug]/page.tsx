import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/ArticleBody";
import { ProjectCover } from "@/components/ProjectCover";
import { getProject, getProjects } from "@/lib/projects";

type WorkPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: WorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return { title: "未找到项目" };
  }

  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      type: "article",
    },
  };
}

export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-sm font-bold text-subtle">
        <Link href="/#work" className="hover:text-foreground">
          ← 作品
        </Link>
      </p>

      <header className="mt-8 max-w-3xl">
        <p className="inline-flex items-center rounded-full bg-yellow px-2.5 py-0.5 text-xs font-extrabold tracking-wide">
          {project.year}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {project.title}
        </h1>
        <p className="mt-4 max-w-[65ch] text-lg leading-8 text-muted">
          {project.summary}
        </p>
      </header>

      <div className="mt-10 overflow-hidden rounded-3xl border border-border paper-shadow">
        <ProjectCover project={project} size="hero" />
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-[minmax(0,1fr)_16rem]">
        <ArticleBody
          content={project.content}
          className="space-y-6"
          heading="pill"
          empty="这个项目介绍还在整理中。"
        />

        <aside className="h-fit rounded-3xl border border-border bg-card p-5 paper-shadow">
          <h2 className="text-xs font-extrabold tracking-wide text-subtle uppercase">
            链接与栈
          </h2>
          <ul className="mt-4 space-y-3 text-sm font-bold">
            {project.repo ? (
              <li>
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  GitHub ↗
                </a>
              </li>
            ) : null}
            {project.url ? (
              <li>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  线上 ↗
                </a>
              </li>
            ) : null}
          </ul>
          <ul className="mt-6 flex flex-wrap gap-2">
            {project.stack.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-border bg-background px-2.5 py-0.5 font-mono text-[11px] text-subtle"
              >
                {tag}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </article>
  );
}
