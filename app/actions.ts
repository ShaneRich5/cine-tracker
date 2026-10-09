"use server";

import { cookies } from "next/headers";
import { getWatchlistIds } from "@/lib/get-watchlist";
import {
  PREFS_COOKIE,
  PREFS_MAX_AGE,
  parsePrefs,
  serializePrefs,
} from "@/lib/prefs";
import {
  isMovieId,
  toggleWatchlist,
  WATCHLIST_COOKIE,
  WATCHLIST_MAX_AGE,
} from "@/lib/watchlist";

/** Saves preferences to the ct_prefs cookie. The current page re-renders with them. */
export async function savePrefs(input: unknown): Promise<void> {
  const prefs = parsePrefs(input);
  const cookieStore = await cookies();
  cookieStore.set(PREFS_COOKIE, serializePrefs(prefs), {
    path: "/",
    sameSite: "lax",
    maxAge: PREFS_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Adds a movie to the ct_watchlist cookie or removes it. The current page re-renders. */
export async function setWatchlisted(
  movieId: unknown,
  on: unknown,
): Promise<void> {
  if (!isMovieId(movieId) || typeof on !== "boolean") return;
  const cookieStore = await cookies();
  const ids = toggleWatchlist(await getWatchlistIds(), movieId, on);
  cookieStore.set(WATCHLIST_COOKIE, JSON.stringify(ids), {
    path: "/",
    sameSite: "lax",
    maxAge: WATCHLIST_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
