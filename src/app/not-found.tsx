import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "页面不存在",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8 sm:py-24">
      <Image
        src="/illustrations/lost.png"
        alt=""
        width={280}
        height={280}
        className="w-44 sm:w-56"
      />
      <p className="mt-6 inline-flex items-center rounded-full bg-yellow px-2.5 py-0.5 text-xs font-extrabold tracking-wide">
        404
      </p>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">没有这页</h1>
      <p className="mt-3 max-w-[65ch] text-base leading-7 text-muted">
        地址不对，或者项目已经撤下。回首页看作品。
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 w-fit items-center rounded-full bg-foreground px-6 text-sm font-bold text-accent-fg hover:-translate-y-0.5"
      >
        回首页
      </Link>
    </main>
  );
}
