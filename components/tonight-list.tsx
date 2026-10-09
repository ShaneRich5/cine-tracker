import Link from "next/link";
import { Poster } from "./poster";
import { cn } from "@/lib/utils";
import {
  showtimeLabel,
  theaterCountLabel,
  type TonightEntry,
} from "@/lib/showtimes";
import type { Movie, WatchlistEntry } from "@/lib/types";
import { sticker } from "./sticker-card";
import { TimeToken } from "./time-token";

/** Mobile home: each movie still catchable tonight, with its next few times. */
export function TonightList({ entries }: { entries: TonightEntry[] }) {
  return (
    <section aria-labelledby="tonight-mobile" className="pt-[18px]">
      <h2 id="tonight-mobile" className="mb-3 font-display text-2xl">
        Playing tonight
      </h2>
      {entries.length === 0 ? (
        <p className={cn(sticker, "p-4 text-sm")}>
          Nothing left tonight at the theaters you follow.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map(({ movie, theaterCount, upcoming }) => {
            const href = `/movies/${movie.id}`;
            return (
              <li key={movie.id} className={cn(sticker, "flex gap-3 p-2.5")}>
                <Link
                  href={href}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <Poster
                    movie={movie}
                    className="h-[84px] w-[60px] rounded-[10px]"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      href={href}
                      className="font-display text-[19px] leading-tight no-underline"
                    >
                      {movie.title}
                    </Link>
                    <span className="shrink-0 text-xs font-semibold text-muted">
                      {theaterCountLabel(theaterCount)}
                    </span>
                  </div>
                  <ul
                    aria-label={`Next showtimes for ${movie.title}`}
                    className="flex flex-wrap gap-1.5"
                  >
                    {upcoming.map((s) => (
                      <li key={s.id}>
                        <TimeToken href={href}>{showtimeLabel(s)}</TimeToken>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Home: watchlisted movies as sticker chips with their next showing. */
export function WatchlistChips({
  entries,
  movies,
  className,
  headingId = "watchlist-heading",
}: {
  entries: WatchlistEntry[];
  movies: Movie[];
  className?: string;
  /** Home renders this twice (mobile and desktop), so each needs its own ID. */
  headingId?: string;
}) {
  const items = entries.flatMap((entry) => {
    const movie = movies.find((m) => m.id === entry.movieId);
    return movie && entry.note ? [{ movie, entry }] : [];
  });
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className={cn("pt-[18px]", className)}>
      <h2 id={headingId} className="mb-2.5 font-display text-xl">
        On your watchlist
      </h2>
      <ul className="flex flex-wrap gap-2">
        {items.map(({ movie, entry }) => (
          <li key={movie.id}>
            <Link
              href={`/movies/${movie.id}`}
              className={cn(
                sticker,
                "block px-3 py-2 text-[13px] font-bold no-underline",
                entry.highlight && "bg-butter",
              )}
            >
              {movie.title} · {entry.note}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
