/** All showtimes display in New York time, wherever the server runs. */
export const TIME_ZONE = "America/New_York";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function zonedParts(date: Date) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function offsetMs(date: Date): number {
  const p = zonedParts(date);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Builds a Date from a New York calendar day ("2026-10-05") and clock time ("15:45"). */
export function zonedDate(dayKey: string, time: string): Date {
  const [year, month, day] = dayKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  return new Date(guess - offsetMs(new Date(guess)));
}

/** The New York calendar day for an instant, as "YYYY-MM-DD". */
export function dayKey(date: Date): string {
  const p = zonedParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function addDays(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}

const clockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

/** "3:45", the compact time used throughout the design (no AM/PM). */
export function formatClock(date: Date): string {
  const parts = clockFormatter.formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;
  return `${hour}:${minute}`;
}

/** "3:45 PM", for screen readers and tooltips. */
export function formatClockLong(date: Date): string {
  const parts = clockFormatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
}

/** "Starts in 1h 05m" */
export function formatStartsIn(ms: number): string {
  const total = Math.max(0, Math.round(ms / 60_000));
  if (total === 0) return "Starting now";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `Starts in ${minutes}m`;
  if (minutes === 0) return `Starts in ${hours}h`;
  return `Starts in ${hours}h ${String(minutes).padStart(2, "0")}m`;
}

const dayLabelFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

/** "Mon, Oct 5" */
export function formatDayLabel(date: Date): string {
  return dayLabelFormatter.format(date);
}

export type DayOption = {
  key: string;
  weekday: string;
  dayOfMonth: string;
  label: string;
};

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
});

/** The next `count` days starting today, for the day picker. */
export function getDayOptions(now: Date, count = 7): DayOption[] {
  const today = dayKey(now);
  return Array.from({ length: count }, (_, i) => {
    const key = addDays(today, i);
    const noon = zonedDate(key, "12:00");
    return {
      key,
      weekday: weekdayFormatter.format(noon),
      dayOfMonth: String(Number(key.slice(8, 10))),
      label: formatDayLabel(noon),
    };
  });
}

/** "2h 14m" */
export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
