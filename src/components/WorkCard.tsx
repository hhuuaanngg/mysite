import Link from "next/link";
import { ProjectCover } from "@/components/ProjectCover";
import type { Project } from "@/lib/project-types";

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
      className="group relative block overflow-hidden rounded-3xl border border-border bg-card paper-shadow transition-transform duration-200 hover:-translate-y-1"
    >
      <ProjectCover project={project} size={featured ? "hero" : "default"} />
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-extrabold tracking-tight text-foreground group-hover:text-accent">
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
              className="rounded-full border border-border bg-background px-2.5 py-0.5 font-mono text-[11px] text-subtle"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
