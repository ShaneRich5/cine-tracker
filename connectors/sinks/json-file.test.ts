import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  moviesFileSchema,
  showtimesFileSchema,
  statusFileSchema,
  type SourceSnapshot,
  type StoredShowtime,
} from "../stored";
import type { RunSummary } from "../types";
import { JsonFileSink } from "./json-file";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "ct-sink-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function row(id: string, startsAt: string, source = "alamo"): StoredShowtime {
  return {
    id,
    source,
    sourceTheaterId: "2103",
    theaterId: "alamo-lower-manhattan",
    movieId: "digger-2026",
    startsAt,
    format: "standard",
    attributes: [],
    series: null,
    alistEligible: false,
    accessibleOnly: null,
    ticketUrl: null,
  };
}

const movie = {
  id: "digger-2026",
  title: "Digger",
  year: 2026,
  runtimeMin: 108,
  rating: "R",
};

function run(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    source: "alamo",
    status: "ok",
    startedAt: "2026-10-05T18:00:00.000Z",
    finishedAt: "2026-10-05T18:00:05.000Z",
    theatersOk: 3,
    theatersFailed: 0,
    showtimes: 2,
    errors: [],
    ...overrides,
  };
}

const read = (file: string) => readFile(path.join(dir, file), "utf8");

describe("JsonFileSink", () => {
  it("returns an empty snapshot before the first run", async () => {
    expect(await new JsonFileSink(dir).readSource("alamo")).toEqual({
      showtimes: [],
      movies: [],
    });
  });

  it("round-trips a source and compiles the files the app reads", async () => {
    const sink = new JsonFileSink(dir);
    const snapshot: SourceSnapshot = {
      showtimes: [
        row("alamo:2", "2026-10-06T23:00:00.000Z"),
        row("alamo:1", "2026-10-05T23:00:00.000Z"),
      ],
      movies: [movie],
    };
    await sink.writeSource("alamo", snapshot);

    expect((await sink.readSource("alamo")).showtimes.map((s) => s.id)).toEqual(
      ["alamo:1", "alamo:2"],
    );
    const showtimes = showtimesFileSchema.parse(
      JSON.parse(await read("showtimes.json")),
    );
    expect(showtimes.showtimes.map((s) => s.id)).toEqual([
      "alamo:1",
      "alamo:2",
    ]);
    expect(
      moviesFileSchema.parse(JSON.parse(await read("movies.json"))).movies,
    ).toEqual([movie]);
  });

  it("merges sources, and rewriting one source leaves the other alone", async () => {
    const sink = new JsonFileSink(dir);
    await sink.writeSource("alamo", {
      showtimes: [row("alamo:1", "2026-10-05T23:00:00.000Z")],
      movies: [movie],
    });
    await sink.writeSource("regal", {
      showtimes: [row("regal:1", "2026-10-05T22:00:00.000Z", "regal")],
      movies: [movie],
    });
    await sink.writeSource("alamo", { showtimes: [], movies: [] });

    const compiled = showtimesFileSchema.parse(
      JSON.parse(await read("showtimes.json")),
    );
    expect(compiled.showtimes.map((s) => s.id)).toEqual(["regal:1"]);
    expect(
      moviesFileSchema.parse(JSON.parse(await read("movies.json"))).movies,
    ).toHaveLength(1);
  });

  it("writes identical files when nothing changed, so git sees no diff", async () => {
    const sink = new JsonFileSink(dir);
    const snapshot = {
      showtimes: [row("alamo:1", "2026-10-05T23:00:00.000Z")],
      movies: [movie],
    };
    await sink.writeSource("alamo", snapshot);
    const before = await Promise.all(
      ["showtimes.json", "movies.json", "sources/alamo.json"].map(read),
    );
    await sink.writeSource("alamo", {
      ...snapshot,
      showtimes: [...snapshot.showtimes],
    });
    const after = await Promise.all(
      ["showtimes.json", "movies.json", "sources/alamo.json"].map(read),
    );
    expect(after).toEqual(before);
  });

  it("tracks the last fully successful run in status.json", async () => {
    const sink = new JsonFileSink(dir);
    await sink.recordRun(run());
    await sink.recordRun(
      run({
        status: "failed",
        finishedAt: "2026-10-05T19:00:05.000Z",
        theatersOk: 0,
        theatersFailed: 3,
        errors: ["HTTP 503"],
      }),
    );

    const status = statusFileSchema.parse(
      JSON.parse(await read("status.json")),
    );
    expect(status.sources.alamo).toMatchObject({
      status: "failed",
      lastRunAt: "2026-10-05T19:00:05.000Z",
      lastOkAt: "2026-10-05T18:00:05.000Z",
      errors: ["HTTP 503"],
    });
  });
});
