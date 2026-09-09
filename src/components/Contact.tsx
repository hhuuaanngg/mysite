import { CopyEmail } from "@/components/CopyEmail";
import { SectionHeading } from "@/components/SectionHeading";
import { socials } from "@/content/site";

function SocialGlyph({ name }: { name: string }) {
  if (name === "github") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.9-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05a9.2 9.2 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2"
        />
      </svg>
    );
  }

  if (name === "blog") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true" fill="none">
        <rect
          x="4"
          y="3.5"
          width="16"
          height="17"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M8 8h8M8 12h8M8 16h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true" fill="none">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m4.5 7 7.5 6 7.5-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading
          eyebrow="04 / 联系"
          title="社交媒体"
          description="没有表单。GitHub、博客和邮箱就这些。"
        />
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {socials.map((item) => {
            const isEmail = "copy" in item && item.copy;

            return (
              <li key={item.id}>
                {isEmail ? (
                  <div
                    className="relative flex h-full flex-col rounded-3xl border border-border p-6 paper-shadow"
                    style={{ background: item.tint }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-foreground">
                        <SocialGlyph name={item.icon} />
                      </span>
                      <CopyEmail email={item.handle} />
                    </div>
                    <h3 className="mt-5 text-lg font-extrabold tracking-tight">
                      {item.label}
                    </h3>
                    <a
                      href={item.href}
                      className="mt-1 break-all font-mono text-sm font-semibold text-foreground hover:underline"
                    >
                      {item.handle}
                    </a>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {item.description}
                    </p>
                  </div>
                ) : (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex h-full flex-col rounded-3xl border border-border p-6 paper-shadow transition-transform duration-200 hover:-translate-y-1"
                    style={{ background: item.tint }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-foreground">
                        <SocialGlyph name={item.icon} />
                      </span>
                      <span className="text-sm font-bold text-muted group-hover:text-foreground">
                        ↗
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-extrabold tracking-tight">
                      {item.label}
                    </h3>
                    <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
                      {item.handle}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {item.description}
                    </p>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
