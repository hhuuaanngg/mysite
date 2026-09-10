export type TocItem = {
  depth: 1 | 2 | 3;
  text: string;
  id: string;
};

function headingText(raw: string) {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/<\/?[^>]+>/g, "")
    .trim();
}

export function headingAnchor(text: string) {
  const ascii = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return ascii || "section";
}

export function extractMarkdownToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const used = new Map<string, number>();
  let inFence = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const text = headingText(match[2]);
    if (!text) continue;

    let id = headingAnchor(text);
    const seen = used.get(id) ?? 0;
    used.set(id, seen + 1);
    if (seen > 0) id = `${id}-${seen}`;

    items.push({
      depth: match[1].length as 1 | 2 | 3,
      text,
      id,
    });
  }

  return items;
}
