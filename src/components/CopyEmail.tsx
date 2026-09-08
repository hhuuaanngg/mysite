"use client";

import { useState } from "react";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const input = document.createElement("textarea");
        input.value = email;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
        copied
          ? "border-foreground bg-foreground text-accent-fg"
          : "border-foreground/20 bg-card text-muted hover:border-foreground hover:text-foreground"
      }`}
    >
      {copied ? "已复制" : "复制"}
    </button>
  );
}
