import { describe, expect, it } from "vitest";
import {
  cleanTitle,
  detectFormat,
  movieId,
  normalizeRating,
  titleCase,
} from "./normalize";

describe("titleCase", () => {
  it("fixes ALL CAPS titles", () => {
    expect(titleCase("AVENGERS ENDGAME: ENCORE")).toBe(
      "Avengers Endgame: Encore",
    );
    expect(titleCase("THE HISTORY OF CONCRETE")).toBe(
      "The History of Concrete",
    );
    expect(titleCase("COYOTE VS. ACME")).toBe("Coyote vs. Acme");
    expect(titleCase("ROCKY II")).toBe("Rocky II");
  });

  it("leaves mixed-case titles alone", () => {
    expect(titleCase("Ha-Chan Shake Your Booty")).toBe(
      "Ha-Chan Shake Your Booty",
    );
  });
});

describe("cleanTitle", () => {
  it("moves event prefixes to attributes and pulls out the year", () => {
    expect(cleanTitle("Open Caption: RESIDENT EVIL (2026)")).toEqual({
      title: "Resident Evil",
      year: 2026,
      attributes: ["Open Caption"],
    });
    expect(cleanTitle("Sing-Along: BUDDY (2026)")).toMatchObject({
      title: "Buddy",
      attributes: ["Sing-Along"],
    });
  });

  it("handles plain titles", () => {
    expect(cleanTitle("DIGGER")).toEqual({
      title: "Digger",
      year: null,
      attributes: [],
    });
  });
});

describe("movieId", () => {
  it("slugifies and adds the year when known", () => {
    expect(movieId("Casino Royale", 2006)).toBe("casino-royale-2006");
    expect(movieId("Digger", null)).toBe("digger");
    expect(movieId("Don't Look Up!", null)).toBe("dont-look-up");
  });
});

describe("normalizeRating", () => {
  it("canonicalizes ratings", () => {
    expect(normalizeRating("PG13")).toBe("PG-13");
    expect(normalizeRating("R")).toBe("R");
    expect(normalizeRating("NOTRATED")).toBe("NR");
    expect(normalizeRating("")).toBeNull();
    expect(normalizeRating(undefined)).toBeNull();
  });
});

describe("detectFormat", () => {
  it("maps tags to the canonical format", () => {
    expect(detectFormat(["Digital"])).toBe("standard");
    expect(detectFormat(["Presented in 35mm"])).toBe("35mm");
    expect(detectFormat(["IMAX 70mm"])).toBe("70mm");
    expect(detectFormat(["IMAX with Laser"])).toBe("imax");
    expect(detectFormat(["Dolby Cinema at AMC"])).toBe("dolby");
    expect(detectFormat(["Dolby Atmos"])).toBe("standard");
    expect(detectFormat(["RealD 3D"])).toBe("3d");
    expect(detectFormat([null, undefined])).toBe("standard");
  });
});
