import Link from "next/link";

interface WordmarkProps {
  href?: string;
  /** Light text, for use on the teal banknote panel. */
  onNote?: boolean;
}

const TONES = {
  default: { text: "text-ink", fill: "fill-accent", stroke: "stroke-on-accent" },
  note: { text: "text-note-ink", fill: "fill-note-ink", stroke: "stroke-note" },
};

/** A small folded-note mark beside the product name. */
export function Wordmark({ href = "/", onNote = false }: WordmarkProps) {
  const tone = onNote ? TONES.note : TONES.default;
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 whitespace-nowrap font-display text-lg leading-none font-semibold ${tone.text}`}
    >
      <svg viewBox="0 0 28 20" className="h-5 w-7 shrink-0" aria-hidden="true">
        <rect x="0.75" y="0.75" width="26.5" height="18.5" rx="4" className={tone.fill} />
        <circle cx="14" cy="10" r="4.25" fill="none" strokeWidth="1.5" className={tone.stroke} />
        <path d="M4.5 5.5h3M20.5 14.5h3" strokeWidth="1.5" strokeLinecap="round" className={tone.stroke} />
      </svg>
      Expense Tracker
    </Link>
  );
}
