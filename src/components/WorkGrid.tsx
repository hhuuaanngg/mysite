"use client";

import { useState } from "react";
import { Pagination } from "@/components/Pagination";
import { WorkCard } from "@/components/WorkCard";
import { WORK_PAGE_SIZE, paginate } from "@/lib/pagination";
import type { Project } from "@/lib/project-types";

export function WorkGrid({
  projects,
}: {
  projects: Project[];
}) {
  const [requestedPage, setPage] = useState(1);
  const { items, page, totalPages } = paginate(projects, requestedPage, WORK_PAGE_SIZE);
  const featured = page === 1 ? items[0] : undefined;
  const others = featured ? items.slice(1) : items;

  function goTo(next: number) {
    setPage(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById("showcase-heading")
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
