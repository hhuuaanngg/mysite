import { SectionHeading } from "@/components/SectionHeading";
import { capabilities } from "@/content/site";

export function Capabilities() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-24">
        <SectionHeading
          eyebrow="02 / 能力"
          title="能交付什么"
          description="按事情分组，而不是一排 logo。"
        />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {capabilities.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-card p-5 sm:p-6"
            >
              <p className="font-mono text-xs text-subtle">{item.id}</p>
              <h3 className="mt-3 text-base font-medium tracking-tight">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted">{item.body}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-subtle"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
