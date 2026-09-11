import Image from "next/image";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkHeadingIds } from "@/lib/markdown-toc";

function imageCaption(alt: string) {
  const value = alt.trim();
  if (!value) return "";
  if (/\.(jpe?g|png|gif|webp|heic)$/i.test(value)) return "";
  if (/^DCIM/i.test(value)) return "";
  return value;
}

function isImageOnlyParagraph(node: { children?: unknown[] } | undefined) {
  if (!node?.children) return false;
  const children = node.children.filter((child) => {
    if (!child || typeof child !== "object") return true;
    const item = child as { type?: string; value?: string };
    if (item.type === "text") return Boolean(item.value?.trim());
    return true;
  });
  if (children.length !== 1) return false;
  const only = children[0] as { type?: string; tagName?: string };
  return only.type === "element" && only.tagName === "img";
}

function headingComponents(): Pick<
  Components,
  "h1" | "h2" | "h3"
> {
  return {
    h1({ children, id }) {
      return (
        <h1
          id={id}
          className="max-w-[65ch] scroll-mt-24 text-2xl font-extrabold tracking-tight text-foreground"
        >
          {children}
        </h1>
      );
    },
    h2({ children, id }) {
      return (
        <h2
          id={id}
          className="max-w-[65ch] scroll-mt-24 text-xl font-extrabold tracking-tight text-foreground"
        >
          {children}
        </h2>
      );
    },
    h3({ children, id }) {
      return (
        <h3
          id={id}
          className="max-w-[65ch] scroll-mt-24 text-lg font-extrabold tracking-tight text-foreground"
        >
          {children}
        </h3>
      );
    },
  };
}

const markdownComponents: Components = {
  p({ node, children }) {
    if (isImageOnlyParagraph(node)) return <>{children}</>;
    return (
      <p className="max-w-[65ch] text-base leading-8 text-muted">{children}</p>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-yellow bg-card px-5 py-3 text-base leading-7 text-muted">
        {children}
      </blockquote>
    );
  },
  ul({ children }) {
    return (
      <ul className="max-w-[65ch] list-disc space-y-2 pl-5 text-base leading-7 text-muted">
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol className="max-w-[65ch] list-decimal space-y-2 pl-5 text-base leading-7 text-muted">
        {children}
      </ol>
    );
  },
  li({ children }) {
    return <li className="leading-7">{children}</li>;
  },
  a({ href, children }) {
    const external = Boolean(href && /^(https?:)?\/\//i.test(href));
    return (
      <a
        href={href}
        className="font-bold text-accent hover:underline"
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  },
  img({ src, alt }) {
    if (!src || typeof src !== "string") return null;
    const caption = imageCaption(alt ?? "");
    return (
      <figure>
        <div className="overflow-hidden rounded-3xl border border-border bg-card paper-shadow">
          <Image
            src={src}
            alt={caption}
            width={1200}
            height={800}
            className="h-auto w-full"
          />
        </div>
        {caption ? (
          <figcaption className="mt-2 text-center text-sm text-subtle">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  },
  code({ className, children }) {
    const block = Boolean(className);
    if (block) {
      return <code className="font-mono text-[13px]">{children}</code>;
    }
    return (
      <code className="rounded-md bg-card px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
        {children}
      </code>
    );
  },
  pre({ children }) {
    return (
      <pre className="overflow-x-auto rounded-2xl border border-border bg-card p-4 paper-shadow">
        {children}
      </pre>
    );
  },
  hr() {
    return <hr className="border-border" />;
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-muted">
          {children}
        </table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border-b border-border px-3 py-2 font-extrabold text-foreground">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="border-b border-border px-3 py-2">{children}</td>;
  },
};

export function ArticleBody({
  content,
  empty = "这篇文章还在整理中。",
  className = "mt-10 space-y-6",
  heading = "default",
}: {
  content: string;
  empty?: string;
  className?: string;
  heading?: "default" | "pill";
}) {
  if (!content.trim()) {
    return (
      <p className="mt-10 max-w-[65ch] text-base leading-7 text-muted">
        {empty}
      </p>
    );
  }

  const headings = headingComponents();
  const components: Components =
    heading === "pill"
      ? {
          ...markdownComponents,
          ...headings,
          h2({ children, id }) {
            return (
              <h2
                id={id}
                className="inline-flex scroll-mt-24 items-center rounded-full bg-yellow px-2.5 py-0.5 text-xs font-extrabold tracking-wide text-foreground"
              >
                {children}
              </h2>
            );
          },
        }
      : { ...markdownComponents, ...headings };

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkHeadingIds]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
