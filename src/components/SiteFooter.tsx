import Link from "next/link";
import { NotionFace } from "@/components/Doodles";
import { site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm font-semibold text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="inline-flex items-center gap-2">
          <NotionFace className="h-5 w-5" />
          © {new Date().getFullYear()} {site.name}
        </p>
        <div className="flex flex-wrap gap-5">
          <Link href="/#work" className="hover:text-foreground">
            作品
          </Link>
          <Link href="/#articles" className="hover:text-foreground">
            文章
          </Link>
          <Link href="/#about" className="hover:text-foreground">
            关于
          </Link>
          <Link href="/#contact" className="hover:text-foreground">
            联系
          </Link>
        </div>
      </div>
    </footer>
  );
}
