// Data access. Backed by mock data for now; session 2 swaps these for
// Supabase queries without changing their signatures.
import * as mock from "./mock-data";
import type { Movie, Showtime, Theater, WatchlistEntry } from "./types";

export const LOCATION_LABEL = mock.LOCATION_LABEL;

/** The current time. Frozen to the mockups' moment while on mock data. */
export function getNow(): Date {
  return mock.MOCK_NOW;
}

export async function getMovies(): Promise<Movie[]> {
  return mock.movies;
}

export async function getMovie(id: string): Promise<Movie | null> {
  return mock.movies.find((m) => m.id === id) ?? null;
}

export async function getTheaters(): Promise<Theater[]> {
  return mock.theaters;
}

/** Upcoming showtimes (today through the next week). */
export async function getShowtimes(): Promise<Showtime[]> {
  return mock.showtimes;
}

export async function getWatchlist(): Promise<WatchlistEntry[]> {
  return mock.watchlist;
}
