export const THEATER_GROUPS = [
  "amc",
  "regal",
  "alamo",
  "other_chain",
  "local",
] as const;
export type TheaterGroup = (typeof THEATER_GROUPS)[number];

export const FORMATS = [
  "imax",
  "dolby",
  "70mm",
  "35mm",
  "rpx",
  "3d",
  "standard",
] as const;
export type Format = (typeof FORMATS)[number];

export const FORMAT_LABELS: Record<Format, string> = {
  imax: "IMAX",
  dolby: "Dolby",
  "70mm": "70mm",
  "35mm": "35mm",
  rpx: "RPX",
  "3d": "3D",
  standard: "Standard",
};

export type Theater = {
  id: string;
  name: string;
  group: TheaterGroup;
  /** Short label shown on cards, e.g. "AMC". Local theaters show "Local". */
  chainLabel: string;
  /** null until theaters have coordinates. */
  distanceMi: number | null;
};

export type Movie = {
  id: string;
  tmdbId: number | null;
  title: string;
  /** Release year when the title carries one, e.g. "Nosferatu (1922)". */
  year?: number | null;
  runtimeMin: number;
  rating: string;
  /** null until TMDB supplies it. */
  genre: string | null;
  /** Placeholder poster fill until TMDB posters are wired up. */
  posterColor: string;
  /** Full poster image URL from TMDB; the colored placeholder shows when absent. */
  posterUrl?: string | null;
  /** TMDB overview. */
  synopsis?: string | null;
};

export type Showtime = {
  id: string;
  movieId: string;
  theaterId: string;
  startsAt: Date;
  format: Format;
  alistEligible: boolean;
  /** null = unknown (seat data comes later). */
  accessibleOnly: boolean | null;
  ticketUrl: string | null;
};

export type WatchlistEntry = {
  movieId: string;
  /** Short update shown on the home page, e.g. "new times". */
  note: string | null;
  highlight: boolean;
};
