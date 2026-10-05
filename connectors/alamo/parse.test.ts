import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { TheaterRef } from "../types";
import { parseAlamo } from "./parse";

// A real payload for Lower Manhattan, trimmed to Oct 5, 6 and 13, 2026.
const fixture = JSON.parse(
  readFileSync(path.join(__dirname, "fixtures", "2103.json"), "utf8"),
);

const theater: TheaterRef = {
  id: "alamo-lower-manhattan",
  name: "Alamo Lower Manhattan",
  group: "alamo",
  chainLabel: "Alamo",
  source: "alamo",
  sourceId: "2103",
  market: "nyc",
};

describe("parseAlamo", () => {
  const showtimes = parseAlamo(fixture, theater);

  it("flattens every session", () => {
    expect(showtimes.length).toBeGreaterThan(50);
    expect(new Set(showtimes.map((s) => s.sourceShowtimeId)).size).toBe(
      showtimes.length,
    );
  });

  it("parses local times as New York time (EDT in October)", () => {
    const first = showtimes.find((s) => s.sourceShowtimeId === "98476");
    expect(first).toMatchObject({
      title: "AVENGERS ENDGAME: ENCORE (2026)",
      rating: "PG13",
      runtimeMin: 198,
      // 7:30 PM EDT
      startsAt: "2026-10-05T23:30:00.000Z",
      format: "standard",
    });
  });

  it("keeps useful attributes but not the Digital format tag", () => {
    const baby = showtimes.find((s) => s.sourceShowtimeId === "98585");
    expect(baby?.attributes).toEqual(["Baby Day Show"]);
    expect(showtimes.some((s) => s.attributes.includes("Open Caption"))).toBe(
      true,
    );
    expect(showtimes.every((s) => !s.attributes.includes("Digital"))).toBe(
      true,
    );
  });

  it("does not trust FilmYear, which is the booking year", () => {
    expect(showtimes.every((s) => s.year === undefined)).toBe(true);
  });

  it("splits Alamo's event prefixes off the title", () => {
    const ginger = showtimes.find((s) => s.title === "GINGER SNAPS");
    expect(ginger?.attributes).toContain("Terror Tuesday");
    expect(
      showtimes.some(
        (s) => s.title.includes(":") && /^[A-Z][a-z]+ [A-Z]/.test(s.title),
      ),
    ).toBe(false);
  });

  it("drops venue-operations tags", () => {
    const all = showtimes.flatMap((s) => s.attributes);
    expect(all).not.toContain("Digital");
    expect(all.some((a) => /qr ordering|menu add/i.test(a))).toBe(false);
  });

  it("does not call Dolby Atmos sound a Dolby Cinema screen", () => {
    expect(showtimes.every((s) => s.format !== "dolby")).toBe(true);
  });

  it("links to the film page, since the feed has no checkout link", () => {
    const first = showtimes.find((s) => s.sourceShowtimeId === "98476");
    expect(first?.ticketUrl).toBe(
      "https://drafthouse.com/nyc/show/avengers-endgame-encore",
    );
  });

  it("carries series names", () => {
    expect(showtimes.some((s) => s.series === "Terror Tuesday")).toBe(true);
    expect(
      showtimes.find((s) => s.sourceShowtimeId === "98476")?.series,
    ).toBeUndefined();
  });

  it("rejects a payload for a different cinema", () => {
    expect(() => parseAlamo(fixture, { ...theater, sourceId: "9999" })).toThrow(
      /no cinema 9999/,
    );
  });

  it("rejects a feed with no sessions instead of returning an empty schedule", () => {
    const empty = { Calendar: { Cinemas: [{ CinemaId: "2103", Months: [] }] } };
    expect(() => parseAlamo(empty, theater)).toThrow(/no sessions/);
  });

  it("rejects a payload whose shape changed", () => {
    expect(() =>
      parseAlamo({ Calendar: { Cinemas: "nope" } }, theater),
    ).toThrow();
    expect(() => parseAlamo({}, theater)).toThrow();
  });
});
