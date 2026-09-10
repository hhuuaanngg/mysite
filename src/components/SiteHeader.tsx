"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { NotionFace } from "@/components/Doodles";
import { nav, site } from "@/content/site";

const FROST_RANGE = 160;

function frostProgress(scrollY: number, menuOpen: boolean) {
  return menuOpen ? 1 : Math.min(1, Math.max(0, scrollY / FROST_RANGE));
}

function frostPaneStyle(progress: number): CSSProperties {
  const blur = 22 * progress;
  const tint = 0.55 * progress;
  const sat = 100 + 80 * progress;
  const filter = `blur(${blur.toFixed(2)}px) saturate(${sat.toFixed(0)}%)`;

  return {
    backgroundColor: `rgba(247, 246, 243, ${tint.toFixed(3)})`,
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    borderBottomColor: `rgba(227, 226, 222, ${(0.95 * progress).toFixed(3)})`,
  };
}

export function SiteHeader({ studioHref }: { studioHref?: string }) {
  const [scrollY, setScrollY] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      setScrollY(
        window.scrollY ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0,
      );
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const progress = frostProgress(scrollY, open);

  return (
    <>
      <header className="site-header fixed inset-x-0 top-0 z-50">
        <div
          className="site-header-frost"
          style={frostPaneStyle(progress)}
          data-frosted={progress > 0.04 ? "true" : "false"}
          aria-hidden
        />
        <div className="site-header-bar mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:h-16 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-extrabold tracking-tight text-foreground"
          >
            <NotionFace className="h-7 w-7" />
            {site.shortName}
          </Link>

          <nav
            className="hidden items-center gap-1 text-sm font-semibold text-muted md:flex"
            aria-label="主导航"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-card hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            {studioHref ? (
              <a
                href={studioHref}
                className="ml-1 rounded-full bg-yellow px-3 py-1.5 text-sm font-extrabold text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                写内容
              </a>
            ) : null}
          </nav>

          <button
            type="button"
            className="inline-flex h-9 items-center rounded-full border border-border bg-card px-3 text-sm font-semibold text-muted md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "关闭" : "菜单"}
          </button>
        </div>

        {open ? (
          <nav
            id="mobile-nav"
            className="site-header-bar border-t border-border px-5 py-3 md:hidden"
            aria-label="移动导航"
          >
            <ul className="flex flex-col gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-xl px-2 py-2 text-sm font-semibold text-muted hover:bg-card hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {studioHref ? (
                <li>
                  <a
                    href={studioHref}
                    className="block rounded-xl px-2 py-2 text-sm font-extrabold text-foreground"
                    target="_blank"
                    rel="noreferrer"
                  >
                    写内容
                  </a>
                </li>
              ) : null}
            </ul>
          </nav>
        ) : null}
      </header>
      <div className="h-14 shrink-0 sm:h-16" aria-hidden />
    </>
  );
}
