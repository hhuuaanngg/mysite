"use client";

import { Pagination } from "@/components/Pagination";
import { WorkCard } from "@/components/WorkCard";
import { getProjectsInDisplayOrder } from "@/content/projects";
import { WORK_PAGE_SIZE, paginate } from "@/lib/pagination";

export function WorkGrid({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (page: number) => void;
}) {
  const all = getProjectsInDisplayOrder();
  const { items, totalPages } = paginate(all, page, WORK_PAGE_SIZE);
  const featured = items[0];
  const others = items.slice(1);

  function goTo(next: number) {
    onPageChange(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById("work")
      ?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {featured ? <WorkCard project={featured} featured /> : null}
        {others.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {others.map((project) => (
              <WorkCard key={project.slug} project={project} />
            ))}
          </div>
        ) : null}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={goTo}
        label="作品分页"
      />
    </>
  );
}
