import type { Prefs } from "./prefs";
import { dayKey, formatClock, formatRuntime } from "./time";
import {
  FORMAT_LABELS,
  FORMATS,
  type Format,
  type Movie,
  type Showtime,
  type Theater,
} from "./types";

export type TheaterCardData = {
  theater: Theater;
  /** The first showtime you can still make, or null if nothing is left. */
  next: Showtime | null;
  later: Showtime[];
  /** Showtimes that already started; collapsed behind "Show N earlier". */
  earlier: Showtime[];
  /** Upcoming showtimes hidden because only accessible seats are left. */
  hidden: Showtime[];
};

function isHiddenByPrefs(showtime: Showtime, prefs: Prefs): boolean {
  return prefs.hideAccessibleOnly && showtime.accessibleOnly === true;
}

function byStart(a: Showtime, b: Showtime): number {
  return a.startsAt.getTime() - b.startsAt.getTime();
}

/**
 * Theater cards for one movie on one day, sorted by the next showing you can
 * still make. Theaters with nothing left drop to the bottom.
 */
export function buildTheaterCards({
  movieId,
  day,
  now,
  showtimes,
  theaters,
  prefs,
}: {
  movieId: string;
  day: string;
  now: Date;
  showtimes: Showtime[];
  theaters: Theater[];
  prefs: Prefs;
}): TheaterCardData[] {
  const byTheater = new Map<string, Showtime[]>();
  for (const s of showtimes) {
    if (s.movieId !== movieId || dayKey(s.startsAt) !== day) continue;
    byTheater.set(s.theaterId, [...(byTheater.get(s.theaterId) ?? []), s]);
  }

  const cards: TheaterCardData[] = [];
  for (const theater of theaters) {
    const list = byTheater.get(theater.id);
    if (!list || !prefs.groups.includes(theater.group)) continue;

    const sorted = [...list].sort(byStart);
    const started = (s: Showtime) => s.startsAt.getTime() <= now.getTime();
    const upcoming = sorted.filter(
      (s) => !started(s) && !isHiddenByPrefs(s, prefs),
    );

    cards.push({
      theater,
      next: upcoming[0] ?? null,
      later: upcoming.slice(1),
      earlier: sorted.filter((s) => started(s) && !isHiddenByPrefs(s, prefs)),
      hidden: sorted.filter((s) => !started(s) && isHiddenByPrefs(s, prefs)),
    });
  }

  return cards.sort((a, b) => {
    if (a.next && b.next) return byStart(a.next, b.next);
    if (a.next) return -1;
    if (b.next) return 1;
    return a.theater.name.localeCompare(b.theater.name);
  });
}

export type TonightEntry = {
  movie: Movie;
  theaterCount: number;
  /** The first few catchable showtimes across theaters, earliest first. */
  upcoming: Showtime[];
};

/** Movies with showtimes you can still make today, soonest first. */
export function buildTonight({
  now,
  movies,
  showtimes,
  theaters,
  prefs,
  maxTimes = 4,
}: {
  now: Date;
  movies: Movie[];
  showtimes: Showtime[];
  theaters: Theater[];
  prefs: Prefs;
  maxTimes?: number;
}): TonightEntry[] {
  const today = dayKey(now);
  const groupOf = new Map(theaters.map((t) => [t.id, t.group]));
  const catchable = showtimes
    .filter((s) => {
      const group = groupOf.get(s.theaterId);
      return (
        group !== undefined &&
        prefs.groups.includes(group) &&
        !isHiddenByPrefs(s, prefs) &&
        s.startsAt.getTime() > now.getTime() &&
        dayKey(s.startsAt) === today
      );
    })
    .sort(byStart);

  return movies
    .map((movie) => {
      const mine = catchable.filter((s) => s.movieId === movie.id);
      return {
        movie,
        theaterCount: new Set(mine.map((s) => s.theaterId)).size,
        upcoming: mine.slice(0, maxTimes),
      };
    })
    .filter((entry) => entry.upcoming.length > 0)
    .sort((a, b) => byStart(a.upcoming[0], b.upcoming[0]));
}

/** Movies with any showtimes in the loaded window, in catalog order. */
export function moviesWithShowtimes(
  movies: Movie[],
  showtimes: Showtime[],
): Movie[] {
  const ids = new Set(showtimes.map((s) => s.movieId));
  return movies.filter((m) => ids.has(m.id));
}

/** Distinct special formats a movie plays in, e.g. ["imax", "dolby", "70mm"]. */
export function movieFormats(movieId: string, showtimes: Showtime[]): Format[] {
  const used = new Set(
    showtimes.filter((s) => s.movieId === movieId).map((s) => s.format),
  );
  return FORMATS.filter((f) => f !== "standard" && used.has(f));
}

/** "2h 14m · R · IMAX, Dolby, 70mm" (desktop adds the genre after the rating). */
export function movieMeta(
  movie: Movie,
  formats: Format[],
  { withGenre = false }: { withGenre?: boolean } = {},
): string {
  return [
    formatRuntime(movie.runtimeMin),
    movie.rating,
    withGenre ? movie.genre : null,
    formats.length > 0 ? formats.map((f) => FORMAT_LABELS[f]).join(", ") : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Token text: "7:00 Dolby", or just "6:30" for standard showings. */
export function showtimeLabel(showtime: Showtime): string {
  const clock = formatClock(showtime.startsAt);
  return showtime.format === "standard"
    ? clock
    : `${clock} ${FORMAT_LABELS[showtime.format]}`;
}

export function theaterCountLabel(count: number): string {
  return `${count} ${count === 1 ? "theater" : "theaters"}`;
}
