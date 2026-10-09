// Mock data for design review, shaped like the Supabase schema in
// docs/build-brief.md. Replaced by database queries in session 2.
import { addDays, zonedDate } from "./time";
import type { Format, Movie, Showtime, Theater } from "./types";

/** The moment the mockups depict: Mon, Oct 5 at 2:40 PM in New York. */
export const MOCK_TODAY = "2026-10-05";
export const MOCK_NOW = zonedDate(MOCK_TODAY, "14:40");
export const LOCATION_LABEL = "near Astoria";

export const theaters: Theater[] = [
  {
    id: "amc-lincoln-square",
    name: "AMC Lincoln Square 13",
    group: "amc",
    chainLabel: "AMC",
    distanceMi: 3.1,
  },
  {
    id: "alamo-lower-manhattan",
    name: "Alamo Lower Manhattan",
    group: "alamo",
    chainLabel: "Alamo",
    distanceMi: 5.2,
  },
  {
    id: "momi",
    name: "Museum of the Moving Image",
    group: "local",
    chainLabel: "Local",
    distanceMi: 0.5,
  },
  {
    id: "regal-kaufman-astoria",
    name: "Regal UA Kaufman Astoria",
    group: "regal",
    chainLabel: "Regal",
    distanceMi: 0.6,
  },
  {
    id: "nitehawk-prospect-park",
    name: "Nitehawk Prospect Park",
    group: "local",
    chainLabel: "Local",
    distanceMi: 7.4,
  },
  {
    id: "village-east",
    name: "Village East by Angelika",
    group: "other_chain",
    chainLabel: "Angelika",
    distanceMi: 5.8,
  },
];

const TICKET_SITES: Record<string, string> = {
  "amc-lincoln-square": "https://www.amctheatres.com",
  "alamo-lower-manhattan": "https://drafthouse.com",
  momi: "https://movingimage.org",
  "regal-kaufman-astoria": "https://www.regmovies.com",
  "nitehawk-prospect-park": "https://nitehawkcinema.com",
  "village-east": "https://www.angelikafilmcenter.com",
};

export const movies: Movie[] = [
  {
    id: "harbor-lights",
    tmdbId: null,
    title: "Harbor Lights",
    runtimeMin: 134,
    rating: "R",
    genre: "Drama",
    posterColor: "#2E3F7A",
  },
  {
    id: "night-ferry",
    tmdbId: null,
    title: "Night Ferry",
    runtimeMin: 118,
    rating: "PG-13",
    genre: "Thriller",
    posterColor: "#7A2E2E",
  },
  {
    id: "low-tide-motel",
    tmdbId: null,
    title: "Low Tide Motel",
    runtimeMin: 101,
    rating: "R",
    genre: "Comedy",
    posterColor: "#6B3A55",
  },
  {
    id: "paper-moons",
    tmdbId: null,
    title: "Paper Moons",
    runtimeMin: 126,
    rating: "PG",
    genre: "Drama",
    posterColor: "#3B5C4A",
  },
  {
    id: "glass-orchard",
    tmdbId: null,
    title: "Glass Orchard",
    runtimeMin: 112,
    rating: "PG-13",
    genre: "Sci-fi",
    posterColor: "#5A4A2E",
  },
];

/** The watchlist before you've changed it (no ct_watchlist cookie yet). */
export const watchlistIds: string[] = [
  "night-ferry",
  "paper-moons",
  "glass-orchard",
  "harbor-lights",
];

type Slot = {
  at: string;
  format?: Format;
  /** Day offsets from MOCK_TODAY this slot runs on. Defaults to every day. */
  days?: number[];
  accessibleOnly?: boolean;
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const SCHEDULE: { movieId: string; theaterId: string; slots: Slot[] }[] = [
  {
    movieId: "harbor-lights",
    theaterId: "amc-lincoln-square",
    slots: [
      { at: "15:45", format: "imax" },
      { at: "19:00", format: "dolby" },
      { at: "22:15" },
    ],
  },
  {
    movieId: "harbor-lights",
    theaterId: "alamo-lower-manhattan",
    slots: [{ at: "18:30" }, { at: "21:45" }],
  },
  {
    movieId: "harbor-lights",
    theaterId: "momi",
    slots: [{ at: "19:30", format: "70mm" }],
  },
  {
    movieId: "harbor-lights",
    theaterId: "regal-kaufman-astoria",
    slots: [
      // Today the 4:20 is down to wheelchair and companion seats only.
      { at: "16:20", format: "rpx", days: [0], accessibleOnly: true },
      { at: "16:20", format: "rpx", days: [1, 2, 3, 4, 5, 6] },
      { at: "19:40", format: "rpx" },
    ],
  },
  {
    movieId: "harbor-lights",
    theaterId: "village-east",
    slots: [{ at: "17:15" }, { at: "20:30" }],
  },
  {
    movieId: "night-ferry",
    theaterId: "amc-lincoln-square",
    slots: [{ at: "16:20" }],
  },
  {
    movieId: "night-ferry",
    theaterId: "alamo-lower-manhattan",
    slots: [{ at: "13:15" }, { at: "18:30" }],
  },
  {
    movieId: "night-ferry",
    theaterId: "regal-kaufman-astoria",
    slots: [{ at: "20:15" }],
  },
  {
    // A matinee-only run, so this theater has nothing left this afternoon.
    movieId: "night-ferry",
    theaterId: "momi",
    slots: [{ at: "12:00", format: "35mm" }],
  },
  {
    movieId: "low-tide-motel",
    theaterId: "alamo-lower-manhattan",
    slots: [{ at: "19:10" }],
  },
  {
    movieId: "low-tide-motel",
    theaterId: "regal-kaufman-astoria",
    slots: [{ at: "21:55" }],
  },
  {
    movieId: "low-tide-motel",
    theaterId: "village-east",
    slots: [{ at: "20:40" }],
  },
  {
    movieId: "paper-moons",
    theaterId: "nitehawk-prospect-park",
    slots: [
      { at: "14:00", format: "70mm", days: [5] },
      { at: "19:30", format: "70mm" },
    ],
  },
];

export const showtimes: Showtime[] = SCHEDULE.flatMap(
  ({ movieId, theaterId, slots }) =>
    slots.flatMap((slot) =>
      (slot.days ?? ALL_DAYS).map((offset) => {
        const day = addDays(MOCK_TODAY, offset);
        const theater = theaters.find((t) => t.id === theaterId);
        return {
          id: `${movieId}:${theaterId}:${day}:${slot.at}`,
          movieId,
          theaterId,
          startsAt: zonedDate(day, slot.at),
          format: slot.format ?? "standard",
          alistEligible: theater?.group === "amc",
          accessibleOnly: slot.accessibleOnly ?? null,
          ticketUrl: TICKET_SITES[theaterId] ?? null,
        };
      }),
    ),
);
