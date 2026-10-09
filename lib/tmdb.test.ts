import { afterEach, describe, expect, it, vi } from "vitest";
import {
  findMovie,
  pickExact,
  searchQueries,
  withTmdb,
  type SearchResult,
} from "./tmdb";
import type { Movie } from "./types";

function result(patch: Partial<SearchResult> & { id: number }): SearchResult {
  return { title: "Untitled", poster_path: null, ...patch };
}

/** Stubs fetch with TMDB search results keyed by "query" or "query|year". */
function stubSearch(responses: Record<string, SearchResult[]>) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL) => {
      const query = input.searchParams.get("query") ?? "";
      const year = input.searchParams.get("primary_release_year");
      const key = year ? `${query}|${year}` : query;
      calls.push(key);
      return Response.json({ results: responses[key] ?? [] });
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchQueries", () => {
  it("drops event wording after the title", () => {
    expect(searchQueries("MOONLIGHT 10th Anniversary Remastered")).toEqual([
      "MOONLIGHT",
    ]);
    expect(searchQueries("PAN'S LABYRINTH 20th Anniversary")).toEqual([
      "PAN'S LABYRINTH",
    ]);
    expect(searchQueries("OTHER MOMMY Fan Event Screening")).toEqual([
      "OTHER MOMMY",
    ]);
  });

  it("falls back to the part after an event prefix", () => {
    expect(searchQueries("HDR By Barco: AVENGERS ENDGAME: ENCORE")).toEqual([
      "HDR By Barco: AVENGERS ENDGAME: ENCORE",
      "AVENGERS ENDGAME: ENCORE",
    ]);
    expect(searchQueries("Nyff: Fjord")).toEqual(["Nyff: Fjord", "Fjord"]);
  });

  it("leaves ordinary titles alone", () => {
    expect(searchQueries("Restoration at Grayson Manor")).toEqual([
      "Restoration at Grayson Manor",
    ]);
    expect(searchQueries("Verity")).toEqual(["Verity"]);
  });
});

describe("pickExact", () => {
  const results = [
    result({
      id: 1,
      title: "Beetlejuice Beetlejuice",
      release_date: "2024-09-04",
    }),
    result({ id: 2, title: "Beetlejuice", release_date: "1988-03-29" }),
  ];

  it("prefers an exact title match over TMDB's top result", () => {
    expect(pickExact(results, "Beetlejuice")?.id).toBe(2);
  });

  it("ignores case, punctuation and a leading The", () => {
    expect(
      pickExact(
        [result({ id: 3, title: "The Texas Chain Saw Massacre" })],
        "TEXAS CHAIN SAW MASSACRE",
      )?.id,
    ).toBe(3);
  });

  it("returns null without an exact match", () => {
    expect(pickExact(results, "Beetle")).toBeNull();
  });
});

describe("findMovie", () => {
  it("tries the year in the title first so remakes don't win", async () => {
    stubSearch({
      "Nosferatu|1922": [result({ id: 1922, title: "Nosferatu" })],
      Nosferatu: [result({ id: 2024, title: "Nosferatu" })],
    });
    expect((await findMovie("Nosferatu", 1922, "key"))?.id).toBe(1922);
  });

  it("drops a wrong year (a re-release's) and searches again", async () => {
    stubSearch({
      "Avengers Endgame: Encore": [
        result({ id: 299534, title: "Avengers: Endgame" }),
      ],
    });
    expect((await findMovie("Avengers Endgame: Encore", 2026, "key"))?.id).toBe(
      299534,
    );
  });

  it("strips an event prefix when the full title finds nothing", async () => {
    const calls = stubSearch({ Fjord: [result({ id: 7, title: "Fjord" })] });
    expect((await findMovie("Nyff: Fjord", null, "key"))?.id).toBe(7);
    expect(calls).toEqual(["Nyff: Fjord", "Fjord"]);
  });

  it("returns null when nothing matches", async () => {
    stubSearch({});
    expect(await findMovie("DISMEMBER THE ALAMO 2026", null, "key")).toBeNull();
  });
});

describe("withTmdb", () => {
  const movie: Movie = {
    id: "verity",
    tmdbId: null,
    title: "Verity",
    runtimeMin: 0,
    rating: "NR",
    genre: null,
    posterColor: "#2E3F7A",
  };

  it("fills in poster, genre and synopsis", async () => {
    stubSearch({
      Verity: [
        result({
          id: 42,
          title: "Verity",
          poster_path: "/abc.jpg",
          overview: "  A writer takes a job.  ",
          genre_ids: [9648, 53],
        }),
      ],
    });
    expect(await withTmdb([movie], "key")).toEqual([
      {
        ...movie,
        tmdbId: 42,
        posterUrl: "https://image.tmdb.org/t/p/w342/abc.jpg",
        genre: "Mystery",
        synopsis: "A writer takes a job.",
      },
    ]);
  });

  it("leaves movies alone without a key or a match", async () => {
    stubSearch({});
    expect(await withTmdb([movie], "")).toEqual([movie]);
    expect(await withTmdb([movie], "key")).toEqual([movie]);
  });
});
