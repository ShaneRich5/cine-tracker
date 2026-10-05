import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFS,
  groupsSummary,
  parsePrefs,
  parsePrefsCookie,
  serializePrefs,
} from "./prefs";

describe("parsePrefs", () => {
  it("falls back to defaults for non-objects", () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("amc")).toEqual(DEFAULT_PREFS);
  });

  it("keeps known values and drops unknown ones", () => {
    expect(
      parsePrefs({
        groups: ["local", "amc", "drive_in"],
        formats: ["70mm", "smell-o-vision"],
        hideAccessibleOnly: false,
        layout: "timeline",
      }),
    ).toEqual({
      groups: ["amc", "local"],
      formats: ["70mm"],
      hideAccessibleOnly: false,
      layout: "timeline",
    });
  });

  it("allows every group to be turned off", () => {
    expect(parsePrefs({ groups: [] }).groups).toEqual([]);
  });

  it("defaults fields with the wrong type", () => {
    expect(
      parsePrefs({ groups: "amc", hideAccessibleOnly: "yes", layout: "grid" }),
    ).toEqual(DEFAULT_PREFS);
  });
});

describe("parsePrefsCookie", () => {
  it("round-trips serialized prefs", () => {
    const prefs = { ...DEFAULT_PREFS, groups: ["regal" as const] };
    expect(parsePrefsCookie(serializePrefs(prefs))).toEqual(prefs);
  });

  it("ignores missing or malformed cookies", () => {
    expect(parsePrefsCookie(undefined)).toEqual(DEFAULT_PREFS);
    expect(parsePrefsCookie("{not json")).toEqual(DEFAULT_PREFS);
  });
});

describe("groupsSummary", () => {
  it("lists enabled groups in display order", () => {
    expect(groupsSummary(DEFAULT_PREFS)).toBe("AMC, Regal, Alamo, local");
    expect(groupsSummary({ ...DEFAULT_PREFS, groups: [] })).toBe(
      "no theater groups",
    );
  });
});
