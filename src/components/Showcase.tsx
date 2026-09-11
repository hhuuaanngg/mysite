import { useEffect, useState } from "react";
import { ArticleList } from "@/components/ArticleList";
import { WorkGrid } from "@/components/WorkGrid";
import type { Article } from "@/lib/article-types";
import type { Project } from "@/lib/project-types";

type Tab = "work" | "articles";

const tabs = [
  { id: "work" as const, label: "作品" },
  { id: "articles" as const, label: "文章" },
];

const copy = {
  work: {
    title: "精选项目",
    description: "先看能跑起来的东西。每条都写清做了什么、解决什么。",
  },
  articles: {
    title: "最近在写",
    description: "摄影、生活和做过的主题。全文都在这个站上。",
  },
} as const;

function tabFromHash(hash: string): Tab | null {
  if (hash === "#articles") return "articles";
  if (hash === "#work") return "work";
  return null;
}

export function Showcase({
  articles,
  projects,
}: {
  articles: Article[];
  projects: Project[];
}) {
  const [tab, setTab] = useState<Tab>("work");

  useEffect(() => {
    let scrollFrame = 0;
    const scrollToHeading = () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById("showcase-heading")?.scrollIntoView({
          block: "start",
          behavior: reduce ? "auto" : "smooth",
        });
      });
    };
    const apply = () => {
      const next = tabFromHash(window.location.hash);
      if (next) {
        setTab(next);
        scrollToHeading();
      }
    };

    apply();
    window.addEventListener("hashchange", apply);

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target || target.hasAttribute("download") || (target.target && target.target !== "_self")) return;
      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || url.search !== window.location.search) return;
      const next = tabFromHash(url.hash);
      if (!next) return;

      // Handle same-page navigation here, including repeated clicks on the current hash.
      event.preventDefault();
      setTab(next);
      if (window.location.hash !== url.hash) {
        history.replaceState(null, "", url.hash);
      }
      scrollToHeading();
    };

    document.addEventListener("click", onClick, true);
    return () => {
      window.cancelAnimationFrame(scrollFrame);
      window.removeEventListener("hashchange", apply);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  function select(next: Tab) {
    setTab(next);
    const hash = next === "articles" ? "#articles" : "#work";
    if (window.location.hash !== hash) {
      history.replaceState(null, "", hash);
    }
  }

  const current = copy[tab];

  return (
    <section className="relative scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div id="showcase-heading" className="relative max-w-2xl">
            <span id="work" aria-hidden="true" className="absolute top-0 h-px w-px" />
            <span id="articles" aria-hidden="true" className="absolute top-0 h-px w-px" />
            <p className="inline-flex items-center rounded-full bg-yellow px-2.5 py-0.5 text-xs font-extrabold tracking-wide text-foreground">
              01 / 精选
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {current.title}
            </h2>
            <p className="mt-3 max-w-[65ch] text-base leading-7 text-muted">
              {current.description}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="作品和文章"
            className="inline-flex w-fit shrink-0 rounded-full border border-border bg-card p-1 paper-shadow"
          >
            {tabs.map((item) => {
              const selected = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${item.id}`}
                  tabIndex={selected ? 0 : -1}
                  className={`inline-flex h-10 min-w-20 items-center justify-center rounded-full px-5 text-sm font-bold transition-colors ${
                    selected
                      ? "bg-foreground text-accent-fg"
                      : "text-muted hover:text-foreground"
                  }`}
                  onClick={() => select(item.id)}
                  onKeyDown={(event) => {
                    if (
                      event.key !== "ArrowRight" &&
                      event.key !== "ArrowLeft"
                    ) {
                      return;
                    }
                    event.preventDefault();
                    const next = item.id === "work" ? "articles" : "work";
                    select(next);
                    window.requestAnimationFrame(() => {
                      document.getElementById(`tab-${next}`)?.focus();
                    });
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keep both lists mounted so each retains its own pagination. */}
        <div
          role="tabpanel"
          id="panel-work"
          aria-labelledby="tab-work"
          hidden={tab !== "work"}
          className="mt-10"
        >
          <WorkGrid projects={projects} />
        </div>
        <div
          role="tabpanel"
          id="panel-articles"
          aria-labelledby="tab-articles"
          hidden={tab !== "articles"}
          className="mt-10"
        >
          <ArticleList articles={articles} />
        </div>
      </div>
    </section>
  );
}
