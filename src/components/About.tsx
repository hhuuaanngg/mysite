import { SiteImage as Image } from "@/components/SiteImage";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/content/site";

export function About() {
  return (
    <section id="about" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.2fr)_16rem]">
        <div>
          <SectionHeading eyebrow="02 / 关于" title={site.name} />
          <div className="mt-8 max-w-[65ch] space-y-4 text-base leading-7 text-muted">
            {site.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <Image
          src="/illustrations/wave.png"
          alt=""
          width={320}
          height={320}
          className="mx-auto w-48 bob-slow sm:w-56 lg:w-full"
        />
      </div>
    </section>
  );
}
