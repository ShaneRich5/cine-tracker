import { describe, expect, it } from "vitest";
import type { SourceStatus } from "../connectors/stored";
import { getFreshness } from "./freshness";

const now = new Date("2026-10-08T12:00:00Z");

function source(patch: Partial<SourceStatus> = {}): SourceStatus {
  return {
    status: "ok",
    lastRunAt: "2026-10-08T11:40:00Z",
    lastOkAt: "2026-10-08T11:40:00Z",
    theatersOk: 3,
    theatersFailed: 0,
    showtimes: 1000,
    errors: [],
    ...patch,
  };
}

describe("getFreshness", () => {
  it("is fresh after a recent good run", () => {
    expect(getFreshness({ sources: { alamo: source() } }, now)).toEqual({
      updatedAt: new Date("2026-10-08T11:40:00Z"),
      stale: false,
      failing: [],
    });
  });

  it("goes by the oldest source and names failing ones", () => {
    const freshness = getFreshness(
      {
        sources: {
          alamo: source(),
          amc: source({
            status: "failed",
            lastRunAt: "2026-10-08T11:40:00Z",
            lastOkAt: "2026-10-07T20:00:00Z",
          }),
        },
      },
      now,
    );
    expect(freshness).toEqual({
      updatedAt: new Date("2026-10-07T20:00:00Z"),
      stale: true,
      failing: ["amc"],
    });
  });

  it("isn't stale for a run or two going missing", () => {
    expect(
      getFreshness(
        { sources: { alamo: source({ lastOkAt: "2026-10-08T01:00:00Z" }) } },
        now,
      )?.stale,
    ).toBe(false);
  });

  it("is stale when a source never succeeded", () => {
    expect(
      getFreshness(
        { sources: { alamo: source({ status: "failed", lastOkAt: null }) } },
        now,
      ),
    ).toMatchObject({ updatedAt: null, stale: true, failing: ["alamo"] });
  });

  it("has nothing to say without sources", () => {
    expect(getFreshness({ sources: {} }, now)).toBeNull();
  });
});
