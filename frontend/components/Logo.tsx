export function KilnWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale = size === "sm" ? 0.78 : size === "lg" ? 1.35 : 1;
  return (
    <div className="flex items-center gap-2.5" style={{ transform: `scale(${scale})`, transformOrigin: "left center" }}>
      <KilnMark />
      <span className="display text-[1.3rem] tracking-[0.1em] font-bold text-ivory">
        KILN
      </span>
    </div>
  );
}

export function KilnMark({ size = 26 }: { size?: number }) {
  // A kiln flame rising inside a firing chamber — yellow on graphite.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Chamber */}
      <path
        d="M8 34 V18 C8 11 13 6 20 6 C27 6 32 11 32 18 V34 Z"
        stroke="#2081e2"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="rgba(32, 129, 226, 0.06)"
      />
      {/* Flame */}
      <path
        d="M20 14 C23 18 25 20.5 25 24 C25 27.3 22.8 29.5 20 29.5 C17.2 29.5 15 27.3 15 24 C15 21.5 16.2 19.8 17.5 18 C17.9 20 18.8 21 20 21.5 C19.2 19 19.2 16.5 20 14 Z"
        fill="#2081e2"
      />
      {/* Chamber base line */}
      <line x1="6" y1="34" x2="34" y2="34" stroke="#2081e2" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
