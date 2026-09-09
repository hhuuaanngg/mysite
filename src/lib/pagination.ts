export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
} {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize) as T[],
    page: current,
    totalPages,
    total,
  };
}

export const WORK_PAGE_SIZE = 5;
export const ARTICLE_PAGE_SIZE = 6;
