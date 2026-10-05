// Data access. Reads the connectors' snapshot when a data source is configured
// (see lib/live-data.ts) and falls back to mock data otherwise. Session 2 can
// swap in Supabase queries without changing these signatures.
import { liveConfig, loadSnapshot } from "./live-data";
import * as mock from "./mock-data";
import type { Movie, Showtime, Theater, WatchlistEntry } from "./types";

export const LOCATION_LABEL = mock.LOCATION_LABEL;

/** The current time. Frozen to the mockups' moment while on mock data. */
export function getNow(): Date {
  return liveConfig() ? new Date() : mock.MOCK_NOW;
}

export async function getMovies(): Promise<Movie[]> {
  return (await loadSnapshot())?.movies ?? mock.movies;
}

export async function getMovie(id: string): Promise<Movie | null> {
  return (await getMovies()).find((m) => m.id === id) ?? null;
}

export async function getTheaters(): Promise<Theater[]> {
  return (await loadSnapshot())?.theaters ?? mock.theaters;
}

/** Upcoming showtimes (today through the next two weeks). */
export async function getShowtimes(): Promise<Showtime[]> {
  return (await loadSnapshot())?.showtimes ?? mock.showtimes;
}

/** Watchlists aren't stored yet, so live data starts with none. */
export async function getWatchlist(): Promise<WatchlistEntry[]> {
  return (await loadSnapshot()) ? [] : mock.watchlist;
}
