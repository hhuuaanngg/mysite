import Link from "next/link";
import { NotionFace } from "@/components/Doodles";
import { site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm font-semibold text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="inline-flex items-center gap-2">
          <NotionFace className="h-5 w-5" />
          © {new Date().getFullYear()} {site.name}
        </p>
        <div className="flex gap-5">
          <Link href="/#work" className="hover:text-foreground">
            作品
          </Link>
          <a
            href={site.blog.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            博客
          </a>
          <a
            href={site.github.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
