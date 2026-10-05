import { describe, expect, it } from "vitest";
import { MOCK_NOW, movies, showtimes, theaters } from "./mock-data";
import { DEFAULT_PREFS, type Prefs } from "./prefs";
import {
  buildTheaterCards,
  buildTonight,
  movieFormats,
  movieMeta,
  showtimeLabel,
} from "./showtimes";
import { formatClock } from "./time";

const today = "2026-10-05";

function cards(movieId: string, prefs: Prefs = DEFAULT_PREFS, day = today) {
  return buildTheaterCards({
    movieId,
    day,
    now: MOCK_NOW,
    showtimes,
    theaters,
    prefs,
  });
}

const clock = (s: { startsAt: Date } | null) =>
  s ? formatClock(s.startsAt) : null;

describe("buildTheaterCards", () => {
  it("sorts theaters by the next showing you can make", () => {
    const result = cards("harbor-lights");
    expect(result.map((c) => [c.theater.name, clock(c.next)])).toEqual([
      ["AMC Lincoln Square 13", "3:45"],
      ["Alamo Lower Manhattan", "6:30"],
      ["Museum of the Moving Image", "7:30"],
      ["Regal UA Kaufman Astoria", "7:40"],
    ]);
    expect(result[0].later.map(showtimeLabel)).toEqual(["7:00 Dolby", "10:15"]);
  });

  it("hides accessible-only showings when the preference is on", () => {
    const regal = cards("harbor-lights").find(
      (c) => c.theater.id === "regal-kaufman-astoria",
    );
    expect(regal?.hidden.map(clock)).toEqual(["4:20"]);
  });

  it("shows accessible-only showings when the preference is off", () => {
    const result = cards("harbor-lights", {
      ...DEFAULT_PREFS,
      hideAccessibleOnly: false,
    });
    const regal = result.find((c) => c.theater.id === "regal-kaufman-astoria");
    expect(clock(regal?.next ?? null)).toBe("4:20");
    expect(regal?.hidden).toEqual([]);
    expect(result[1].theater.id).toBe("regal-kaufman-astoria");
  });

  it("filters out theater groups that are turned off", () => {
    expect(
      cards("harbor-lights").some((c) => c.theater.group === "other_chain"),
    ).toBe(false);
    const withOthers = cards("harbor-lights", {
      ...DEFAULT_PREFS,
      groups: [...DEFAULT_PREFS.groups, "other_chain"],
    });
    expect(
      withOthers.find((c) => c.theater.id === "village-east")?.next,
    ).toBeTruthy();
  });

  it("collapses started showings and drops theaters with nothing left to the bottom", () => {
    const result = cards("night-ferry");
    const last = result[result.length - 1];
    expect(last.theater.id).toBe("momi");
    expect(last.next).toBeNull();
    expect(last.earlier.map(clock)).toEqual(["12:00"]);

    const alamo = result.find((c) => c.theater.id === "alamo-lower-manhattan");
    expect(alamo?.earlier.map(clock)).toEqual(["1:15"]);
    expect(clock(alamo?.next ?? null)).toBe("6:30");
  });

  it("treats every showing on a later day as upcoming", () => {
    const result = cards("night-ferry", DEFAULT_PREFS, "2026-10-06");
    expect(result.every((c) => c.next && c.earlier.length === 0)).toBe(true);
    expect(result[0].theater.id).toBe("momi");
  });
});

describe("buildTonight", () => {
  it("lists catchable movies with their next times, soonest first", () => {
    const result = buildTonight({
      now: MOCK_NOW,
      movies,
      showtimes,
      theaters,
      prefs: DEFAULT_PREFS,
    });
    expect(
      result.map((e) => [
        e.movie.title,
        e.theaterCount,
        e.upcoming.map(showtimeLabel),
      ]),
    ).toEqual([
      ["Harbor Lights", 4, ["3:45 IMAX", "6:30", "7:00 Dolby", "7:30 70mm"]],
      ["Night Ferry", 3, ["4:20", "6:30", "8:15"]],
      ["Low Tide Motel", 2, ["7:10", "9:55"]],
      ["Paper Moons", 1, ["7:30 70mm"]],
    ]);
  });
});

describe("movieMeta", () => {
  it("summarizes runtime, rating and special formats", () => {
    const harbor = movies.find((m) => m.id === "harbor-lights")!;
    const formats = movieFormats(harbor.id, showtimes);
    expect(movieMeta(harbor, formats)).toBe(
      "2h 14m · R · IMAX, Dolby, 70mm, RPX",
    );
    expect(movieMeta(harbor, formats, { withGenre: true })).toBe(
      "2h 14m · R · Drama · IMAX, Dolby, 70mm, RPX",
    );
  });
});
