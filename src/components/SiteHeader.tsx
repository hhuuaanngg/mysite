"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NotionFace } from "@/components/Doodles";
import { nav, site } from "@/content/site";

export function SiteHeader({ studioHref }: { studioHref?: string }) {
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const updateFrost = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / 160));
      headerRef.current?.style.setProperty("--header-progress", String(progress));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateFrost);
    };
    updateFrost();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
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

  return (
    <header
      ref={headerRef}
      data-menu-open={open}
      className="site-header sticky top-0 z-50 border-b"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:h-16 sm:px-8">
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
          className="border-t border-border bg-background/95 px-5 py-3 md:hidden"
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
  );
}
