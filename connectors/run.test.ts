import { describe, expect, it, vi } from "vitest";
import { runSource, type RunOptions } from "./run";
import type { SourceSnapshot } from "./stored";
import type {
  Connector,
  NormalizedShowtime,
  RunSummary,
  Sink,
  TheaterRef,
} from "./types";

const NOW = new Date("2026-10-05T18:40:00.000Z"); // 2:40 PM in New York

const theaters: TheaterRef[] = ["1", "2"].map((n) => ({
  id: `t${n}`,
  name: `Theater ${n}`,
  group: "alamo",
  chainLabel: "Test",
  source: "test",
  sourceId: n,
  market: "nyc",
}));

function showtime(
  id: string,
  startsAt: string,
  title = "OPEN CAPTION: HARBOR LIGHTS (2026)",
): NormalizedShowtime {
  return {
    sourceShowtimeId: id,
    title,
    rating: "PG13",
    runtimeMin: 134,
    startsAt,
    format: "standard",
    attributes: ["Kid Friendly"],
  };
}

function memorySink(initial?: SourceSnapshot) {
  const state = {
    snapshot: initial ?? { showtimes: [], movies: [] },
    writes: 0,
    runs: [] as RunSummary[],
  };
  const sink: Sink = {
    readSource: async () => state.snapshot,
    writeSource: async (_source, snapshot) => {
      state.snapshot = snapshot;
      state.writes++;
    },
    recordRun: async (run) => {
      state.runs.push(run);
    },
  };
  return { sink, state };
}

function options(sink: Sink, overrides: Partial<RunOptions> = {}): RunOptions {
  return {
    sink,
    now: NOW,
    windowDays: 14,
    dryRun: false,
    delayMs: 0,
    retries: 0,
    log: () => {},
    ...overrides,
  };
}

function connector(
  perTheater: Record<string, NormalizedShowtime[] | Error>,
): Connector {
  return {
    source: "test",
    fetchTheater: async (t) => {
      const result = perTheater[t.sourceId];
      if (result instanceof Error) throw result;
      return result;
    },
    parse: (raw) => raw as NormalizedShowtime[],
  };
}

describe("runSource", () => {
  it("cleans titles, builds movies and stores UTC times", async () => {
    const { sink, state } = memorySink();
    const summary = await runSource(
      connector({
        "1": [showtime("a", "2026-10-05T23:30:00.000Z")],
        "2": [showtime("b", "2026-10-06T23:30:00.000Z")],
      }),
      theaters,
      options(sink),
    );

    expect(summary).toMatchObject({
      status: "ok",
      theatersOk: 2,
      theatersFailed: 0,
      showtimes: 2,
    });
    expect(state.snapshot.movies).toEqual([
      {
        id: "harbor-lights-2026",
        title: "Harbor Lights",
        year: 2026,
        runtimeMin: 134,
        rating: "PG-13",
      },
    ]);
    expect(state.snapshot.showtimes[0]).toMatchObject({
      id: "test:a",
      theaterId: "t1",
      sourceTheaterId: "1",
      movieId: "harbor-lights-2026",
      attributes: ["Kid Friendly", "Open Caption"],
      alistEligible: false,
      accessibleOnly: null,
    });
  });

  it("keeps a failed theater's previous showtimes and still updates the others", async () => {
    const first = memorySink();
    await runSource(
      connector({
        "1": [showtime("a", "2026-10-05T23:30:00.000Z")],
        "2": [showtime("b", "2026-10-05T23:30:00.000Z")],
      }),
      theaters,
      options(first.sink),
    );

    const { sink, state } = memorySink(first.state.snapshot);
    const summary = await runSource(
      connector({
        "1": new Error("HTTP 503"),
        "2": [showtime("c", "2026-10-06T23:30:00.000Z")],
      }),
      theaters,
      options(sink),
    );

    expect(summary).toMatchObject({
      status: "partial",
      theatersOk: 1,
      theatersFailed: 1,
    });
    expect(summary.errors).toEqual(["Theater 1: HTTP 503"]);
    expect(state.snapshot.showtimes.map((s) => s.id).sort()).toEqual([
      "test:a",
      "test:c",
    ]);
    expect(state.snapshot.movies).toHaveLength(1);
  });

  it("writes nothing when every theater fails, but records the failed run", async () => {
    const first = memorySink();
    await runSource(
      connector({ "1": [showtime("a", "2026-10-05T23:30:00.000Z")], "2": [] }),
      theaters.slice(0, 1),
      options(first.sink),
    );

    const { sink, state } = memorySink(first.state.snapshot);
    const summary = await runSource(
      connector({ "1": new Error("boom"), "2": new Error("boom") }),
      theaters,
      options(sink),
    );

    expect(summary.status).toBe("failed");
    expect(state.writes).toBe(0);
    expect(state.snapshot.showtimes).toHaveLength(1);
    expect(state.runs).toHaveLength(1);
  });

  it("treats a parse error like a failed fetch", async () => {
    const { sink } = memorySink();
    const bad: Connector = {
      source: "test",
      fetchTheater: async () => ({}),
      parse: () => {
        throw new Error("feed has no sessions");
      },
    };
    const summary = await runSource(bad, theaters.slice(0, 1), options(sink));
    expect(summary.status).toBe("failed");
    expect(summary.errors[0]).toBe("Theater 1: feed has no sessions");
  });

  it("keeps only showtimes inside the window, counting today", async () => {
    const { sink, state } = memorySink();
    await runSource(
      connector({
        "1": [
          showtime("yesterday", "2026-10-04T23:30:00.000Z"),
          showtime("today", "2026-10-05T14:00:00.000Z"), // 10 AM, already started
          showtime("last-day", "2026-10-06T23:30:00.000Z"),
          showtime("too-far", "2026-10-07T23:30:00.000Z"),
        ],
      }),
      theaters.slice(0, 1),
      options(sink, { windowDays: 2 }),
    );
    expect(state.snapshot.showtimes.map((s) => s.id).sort()).toEqual([
      "test:last-day",
      "test:today",
    ]);
  });

  it("retries a failed fetch before giving up", async () => {
    const { sink } = memorySink();
    const fetchTheater = vi
      .fn()
      .mockRejectedValueOnce(new Error("flaky"))
      .mockResolvedValue([showtime("a", "2026-10-05T23:30:00.000Z")]);
    const flaky: Connector = {
      source: "test",
      fetchTheater,
      parse: (raw) => raw as NormalizedShowtime[],
    };

    const summary = await runSource(
      flaky,
      theaters.slice(0, 1),
      options(sink, { retries: 1, delayMs: 1 }),
    );
    expect(summary.status).toBe("ok");
    expect(fetchTheater).toHaveBeenCalledTimes(2);
  });

  it("does not write in a dry run", async () => {
    const { sink, state } = memorySink();
    const log = vi.fn();
    await runSource(
      connector({ "1": [showtime("a", "2026-10-05T23:30:00.000Z")] }),
      theaters.slice(0, 1),
      options(sink, { dryRun: true, log }),
    );
    expect(state.writes).toBe(0);
    expect(state.runs).toHaveLength(0);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("(+1 -0) [dry run, nothing written]"),
    );
  });
});
