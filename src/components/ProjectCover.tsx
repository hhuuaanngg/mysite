import Image from "next/image";
import type { Project } from "@/lib/project-types";

export function ProjectCover({
  project,
  size = "default",
}: {
  project: Project;
  size?: "default" | "hero";
}) {
  const height = size === "hero" ? "h-56 sm:h-72 md:h-80" : "h-44 sm:h-52";

  if (project.cover.image) {
    return (
      <div className={`relative overflow-hidden ${height}`}>
        <Image
          src={project.cover.image}
          alt=""
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover"
        />
        <span className="absolute right-6 bottom-6 rounded-full bg-card/80 px-2.5 py-0.5 font-mono text-xs tracking-widest text-muted uppercase sm:right-8 sm:bottom-8">
          {project.year}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${height}`}
      style={{
        background: `linear-gradient(155deg, ${project.cover.from} 0%, ${project.cover.to} 100%)`,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(55 53 47 / 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgb(55 53 47 / 0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="absolute -right-8 -top-10 h-40 w-40 rounded-full"
        style={{ background: project.cover.accent, opacity: 0.22 }}
      />
      <div className="absolute inset-0 flex items-end justify-between p-6 sm:p-8">
        <span
          className="text-5xl font-extrabold tracking-tight sm:text-6xl"
          style={{ color: project.cover.accent }}
        >
          {project.cover.mark}
        </span>
        <span className="rounded-full bg-card/80 px-2.5 py-0.5 font-mono text-xs tracking-widest text-muted uppercase">
          {project.year}
        </span>
      </div>
    </div>
  );
}
