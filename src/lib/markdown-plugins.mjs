// Keep existing public heading anchors while Astro collects the final TOC.
export function remarkSiteContent() {
  return (tree) => {
    const headings = [];
    function headingText(node) {
      if (node.type === "html") return "";
      if (node.type === "image" || node.type === "imageReference") return node.alt ?? "";
      return node.value ?? node.children?.map(headingText).join("") ?? "";
    }
    function visit(node) {
      if (node.type === "heading") headings.push(node);
      node.children?.forEach(visit);
    }
    visit(tree);
    const used = new Set();
    // Preserve the original h1–h3 sequence; deeper headings must not steal an ID.
    for (const node of [...headings.filter((h) => h.depth <= 3), ...headings.filter((h) => h.depth > 3)]) {
      const base = headingText(node).trim().normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "").toLowerCase()
        .replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";
      let id = base;
      let suffix = 1;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
    }
    function escapeHtml(node) {
      // The previous renderer displayed raw HTML as text. Keep that contract.
      if (node.type === "html") node.type = "text";
      node.children?.forEach(escapeHtml);
    }
    escapeHtml(tree);
  };
}

const classes = {
  p: "max-w-[65ch] text-base leading-8 text-muted",
  h1: "max-w-[65ch] scroll-mt-24 text-2xl font-extrabold tracking-tight text-foreground",
  h2: "max-w-[65ch] scroll-mt-24 text-xl font-extrabold tracking-tight text-foreground",
  h3: "max-w-[65ch] scroll-mt-24 text-lg font-extrabold tracking-tight text-foreground",
  blockquote: "border-l-4 border-yellow bg-card px-5 py-3 text-base leading-7 text-muted",
  ul: "max-w-[65ch] list-disc space-y-2 pl-5 text-base leading-7 text-muted",
  ol: "max-w-[65ch] list-decimal space-y-2 pl-5 text-base leading-7 text-muted",
  li: "leading-7",
  a: "font-bold text-accent hover:underline",
  pre: "overflow-x-auto rounded-2xl border border-border bg-card p-4 paper-shadow",
  hr: "border-border",
  table: "w-full min-w-[36rem] border-collapse text-left text-sm text-muted",
  th: "border-b border-border px-3 py-2 font-extrabold text-foreground",
  td: "border-b border-border px-3 py-2",
};
const element = (tagName, className, children) => ({ type: "element", tagName, properties: { className: className.split(" ") }, children });

function safeUrl(value) {
  // Preserve the former renderer's URL policy, including relative URLs.
  return /^(?:[^:/?#]+:)/.test(value) && !/^(?:https?|ircs?|mailto|xmpp):/i.test(value) ? "" : value;
}

export function rehypeSiteContent() {
  return (tree) => {
    function transform(node, parent) {
      if (node.type !== "element") {
        if (node.children) node.children = node.children.map((child) => transform(child, node));
        return node;
      }
      const properties = node.properties ??= {};
      if (classes[node.tagName]) {
        const existing = properties.className ?? properties.class ?? [];
        properties.className = [...(Array.isArray(existing) ? existing : existing.split(" ")), ...classes[node.tagName].split(" ")];
        delete properties.class;
      }
      for (const attribute of ["href", "src"]) {
        if (typeof properties[attribute] === "string") properties[attribute] = safeUrl(properties[attribute]);
      }
      if (node.tagName === "a" && /^(https?:)?\/\//i.test(properties.href ?? "")) {
        properties.target = "_blank";
        properties.rel = ["noopener", "noreferrer"];
      }
      if (node.tagName === "code") {
        properties.className = (parent?.tagName === "pre"
          ? "font-mono text-[13px]"
          : "rounded-md bg-card px-1.5 py-0.5 font-mono text-[0.9em] text-foreground").split(" ");
      }
      if (node.tagName === "img") {
        Object.assign(properties, { width: 1200, height: 800, loading: "lazy", decoding: "async", style: "color:transparent", className: ["h-auto", "w-full"] });
      }
      node.children = node.children.map((child) => transform(child, node));
      if (node.tagName === "table") return element("div", "overflow-x-auto", [node]);
      if (node.tagName === "p") {
        const meaningful = node.children.filter((child) => child.type !== "text" || child.value.trim());
        if (meaningful.length === 1 && meaningful[0].tagName === "img") {
          const img = meaningful[0];
          const alt = String(img.properties.alt ?? "").trim();
          const caption = /\.(jpe?g|png|gif|webp|heic)$/i.test(alt) || /^DCIM/i.test(alt) ? "" : alt;
          img.properties.alt = caption;
          const children = [element("div", "overflow-hidden rounded-3xl border border-border bg-card paper-shadow", [img])];
          if (caption) children.push(element("figcaption", "mt-2 text-center text-sm text-subtle", [{ type: "text", value: caption }]));
          return element("figure", "", children);
        }
      }
      return node;
    }
    transform(tree);
  };
}
