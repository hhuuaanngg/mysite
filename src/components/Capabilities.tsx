import { SectionHeading } from "@/components/SectionHeading";
import { WashiTape } from "@/components/Doodles";
import { capabilities } from "@/content/site";

const notes = [
  { bg: "bg-[#fff4b8]", rotate: "md:rotate-1" },
  { bg: "bg-[#d8f3ea]", rotate: "md:-rotate-1" },
  { bg: "bg-[#fde4d6]", rotate: "md:rotate-2" },
] as const;

export function Capabilities() {
  return (
    <section className="border-y border-border/80">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading
          eyebrow="02 / 能力"
          title="能交付什么"
          description="按事情分组，而不是一排 logo。"
        />
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {capabilities.map((item, index) => {
            const note = notes[index % notes.length];
            return (
              <li
                key={item.id}
                className={`relative rounded-2xl p-5 sm:p-6 paper-shadow ${note.bg} ${note.rotate}`}
              >
                <WashiTape />
                <p className="font-mono text-xs font-bold text-subtle">
                  {item.id}
                </p>
                <h3 className="mt-3 text-base font-extrabold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">{item.body}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full bg-card/70 px-2.5 py-0.5 font-mono text-[11px] text-subtle"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
