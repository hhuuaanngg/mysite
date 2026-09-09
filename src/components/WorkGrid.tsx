"use client";

import { useState } from "react";
import { Pagination } from "@/components/Pagination";
import { SectionHeading } from "@/components/SectionHeading";
import { WorkCard } from "@/components/WorkCard";
import { getProjectsInDisplayOrder } from "@/content/projects";
import { WORK_PAGE_SIZE, paginate } from "@/lib/pagination";

export function WorkGrid() {
  const [page, setPage] = useState(1);
  const all = getProjectsInDisplayOrder();
  const { items, totalPages } = paginate(all, page, WORK_PAGE_SIZE);
  const featured = items[0];
  const others = items.slice(1);

  function goTo(next: number) {
    setPage(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById("work")
      ?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section id="work" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading
          eyebrow="01 / 作品"
          title="精选项目"
          description="先看能跑起来的东西。每条都写清做了什么、解决什么。"
        />

        <div className="mt-10 flex flex-col gap-5">
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
      </div>
    </section>
  );
}
