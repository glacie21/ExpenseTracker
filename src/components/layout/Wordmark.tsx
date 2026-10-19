import Link from "next/link";

interface WordmarkProps {
  href?: string;
  className?: string;
  /** Light text, for use on the teal banknote panel. */
  onNote?: boolean;
}

/** A small folded-note mark beside the product name. */
export function Wordmark({ href = "/", className = "", onNote = false }: WordmarkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 whitespace-nowrap font-display text-lg leading-none font-semibold ${
        onNote ? "text-note-ink" : "text-ink"
      } ${className}`}
    >
      <svg viewBox="0 0 28 20" className="h-5 w-7 shrink-0" aria-hidden="true">
        <rect x="0.75" y="0.75" width="26.5" height="18.5" rx="4" className={onNote ? "fill-note-ink" : "fill-accent"} />
        <circle cx="14" cy="10" r="4.25" fill="none" strokeWidth="1.5" className={onNote ? "stroke-note" : "stroke-on-accent"} />
        <path d="M4.5 5.5h3M20.5 14.5h3" strokeWidth="1.5" strokeLinecap="round" className={onNote ? "stroke-note" : "stroke-on-accent"} />
      </svg>
      Expense Tracker
    </Link>
  );
}
