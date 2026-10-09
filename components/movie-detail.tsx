import Link from "next/link";
import { cn } from "@/lib/utils";
import { groupsSummary, LAYOUT_OPTIONS, type Prefs } from "@/lib/prefs";
import { buildTheaterCards, movieFormats, movieMeta } from "@/lib/showtimes";
import { getDayOptions } from "@/lib/time";
import type { Movie, Showtime, Theater } from "@/lib/types";
import { DayPicker } from "./day-picker";
import { PrefsPanelToggle } from "./prefs-panel";
import { sticker } from "./sticker-card";
import { TheaterCard } from "./theater-card";
import { buttonVariants } from "./ui/button";
import { WatchlistButton } from "./watchlist-button";

/**
 * Day picker plus theater cards for one movie. On mobile the title lives in
 * the page header; on desktop it sits in a sticker card above the days.
 */
export function MovieDetail({
  movie,
  day,
  now,
  prefs,
  showtimes,
  theaters,
  watchlisted,
}: {
  movie: Movie;
  /** "YYYY-MM-DD"; anything not in the picker falls back to today. */
  day?: string;
  now: Date;
  prefs: Prefs;
  showtimes: Showtime[];
  theaters: Theater[];
  watchlisted: boolean;
}) {
  const days = getDayOptions(now);
  const selected = days.find((d) => d.key === day) ?? days[0];
  const isToday = selected.key === days[0].key;
  const basePath = `/movies/${movie.id}`;
  const cards = buildTheaterCards({
    movieId: movie.id,
    day: selected.key,
    now,
    showtimes,
    theaters,
    prefs,
  });
  const pendingLayout =
    prefs.layout === "theater"
      ? null
      : LAYOUT_OPTIONS.find((l) => l.id === prefs.layout)?.label;

  return (
    <div>
      <div
        className={cn(
          sticker,
          "flex flex-wrap items-center justify-between gap-3 px-[18px] py-4 max-desktop:hidden",
        )}
      >
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[38px] leading-none text-accent">
            {movie.title}
          </h1>
          <p className="mt-1.5 text-sm font-semibold">
            {movieMeta(movie, movieFormats(movie.id, showtimes), {
              withGenre: true,
            })}
          </p>
          {movie.synopsis && (
            <p className="mt-2 max-w-[70ch] text-sm text-muted">
              {movie.synopsis}
            </p>
          )}
        </div>
        <WatchlistButton movieId={movie.id} on={watchlisted} />
      </div>

      <div className="pt-3.5 desktop:pt-[18px]">
        <DayPicker days={days} selected={selected.key} basePath={basePath} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-muted desktop:mt-3.5 desktop:text-[13px]">
        <p>
          Next showing you can make, first
          <span className="max-desktop:hidden"> · {groupsSummary(prefs)}</span>
        </p>
        <Link
          href={`/preferences?from=${encodeURIComponent(basePath)}`}
          className="text-accent hover:text-accent desktop:hidden"
        >
          Theaters &amp; filters
        </Link>
        <PrefsPanelToggle
          className={cn(
            buttonVariants({ variant: "link", size: "inline" }),
            "max-desktop:hidden",
          )}
        >
          Theaters &amp; filters
        </PrefsPanelToggle>
      </div>

      {pendingLayout && (
        <p className="mt-2 text-xs text-muted">
          The {pendingLayout} layout isn&apos;t built yet, so showtimes are
          grouped by theater.
        </p>
      )}

      <h2 className="sr-only">Showtimes by theater on {selected.label}</h2>
      {cards.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3 desktop:grid desktop:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] desktop:gap-4">
          {cards.map((card) => (
            <li key={card.theater.id}>
              <TheaterCard card={card} now={now} isToday={isToday} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={cn(sticker, "mt-3 p-4 text-sm")}>
          <p className="font-bold">
            Nothing playing on {selected.label} at the theaters you follow.
          </p>
          <p className="mt-1 text-muted">
            Try another day, or turn on more theater groups in Theaters &amp;
            filters.
          </p>
        </div>
      )}

      {movie.synopsis && (
        <section aria-labelledby="about-movie" className="pt-6 desktop:hidden">
          <h2 id="about-movie" className="mb-1.5 font-display text-xl">
            About
          </h2>
          <p className="text-sm">
            {movie.genre && <strong>{movie.genre}. </strong>}
            {movie.synopsis}
          </p>
        </section>
      )}
    </div>
  );
}
