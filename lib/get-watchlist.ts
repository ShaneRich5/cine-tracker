import { cookies } from "next/headers";
import { liveConfig } from "./live-data";
import { watchlistIds as mockWatchlistIds } from "./mock-data";
import { parseWatchlistCookie, WATCHLIST_COOKIE } from "./watchlist";

/**
 * Watchlisted movie IDs from the ct_watchlist cookie, newest first. Until you
 * change it, mock data starts with the mockups' watchlist and live data with none.
 */
export async function getWatchlistIds(): Promise<string[]> {
  const cookieStore = await cookies();
  return (
    parseWatchlistCookie(cookieStore.get(WATCHLIST_COOKIE)?.value) ??
    (liveConfig() ? [] : mockWatchlistIds)
  );
}
