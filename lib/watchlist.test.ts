import { describe, expect, it } from "vitest";
import { MOCK_NOW, MOCK_TODAY, movies, showtimes, theaters } from "./mock-data";
import { DEFAULT_PREFS, type Prefs } from "./prefs";
import { zonedDate } from "./time";
import {
  buildWatchlist,
  parseWatchlistCookie,
  toggleWatchlist,
  WATCHLIST_MAX,
} from "./watchlist";

function build(ids: string[], prefs: Prefs = DEFAULT_PREFS, now = MOCK_NOW) {
  return buildWatchlist({ ids, now, movies, showtimes, theaters, prefs });
}

describe("parseWatchlistCookie", () => {
  it("returns null when there is no cookie, so defaults can apply", () => {
    expect(parseWatchlistCookie(undefined)).toBeNull();
  });

  it("keeps valid, unique movie IDs", () => {
    expect(
      parseWatchlistCookie(
        JSON.stringify(["digger", "digger", "Bad ID!", 42, "psycho-1960"]),
      ),
    ).toEqual(["digger", "psycho-1960"]);
  });

  it("treats a malformed cookie as an empty watchlist", () => {
    expect(parseWatchlistCookie("{not json")).toEqual([]);
    expect(parseWatchlistCookie('{"a":1}')).toEqual([]);
  });

  it("caps the list", () => {
    const ids = Array.from({ length: WATCHLIST_MAX + 5 }, (_, i) => `m-${i}`);
    expect(parseWatchlistCookie(JSON.stringify(ids))).toHaveLength(
      WATCHLIST_MAX,
    );
  });
});

describe("toggleWatchlist", () => {
  it("adds new movies to the front without duplicates", () => {
    expect(toggleWatchlist(["a", "b"], "b", true)).toEqual(["b", "a"]);
    expect(toggleWatchlist(["a"], "c", true)).toEqual(["c", "a"]);
  });

  it("removes movies", () => {
    expect(toggleWatchlist(["a", "b"], "a", false)).toEqual(["b"]);
  });
});

describe("buildWatchlist", () => {
  it("notes the next showing today at a theater you follow", () => {
    expect(build(["night-ferry", "paper-moons"])).toEqual([
      { movieId: "night-ferry", note: "today 4:20", highlight: true },
      { movieId: "paper-moons", note: "today 7:30", highlight: true },
    ]);
  });

  it("skips theater groups you've turned off", () => {
    const [entry] = build(["night-ferry"], {
      ...DEFAULT_PREFS,
      groups: ["alamo"],
    });
    expect(entry.note).toBe("today 6:30");
  });

  it("names the weekday when nothing is left today", () => {
    // Monday 11:59 PM: everything today has started; MoMI has a noon matinee.
    const lateNight = zonedDate(MOCK_TODAY, "23:59");
    expect(build(["night-ferry"], DEFAULT_PREFS, lateNight)).toEqual([
      { movieId: "night-ferry", note: "Tue 12:00", highlight: false },
    ]);
  });

  it("says when a movie has no showtimes, and drops movies that are gone", () => {
    expect(build(["glass-orchard", "no-such-movie"])).toEqual([
      { movieId: "glass-orchard", note: "no showtimes", highlight: false },
    ]);
  });
});
