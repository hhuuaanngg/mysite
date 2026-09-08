export function NotionFace({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="1.6"
        y="1.6"
        width="28.8"
        height="28.8"
        rx="8"
        fill="#fffefb"
        stroke="#37352f"
        strokeWidth="2"
      />
      <circle cx="11.2" cy="14" r="1.85" fill="#37352f" />
      <circle cx="20.8" cy="14" r="1.85" fill="#37352f" />
      <path
        d="M11 21.2c2.2 2.5 7.8 2.5 10 0"
        stroke="#37352f"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DoodleStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M24 4.5 28.4 17.2 42 18.2 31.6 27.1 35.1 40.5 24 33.6 12.9 40.5 16.4 27.1 6 18.2 19.6 17.2Z"
        fill="#f5df4d"
        stroke="#37352f"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DoodleArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 40"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M6 28c14-16 28-18 50-14"
        stroke="#37352f"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M48 8c6 4 10 8 12 16"
        stroke="#37352f"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WashiTape({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -top-2.5 left-1/2 h-4 w-[4.5rem] -translate-x-1/2 rotate-[-8deg] rounded-[2px] bg-[#f5e6a8]/90 shadow-sm ring-1 ring-black/5 ${className ?? ""}`}
    />
  );
}
