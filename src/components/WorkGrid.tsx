import { SectionHeading } from "@/components/SectionHeading";
import { WorkCard } from "@/components/WorkCard";
import { getFeaturedProjects, getOtherProjects } from "@/content/projects";

export function WorkGrid() {
  const featured = getFeaturedProjects();
  const others = getOtherProjects();

  return (
    <section id="work" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading
          eyebrow="01 / 作品"
          title="精选项目"
          description="先看能跑起来的东西。每条都写清做了什么、解决什么。"
        />

        <div className="mt-10 flex flex-col gap-5">
          {featured.map((project) => (
            <WorkCard key={project.slug} project={project} featured />
          ))}
          <div className="grid gap-5 md:grid-cols-2">
            {others.map((project) => (
              <WorkCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
