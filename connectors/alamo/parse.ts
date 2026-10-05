import { z } from "zod";
import { zonedDate } from "../../lib/time";
import { detectFormat } from "../normalize";
import type { NormalizedShowtime, TheaterRef } from "../types";

// Only the fields we use. The feed nests cinema > month > week > day > film >
// series > format > session, with plenty more fields we ignore.
const session = z.object({
  SessionId: z.string(),
  SessionStatus: z.string(),
  SessionDateTime: z.string(),
  SessionSalesURL: z.string().nullish(),
  Attributes: z.array(z.object({ AttributeName: z.string() })).nullish(),
});

const film = z.object({
  FilmName: z.string(),
  FilmRating: z.string().nullish(),
  FilmRuntime: z.string().nullish(),
  FilmSlug: z.string().nullish(),
  Series: z
    .array(
      z.object({
        SeriesName: z.string().nullish(),
        Formats: z
          .array(
            z.object({
              FormatName: z.string().nullish(),
              Sessions: z.array(session).nullish(),
            }),
          )
          .nullish(),
      }),
    )
    .nullish(),
});

const calendar = z.object({
  Calendar: z.object({
    Cinemas: z.array(
      z.object({
        CinemaId: z.string(),
        Months: z.array(
          z.object({
            Weeks: z.array(
              z.object({
                Days: z.array(z.object({ Films: z.array(film).nullish() })),
              }),
            ),
          }),
        ),
      }),
    ),
  }),
});

const LOCAL_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/;

// Operational flags for the venue, not anything a moviegoer filters on.
const IGNORED_ATTRIBUTES = /^(digital|qr ordering|menu add)/i;

/**
 * Alamo writes events as "Book Club: WHALEFALL" or "Terror Tuesday: GINGER SNAPS":
 * a mixed-case event name in front of an ALL CAPS title. Split the event off so
 * every showing of the film lands on one movie. (Its FilmYear is the booking
 * year, not the release year, so we ignore it and use only a year in the title.)
 */
function splitEventPrefix(title: string): { title: string; event?: string } {
  const match = title.match(/^([^:]*[a-z][^:]*):\s*([^:a-z]*[A-Z][^:a-z]*)$/);
  return match ? { title: match[2].trim(), event: match[1].trim() } : { title };
}

function positiveInt(value: string | null | undefined): number | undefined {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function parseAlamo(
  raw: unknown,
  theater: TheaterRef,
): NormalizedShowtime[] {
  const { Calendar } = calendar.parse(raw);
  const cinema = Calendar.Cinemas.find((c) => c.CinemaId === theater.sourceId);
  if (!cinema) {
    throw new Error(`Alamo feed has no cinema ${theater.sourceId}`);
  }

  const showtimes: NormalizedShowtime[] = [];
  for (const month of cinema.Months)
    for (const week of month.Weeks)
      for (const day of week.Days)
        for (const f of day.Films ?? [])
          for (const series of f.Series ?? [])
            for (const format of series.Formats ?? [])
              for (const s of format.Sessions ?? []) {
                const local = s.SessionDateTime.match(LOCAL_DATE_TIME);
                if (!local) {
                  throw new Error(
                    `Unexpected session time "${s.SessionDateTime}"`,
                  );
                }
                const tags = (s.Attributes ?? []).map((a) => a.AttributeName);
                const attributes = tags.filter(
                  (t) => !IGNORED_ATTRIBUTES.test(t),
                );
                if (s.SessionStatus === "soldout") attributes.push("Sold out");
                const { title, event } = splitEventPrefix(f.FilmName);
                if (event) attributes.push(event);

                showtimes.push({
                  sourceShowtimeId: s.SessionId,
                  title,
                  rating: f.FilmRating ?? undefined,
                  runtimeMin: positiveInt(f.FilmRuntime),
                  startsAt: zonedDate(local[1], local[2]).toISOString(),
                  format: detectFormat([format.FormatName, ...tags]),
                  attributes,
                  series: series.SeriesName ?? undefined,
                  // The feed has no checkout link, so send people to the film page.
                  ticketUrl:
                    s.SessionSalesURL ??
                    (f.FilmSlug
                      ? `https://drafthouse.com/${theater.market}/show/${f.FilmSlug}`
                      : undefined),
                });
              }

  // A theater with two weeks of nothing is far more likely a broken feed than
  // a closed theater, and an empty result would wipe its schedule.
  if (showtimes.length === 0) {
    throw new Error(`Alamo feed for ${theater.name} has no sessions`);
  }
  return showtimes;
}
