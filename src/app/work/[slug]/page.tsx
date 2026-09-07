import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectCover } from "@/components/ProjectCover";
import { getProject, projects } from "@/content/projects";

type WorkPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
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
    <article className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="font-mono text-xs text-subtle">
        <Link href="/#work" className="hover:text-foreground">
          ← 作品
        </Link>
      </p>

      <header className="mt-8 max-w-3xl">
        <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
          {project.year}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {project.title}
        </h1>
        <p className="mt-4 max-w-[65ch] text-lg leading-8 text-muted">
          {project.summary}
        </p>
      </header>

      <div className="mt-10 overflow-hidden rounded-xl border border-border">
        <ProjectCover project={project} size="hero" />
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="max-w-[65ch] space-y-10">
          <section>
            <h2 className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
              问题
            </h2>
            <p className="mt-3 text-base leading-7 text-muted">{project.problem}</p>
          </section>
          <section>
            <h2 className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
              方案
            </h2>
            <p className="mt-3 text-base leading-7 text-muted">
              {project.solution}
            </p>
          </section>
          <section>
            <h2 className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
              技术要点
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-muted">
              {project.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-card p-5">
          <h2 className="font-mono text-xs tracking-[0.18em] text-subtle uppercase">
            链接与栈
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
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
                className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-subtle"
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
