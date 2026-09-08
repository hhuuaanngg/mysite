export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="inline-flex items-center rounded-full bg-yellow px-2.5 py-0.5 text-xs font-extrabold tracking-wide text-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-[65ch] text-base leading-7 text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
