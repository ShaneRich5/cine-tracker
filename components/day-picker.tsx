import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DayOption } from "@/lib/time";

/** Row of day buttons. Shows five days on mobile and all of them on desktop. */
export function DayPicker({
  days,
  selected,
  basePath,
  mobileCount = 5,
}: {
  days: DayOption[];
  selected: string;
  basePath: string;
  mobileCount?: number;
}) {
  return (
    <nav aria-label="Choose a day">
      <ul className="flex gap-1.5 desktop:flex-wrap desktop:gap-2">
        {days.map((day, i) => {
          const isSelected = day.key === selected;
          return (
            <li
              key={day.key}
              className={cn(
                "flex-1 desktop:flex-none",
                i >= mobileCount && "max-desktop:hidden",
              )}
            >
              <Link
                href={i === 0 ? basePath : `${basePath}?day=${day.key}`}
                scroll={false}
                aria-label={day.label}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "flex h-[52px] flex-col items-center justify-center rounded-xl border-2 border-ink bg-surface font-display text-xs text-ink no-underline hover:text-ink desktop:min-w-16 desktop:px-2.5",
                  isSelected &&
                    "bg-accent text-white shadow-sticker-sm hover:text-white",
                )}
              >
                <span>{day.weekday}</span>
                <span className="font-mono text-[15px] font-semibold">
                  {day.dayOfMonth}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
