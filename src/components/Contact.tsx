import { CopyEmail } from "@/components/CopyEmail";
import { WashiTape } from "@/components/Doodles";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/content/site";

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading
          eyebrow="04 / 联系"
          title="直接写信"
          description="没有表单。邮件和 GitHub 就够了。"
        />
        <div className="relative mt-8 max-w-xl rounded-3xl bg-[#fff4b8] p-6 paper-shadow sm:p-8">
          <WashiTape className="left-10 translate-x-0" />
          <div className="flex flex-col gap-4 text-base">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${site.email}`}
                className="font-mono text-sm font-bold text-foreground hover:underline sm:text-base"
              >
                {site.email}
              </a>
              <CopyEmail email={site.email} />
            </div>
            <a
              href={site.github.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit font-mono text-sm font-semibold text-muted hover:text-foreground"
            >
              {site.github.href.replace("https://", "")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
