import Image from "next/image";
import type { ArticleBlock } from "@/content/articles";

function imageCaption(alt: string) {
  const value = alt.trim();
  if (!value) return "";
  if (/\.(jpe?g|png|gif|webp|heic)$/i.test(value)) return "";
  if (/^DCIM/i.test(value)) return "";
  return value;
}

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  if (blocks.length === 0) {
    return (
      <p className="mt-10 max-w-[65ch] text-base leading-7 text-muted">
        这篇文章还在整理中。
      </p>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      {blocks.map((block, index) => {
        if (block.type === "quote") {
          return (
            <blockquote
              key={index}
              className="border-l-4 border-yellow bg-card px-5 py-3 text-base leading-7 text-muted"
            >
              {block.text}
            </blockquote>
          );
        }

        if (block.type === "img") {
          const caption = imageCaption(block.alt);
          return (
            <figure key={index}>
              <div className="overflow-hidden rounded-3xl border border-border bg-card paper-shadow">
                <Image
                  src={block.src}
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
        }

        return (
          <p key={index} className="max-w-[65ch] text-base leading-8 text-muted">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
