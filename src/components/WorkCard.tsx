import Link from "next/link";
import { ProjectCover } from "@/components/ProjectCover";
import type { Project } from "@/content/projects";

export function WorkCard({
  project,
  featured = false,
}: {
  project: Project;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-card-hover"
    >
      <ProjectCover project={project} size={featured ? "hero" : "default"} />
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-medium tracking-tight text-foreground group-hover:text-accent">
            {project.title}
          </h3>
          <span className="shrink-0 font-mono text-xs text-subtle">
            {project.year}
          </span>
        </div>
        <p className="max-w-[65ch] text-sm leading-6 text-muted">
          {project.summary}
        </p>
        <ul className="flex flex-wrap gap-2">
          {project.stack.slice(0, featured ? 5 : 3).map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-subtle"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
