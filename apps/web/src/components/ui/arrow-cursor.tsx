export function ArrowCursor({
  active,
  label = "AmbiOS agent",
}: {
  active: boolean;
  label?: string;
}) {
  if (!active) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-8 bottom-28 z-[90] hidden items-start gap-1 md:flex"
    >
      <svg
        aria-hidden="true"
        className="size-4 animate-pulse text-foreground drop-shadow-sm"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M2 1.5 13.5 8 8 9.5 6.5 14 2 1.5Z"
          fill="currentColor"
          stroke="var(--background)"
          strokeWidth="1"
        />
      </svg>
      <span className="rounded-full border border-border bg-background/90 px-2 py-0.5 font-medium text-[10px] text-foreground shadow-sm backdrop-blur">
        {label}
      </span>
    </div>
  );
}
