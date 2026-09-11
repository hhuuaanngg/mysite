import Image from "next/image";
import Link from "next/link";
import { DoodleArrow, DoodleStar } from "@/components/Doodles";
import { site } from "@/content/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <DoodleStar className="pointer-events-none absolute top-10 left-[6%] hidden w-9 bob sm:block md:left-[10%] md:w-11" />
      <DoodleArrow className="pointer-events-none absolute top-[42%] left-[46%] hidden w-16 opacity-70 lg:block" />

      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-2 lg:py-14">
        <div className="relative z-10">
          <p className="fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-muted paper-shadow">
            <span aria-hidden="true">✏️</span>
            {site.shortName}.me · {site.title}
          </p>
          <h1 className="fade-up mt-5 max-w-xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-[3.4rem] md:leading-[1.12]">
            你好，我是
            <br />
            <span className="highlight">{site.name}</span>
          </h1>
          <p
            className="fade-up mt-6 max-w-[34rem] text-lg leading-8 text-muted"
            style={{ animationDelay: "80ms" }}
          >
            {site.tagline}
            <br />
            作品、文章，慢慢看。
          </p>
          <div
            className="fade-up mt-9 flex flex-wrap gap-3"
            style={{ animationDelay: "140ms" }}
          >
            <Link
              href="/#work"
              className="inline-flex h-12 items-center rounded-full bg-foreground px-6 text-sm font-bold text-accent-fg transition-transform hover:-translate-y-0.5"
            >
              看作品
            </Link>
            <Link
              href="/#articles"
              className="inline-flex h-12 items-center rounded-full border border-border bg-card px-6 text-sm font-bold text-foreground paper-shadow transition-transform hover:-translate-y-0.5"
            >
              看文章
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <Image
            src="/illustrations/hero.png"
            alt="Notion 风格卡通男生：黄毛衣，盘腿坐着写代码，一边挥手打招呼"
            width={1600}
            height={1200}
            priority
            className="relative z-0 w-full"
          />
        </div>
      </div>
    </section>
  );
}
