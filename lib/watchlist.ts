import type { Prefs } from "./prefs";
import { dayKey, formatClock, weekdayLabel } from "./time";
import type { Movie, Showtime, Theater, WatchlistEntry } from "./types";

export const WATCHLIST_COOKIE = "ct_watchlist";
export const WATCHLIST_MAX_AGE = 60 * 60 * 24 * 365;
/** Keeps the cookie well under the 4KB browser limit. */
export const WATCHLIST_MAX = 100;

const MOVIE_ID = /^[a-z0-9-]{1,120}$/;

export function isMovieId(value: unknown): value is string {
  return typeof value === "string" && MOVIE_ID.test(value);
}

/** Movie IDs from the ct_watchlist cookie, or null when there is no cookie. */
export function parseWatchlistCookie(
  value: string | undefined,
): string[] | null {
  if (!value) return null;
  try {
    const raw: unknown = JSON.parse(value);
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.filter(isMovieId))].slice(0, WATCHLIST_MAX);
  } catch {
    return [];
  }
}

/** Adds or removes one movie. The newest addition goes first. */
export function toggleWatchlist(
  ids: string[],
  movieId: string,
  on: boolean,
): string[] {
  const rest = ids.filter((id) => id !== movieId);
  return on ? [movieId, ...rest].slice(0, WATCHLIST_MAX) : rest;
}

/**
 * One chip per watchlisted movie that still exists, noting its next showing
 * at the theaters you follow. Showings today are highlighted.
 */
export function buildWatchlist({
  ids,
  now,
  movies,
  showtimes,
  theaters,
  prefs,
}: {
  ids: string[];
  now: Date;
  movies: Movie[];
  showtimes: Showtime[];
  theaters: Theater[];
  prefs: Prefs;
}): WatchlistEntry[] {
  const known = new Set(movies.map((m) => m.id));
  const groupOf = new Map(theaters.map((t) => [t.id, t.group]));
  const today = dayKey(now);

  return ids
    .filter((id) => known.has(id))
    .map((movieId) => {
      const next = showtimes
        .filter((s) => {
          const group = groupOf.get(s.theaterId);
          return (
            s.movieId === movieId &&
            group !== undefined &&
            prefs.groups.includes(group) &&
            !(prefs.hideAccessibleOnly && s.accessibleOnly === true) &&
            s.startsAt.getTime() > now.getTime()
          );
        })
        .reduce<Showtime | null>(
          (soonest, s) =>
            !soonest || s.startsAt < soonest.startsAt ? s : soonest,
          null,
        );

      if (!next) return { movieId, note: "no showtimes", highlight: false };
      const isToday = dayKey(next.startsAt) === today;
      return {
        movieId,
        note: `${isToday ? "today" : weekdayLabel(next.startsAt)} ${formatClock(next.startsAt)}`,
        highlight: isToday,
      };
    });
}
