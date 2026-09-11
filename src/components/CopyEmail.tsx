"use client";

import { useState } from "react";

function fallbackCopy(email: string) {
  const input = document.createElement("textarea");
  input.value = email;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(input);
  return ok;
}

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
        return;
      }
    } catch {
      // Some browsers expose clipboard but reject writeText.
    }

    try {
      fallbackCopy(email);
    } catch {
      // Label already flipped; the address is still visible in the tooltip.
    }
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void copy();
      }}
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
