import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

export type TocItem = {
  depth: 1 | 2 | 3;
  text: string;
  id: string;
};

type MarkdownNode = {
  type: string;
  depth?: number;
  value?: string;
  alt?: string | null;
  children?: MarkdownNode[];
  data?: { hProperties?: Record<string, unknown> };
};

const parser = unified().use(remarkParse).use(remarkGfm);

function headingText(node: MarkdownNode): string {
  if (node.type === "html") return "";
  if (node.type === "image" || node.type === "imageReference") return node.alt ?? "";
  return node.value ?? node.children?.map(headingText).join("") ?? "";
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

function collectHeadings(tree: MarkdownNode): TocItem[] {
  const items: TocItem[] = [];
  const used = new Set<string>();

  function visit(node: MarkdownNode) {
    if (node.type === "heading" && node.depth && node.depth <= 3) {
      const text = headingText(node).trim();
      const base = headingAnchor(text);
      let id = base;
      let suffix = 1;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);
      node.data = {
        ...node.data,
        hProperties: { ...node.data?.hProperties, id },
      };
      items.push({ depth: node.depth as 1 | 2 | 3, text: text || "无标题", id });
    }
    node.children?.forEach(visit);
  }

  visit(tree);
  return items;
}

export function extractMarkdownToc(markdown: string): TocItem[] {
  return collectHeadings(parser.parse(markdown));
}

// Apply the same IDs to the actual rendering tree, including nested headings.
export function remarkHeadingIds() {
  return (tree: MarkdownNode) => { collectHeadings(tree); };
}
