export function Pagination({
  page,
  totalPages,
  onPageChange,
  label,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label={label}
    >
      <p className="w-full text-center text-xs font-semibold text-subtle" aria-live="polite">
        {label} · 第 {page} / {totalPages} 页
      </p>
      <button
        type="button"
        className="inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-bold text-muted disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        上一页
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          aria-current={item === page ? "page" : undefined}
          className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-bold ${
            item === page
              ? "bg-foreground text-accent-fg"
              : "border border-border bg-card text-muted hover:text-foreground"
          }`}
          onClick={() => onPageChange(item)}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        className="inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-bold text-muted disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        下一页
      </button>
    </nav>
  );
}
