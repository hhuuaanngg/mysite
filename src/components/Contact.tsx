import { useState } from "react";
import { CopyEmail } from "@/components/CopyEmail";
import { SectionHeading } from "@/components/SectionHeading";
import { socials } from "@/content/site";

function SocialGlyph({ name }: { name: (typeof socials)[number]["icon"] }) {
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
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="contact" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading
          eyebrow="03 / 联系"
          title="社交媒体"
          description="没有表单。把鼠标放到图标上，账号和说明会出来。"
        />
        <ul className="mt-10 flex flex-wrap items-center gap-4">
          {socials.map((item) => {
            const isEmail = "copy" in item && item.copy;
            const open = openId === item.id;

            return (
              <li
                key={item.id}
                className={`social-item relative ${open ? "is-open" : ""}`}
                onPointerEnter={() => setOpenId(item.id)}
                onPointerLeave={() => setOpenId(null)}
                onFocusCapture={() => setOpenId(item.id)}
                onBlurCapture={(event) => {
                  const next = event.relatedTarget;
                  if (
                    next instanceof Node &&
                    event.currentTarget.contains(next)
                  ) {
                    return;
                  }
                  setOpenId(null);
                }}
              >
                <a
                  href={item.href}
                  target={isEmail ? undefined : "_blank"}
                  rel={isEmail ? undefined : "noopener noreferrer"}
                  aria-label={`${item.label}：${item.handle}`}
                  aria-describedby={`social-tip-${item.id}`}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-foreground text-foreground transition-transform duration-200 hover:-translate-y-1 hover:-rotate-3 paper-shadow"
                  style={{ background: item.tint }}
                >
                  <SocialGlyph name={item.icon} />
                </a>
                <div
                  id={`social-tip-${item.id}`}
                  role="tooltip"
                  className="social-tooltip absolute bottom-full left-0 z-30 w-56 pb-3 transition-opacity duration-150 sm:left-1/2 sm:-translate-x-1/2"
                >
                  <div className="rounded-2xl border-2 border-foreground bg-card px-4 py-3 shadow-[3px_3px_0_#37352f]">
                    <p className="text-sm font-extrabold tracking-tight">
                      {item.label}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs font-semibold text-foreground">
                      {item.handle}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      {item.description}
                    </p>
                    {isEmail ? (
                      <div className="mt-3">
                        <CopyEmail email={item.handle} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
