import { describe, expect, it } from "vitest";
import {
  addDays,
  dayKey,
  formatAgo,
  formatClock,
  formatClockLong,
  formatDayLabel,
  formatRuntime,
  formatStartsIn,
  getDayOptions,
  zonedDate,
} from "./time";

describe("zonedDate", () => {
  it("interprets clock times in New York (EDT in October)", () => {
    expect(zonedDate("2026-10-05", "15:45").toISOString()).toBe(
      "2026-10-05T19:45:00.000Z",
    );
  });

  it("handles EST after the clocks change", () => {
    expect(zonedDate("2026-11-10", "19:00").toISOString()).toBe(
      "2026-11-11T00:00:00.000Z",
    );
  });
});

describe("dayKey", () => {
  it("uses the New York calendar day, not UTC", () => {
    // 11:30 PM in New York is already the next day in UTC.
    expect(dayKey(zonedDate("2026-10-05", "23:30"))).toBe("2026-10-05");
  });
});

describe("addDays", () => {
  it("rolls over months", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });
});

describe("formatting", () => {
  const at = zonedDate("2026-10-05", "15:45");

  it("formats compact and long clock times", () => {
    expect(formatClock(at)).toBe("3:45");
    expect(formatClock(zonedDate("2026-10-05", "22:15"))).toBe("10:15");
    expect(formatClockLong(at)).toBe("3:45 PM");
  });

  it("formats the day label", () => {
    expect(formatDayLabel(at)).toBe("Mon, Oct 5");
  });

  it("formats runtimes", () => {
    expect(formatRuntime(134)).toBe("2h 14m");
    expect(formatRuntime(120)).toBe("2h");
    expect(formatRuntime(45)).toBe("45m");
  });

  it("formats time until a showing like the mockups", () => {
    const minutes = (n: number) => n * 60_000;
    expect(formatStartsIn(minutes(65))).toBe("Starts in 1h 05m");
    expect(formatStartsIn(minutes(300))).toBe("Starts in 5h");
    expect(formatStartsIn(minutes(50))).toBe("Starts in 50m");
    expect(formatStartsIn(0)).toBe("Starting now");
  });
});

describe("getDayOptions", () => {
  it("starts today and labels each day", () => {
    const days = getDayOptions(zonedDate("2026-10-05", "14:40"));
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({
      key: "2026-10-05",
      weekday: "Mon",
      dayOfMonth: "5",
      label: "Mon, Oct 5",
    });
    expect(days[6].label).toBe("Sun, Oct 11");
  });
});

describe("formatAgo", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  const before = (minutes: number) =>
    new Date(now.getTime() - minutes * 60_000);

  it("rounds down to minutes, hours, then days", () => {
    expect(formatAgo(before(0.5), now)).toBe("just now");
    expect(formatAgo(before(12), now)).toBe("12m ago");
    expect(formatAgo(before(59), now)).toBe("59m ago");
    expect(formatAgo(before(5 * 60 + 30), now)).toBe("5h ago");
    expect(formatAgo(before(3 * 24 * 60), now)).toBe("3d ago");
  });
});
