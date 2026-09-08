import type { Project } from "@/content/projects";

export function ProjectCover({
  project,
  size = "default",
}: {
  project: Project;
  size?: "default" | "hero";
}) {
  const height = size === "hero" ? "h-56 sm:h-72 md:h-80" : "h-44 sm:h-52";

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
