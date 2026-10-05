import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./paths";

describe("safeReturnPath", () => {
  it("accepts same-origin paths", () => {
    expect(safeReturnPath("/movies/harbor-lights")).toBe(
      "/movies/harbor-lights",
    );
  });

  it("rejects anything that could leave the site", () => {
    expect(safeReturnPath("https://example.com")).toBeNull();
    expect(safeReturnPath("//example.com")).toBeNull();
    expect(safeReturnPath("/\\example.com")).toBeNull();
    expect(safeReturnPath(["/a", "/b"])).toBeNull();
    expect(safeReturnPath(undefined)).toBeNull();
  });
});
