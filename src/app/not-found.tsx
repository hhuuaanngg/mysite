import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "页面不存在",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-24 sm:px-8">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">没有这页</h1>
      <p className="mt-3 max-w-[65ch] text-base leading-7 text-muted">
        地址不对，或者项目已经撤下。回首页看作品。
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 w-fit items-center rounded-lg bg-accent px-5 text-sm font-medium text-accent-fg hover:opacity-90"
      >
        回首页
      </Link>
    </main>
  );
}
