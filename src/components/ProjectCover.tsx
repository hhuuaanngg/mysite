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
        background: `linear-gradient(145deg, ${project.cover.from} 0%, ${project.cover.to} 100%)`,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(255 255 255 / 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="absolute -right-10 -bottom-16 h-56 w-56 rounded-full blur-3xl"
        style={{ background: project.cover.accent, opacity: 0.18 }}
      />
      <div className="absolute inset-0 flex items-end justify-between p-6 sm:p-8">
        <span
          className="font-mono text-5xl font-medium tracking-tight sm:text-6xl"
          style={{ color: project.cover.accent }}
        >
          {project.cover.mark}
        </span>
        <span className="font-mono text-xs tracking-widest text-white/45 uppercase">
          {project.year}
        </span>
      </div>
    </div>
  );
}
