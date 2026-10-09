// Data access. Reads the connectors' snapshot when a data source is configured
// (see lib/live-data.ts) and falls back to mock data otherwise. Session 2 can
// swap in Supabase queries without changing these signatures.
import { cache } from "react";
import { liveConfig, loadSnapshot } from "./live-data";
import * as mock from "./mock-data";
import { withTmdb } from "./tmdb";
import type { StatusFile } from "../connectors/stored";
import type { Movie, Showtime, Theater } from "./types";

export const LOCATION_LABEL = mock.LOCATION_LABEL;

/** The current time. Frozen to the mockups' moment while on mock data. */
export function getNow(): Date {
  return liveConfig() ? new Date() : mock.MOCK_NOW;
}

/** Live movies get TMDB posters and details; the mock titles are made up, so they don't. */
export const getMovies = cache(async (): Promise<Movie[]> => {
  const snapshot = await loadSnapshot();
  return snapshot ? withTmdb(snapshot.movies) : mock.movies;
});

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

/** The connectors' last run per source; null on mock data. */
export async function getStatus(): Promise<StatusFile | null> {
  return (await loadSnapshot())?.status ?? null;
}
