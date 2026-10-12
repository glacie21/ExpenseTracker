import Link from "next/link";

interface WordmarkProps {
  href?: string;
  className?: string;
}

/** Product name set in the serif; the only "logo" the app uses. */
export function Wordmark({ href = "/", className = "" }: WordmarkProps) {
  return (
    <Link
      href={href}
      className={`font-serif text-xl leading-none tracking-tight text-ink ${className}`}
    >
      Expense <span className="italic">Tracker</span>
    </Link>
  );
}
