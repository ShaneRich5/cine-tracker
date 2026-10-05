import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonFileSink } from "../connectors/sinks/json-file";
import type { StoredShowtime } from "../connectors/stored";
import { liveConfig, readSnapshot, toMovie, toShowtime } from "./live-data";

describe("liveConfig", () => {
  it("is null with nothing configured, so the app uses mock data", () => {
    expect(liveConfig({})).toBeNull();
    // A repo without a token isn't enough to read a private repo.
    expect(liveConfig({ GITHUB_DATA_REPO: "a/b" })).toBeNull();
  });

  it("prefers a local folder, then the GitHub data branch", () => {
    expect(
      liveConfig({
        DATA_DIR: ".data",
        GITHUB_DATA_REPO: "a/b",
        GITHUB_DATA_TOKEN: "t",
      }),
    ).toEqual({
      kind: "dir",
      dir: ".data",
    });
    expect(
      liveConfig({ GITHUB_DATA_REPO: "a/b", GITHUB_DATA_TOKEN: "t" }),
    ).toEqual({
      kind: "github",
      repo: "a/b",
      branch: "data",
      token: "t",
    });
  });
});

const stored: StoredShowtime = {
  id: "alamo:1",
  source: "alamo",
  sourceTheaterId: "2103",
  theaterId: "alamo-lower-manhattan",
  movieId: "digger",
  startsAt: "2026-10-05T23:30:00.000Z",
  format: "35mm",
  attributes: ["Open Caption"],
  series: null,
  alistEligible: false,
  accessibleOnly: null,
  ticketUrl: "https://drafthouse.com/nyc/show/digger",
};

describe("mapping to app types", () => {
  it("turns stored showtimes into app showtimes", () => {
    expect(toShowtime(stored)).toEqual({
      id: "alamo:1",
      movieId: "digger",
      theaterId: "alamo-lower-manhattan",
      startsAt: new Date("2026-10-05T23:30:00.000Z"),
      format: "35mm",
      alistEligible: false,
      accessibleOnly: null,
      ticketUrl: "https://drafthouse.com/nyc/show/digger",
    });
  });

  it("fills in what the feeds don't give us, with a stable poster color", () => {
    const movie = toMovie({
      id: "digger",
      title: "Digger",
      year: null,
      runtimeMin: null,
      rating: null,
    });
    expect(movie).toMatchObject({
      title: "Digger",
      runtimeMin: 0,
      rating: "NR",
      genre: null,
      tmdbId: null,
    });
    expect(movie.posterColor).toBe(
      toMovie({
        id: "digger",
        title: "x",
        year: null,
        runtimeMin: 1,
        rating: "R",
      }).posterColor,
    );
    expect(movie.posterColor).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe("readSnapshot", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "ct-live-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("reads what the JSON sink wrote", async () => {
    const sink = new JsonFileSink(dir);
    await sink.writeSource("alamo", {
      showtimes: [stored],
      movies: [
        {
          id: "digger",
          title: "Digger",
          year: null,
          runtimeMin: 108,
          rating: "R",
        },
      ],
    });
    await sink.recordRun({
      source: "alamo",
      status: "ok",
      startedAt: "2026-10-05T23:00:00.000Z",
      finishedAt: "2026-10-05T23:00:05.000Z",
      theatersOk: 3,
      theatersFailed: 0,
      showtimes: 1,
      errors: [],
    });

    const snapshot = await readSnapshot({ kind: "dir", dir });
    expect(snapshot.showtimes).toHaveLength(1);
    expect(snapshot.movies[0]).toMatchObject({
      id: "digger",
      runtimeMin: 108,
      rating: "R",
    });
    expect(snapshot.theaters.map((t) => t.id)).toContain(
      "alamo-lower-manhattan",
    );
    expect(snapshot.status.sources.alamo.status).toBe("ok");
  });

  it("fails loudly when the snapshot is missing or malformed", async () => {
    await expect(readSnapshot({ kind: "dir", dir })).rejects.toThrow();
  });
});
