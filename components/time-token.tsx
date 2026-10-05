import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center rounded-full border-[1.5px] px-2.5 py-[5px] font-mono text-[13px] leading-tight font-semibold no-underline";

const variants = {
  default: "border-ink bg-butter text-ink hover:text-ink",
  past: "border-dashed border-muted bg-transparent text-muted",
};

/** Butter pill for a showtime, e.g. "7:00 Dolby". */
export function TimeToken({
  href,
  external = false,
  variant = "default",
  label,
  className,
  children,
}: {
  href?: string | null;
  /** Ticket links open the chain's checkout in a new tab. */
  external?: boolean;
  variant?: keyof typeof variants;
  /** Accessible name when the visible text needs more context. */
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const classes = cn(base, variants[variant], className);

  if (!href) {
    return (
      <span className={classes} aria-label={label}>
        {children}
      </span>
    );
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} aria-label={label} className={classes}>
      {children}
    </Link>
  );
}
