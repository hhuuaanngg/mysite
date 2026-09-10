import type { TocItem } from "@/lib/markdown-toc";

export function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav
      className="h-fit rounded-3xl border border-border bg-card p-5 paper-shadow md:sticky md:top-24"
      aria-label="目录"
    >
      <h2 className="text-xs font-extrabold tracking-wide text-subtle uppercase">
        目录
      </h2>
      <ol className="mt-4 space-y-2 text-sm font-bold">
        {items.map((item) => (
          <li
            key={item.id}
            className={
              item.depth === 1 ? "" : item.depth === 2 ? "pl-3" : "pl-6"
            }
          >
            <a
              href={`#${item.id}`}
              className="block leading-6 text-muted hover:text-accent"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
