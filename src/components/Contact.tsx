import { CopyEmail } from "@/components/CopyEmail";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/content/site";

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-24">
        <SectionHeading
          eyebrow="04 / 联系"
          title="直接写信"
          description="没有表单。邮件和 GitHub 就够了。"
        />
        <div className="mt-8 flex flex-col gap-4 text-base">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${site.email}`}
              className="font-mono text-accent hover:underline"
            >
              {site.email}
            </a>
            <CopyEmail email={site.email} />
          </div>
          <a
            href={site.github.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit font-mono text-sm text-muted hover:text-foreground"
          >
            {site.github.href.replace("https://", "")}
          </a>
        </div>
      </div>
    </section>
  );
}
