import { SiteImage as Image } from "@/components/SiteImage";
import { DoodleArrow, DoodleStar } from "@/components/Doodles";
import { site } from "@/content/site";

const CREW_W = 1536;
const CREW_H = 1024;

const crewPieces: {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  motion?: "bob" | "bob-slow";
}[] = [
  { src: "/illustrations/hero-star.png", x: 56, y: 223, w: 69, h: 68, z: 1 },
  { src: "/illustrations/hero-notebook.png", x: 753, y: 871, w: 203, h: 107, z: 2 },
  { src: "/illustrations/hero-code.png", x: 91, y: 379, w: 330, h: 496, z: 3 },
  { src: "/illustrations/hero-stand.png", x: 626, y: 248, w: 333, h: 636, z: 4 },
  { src: "/illustrations/hero-dog.png", x: 419, y: 523, w: 292, h: 374, z: 5, motion: "bob" },
  { src: "/illustrations/hero-cat.png", x: 878, y: 620, w: 196, h: 261, z: 6, motion: "bob-slow" },
  { src: "/illustrations/hero-coffee.png", x: 1091, y: 339, w: 325, h: 590, z: 7 },
];

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
            <a
              href="/#work"
              className="inline-flex h-12 items-center rounded-full bg-foreground px-6 text-sm font-bold text-accent-fg transition-transform hover:-translate-y-0.5"
            >
              看作品
            </a>
            <a
              href="/#articles"
              className="inline-flex h-12 items-center rounded-full border border-border bg-card px-6 text-sm font-bold text-foreground paper-shadow transition-transform hover:-translate-y-0.5"
            >
              看文章
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl pt-8 lg:max-w-none lg:pt-4">
          <Image
            src="/illustrations/wave.png"
            alt=""
            width={220}
            height={220}
            priority
            className="pointer-events-none absolute -top-2 right-2 z-10 w-[5.5rem] bob-slow sm:w-28 lg:-top-6 lg:right-4 lg:w-32"
          />
          <div
            className="relative w-full"
            style={{ aspectRatio: `${CREW_W} / ${CREW_H}` }}
            role="img"
            aria-label="同一个 Notion 风格男生：写代码、挥手打招呼、坐在便签上喝咖啡，身边有金毛和金渐层猫咪"
          >
            {crewPieces.map((piece) => (
              <Image
                key={piece.src}
                src={piece.src}
                alt=""
                width={piece.w}
                height={piece.h}
                priority
                className={`pointer-events-none absolute h-auto ${piece.motion ?? ""}`}
                style={{
                  left: `${(piece.x / CREW_W) * 100}%`,
                  top: `${(piece.y / CREW_H) * 100}%`,
                  width: `${(piece.w / CREW_W) * 100}%`,
                  zIndex: piece.z,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
