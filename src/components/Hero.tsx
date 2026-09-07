import Link from "next/link";
import { site } from "@/content/site";

export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto flex max-w-5xl flex-col px-5 py-20 sm:px-8 sm:py-28 md:py-32">
        <p className="fade-up font-mono text-xs tracking-[0.18em] text-accent uppercase">
          {site.shortName}.me · {site.title}
        </p>
        <h1 className="fade-up mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {site.name}
        </h1>
        <p
          className="fade-up mt-6 max-w-[38rem] text-lg leading-8 text-muted"
          style={{ animationDelay: "80ms" }}
        >
          {site.tagline}
          <br />
          先看作品，再看技术栈。
        </p>
        <div
          className="fade-up mt-10 flex flex-wrap gap-3"
          style={{ animationDelay: "140ms" }}
        >
          <Link
            href="/#work"
            className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            看作品
          </Link>
          <Link
            href="/#contact"
            className="inline-flex h-11 items-center rounded-lg border border-border bg-transparent px-5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-card"
          >
            联系
          </Link>
        </div>
      </div>
    </section>
  );
}
