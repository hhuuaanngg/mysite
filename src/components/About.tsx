import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/content/site";

export function About() {
  return (
    <section id="about" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-24">
        <SectionHeading eyebrow="03 / 关于" title={site.name} />
        <div className="mt-8 max-w-[65ch] space-y-4 text-base leading-7 text-muted">
          {site.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-5 text-sm">
          <a
            href={site.github.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            GitHub ↗
          </a>
          <a
            href={site.blog.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            博客 ↗
          </a>
        </div>
      </div>
    </section>
  );
}
