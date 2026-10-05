// The shape of the snapshot files the runner writes and the app reads.
// Both sides validate with these schemas, so a bad file fails loudly.
import { z } from "zod";
import { FORMATS } from "../lib/types";

export const storedShowtimeSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceTheaterId: z.string(),
  theaterId: z.string(),
  movieId: z.string(),
  /** ISO 8601 in UTC. */
  startsAt: z.iso.datetime(),
  format: z.enum(FORMATS),
  /** Raw tags kept verbatim: "Open Caption", "Kid Friendly", "Sold out". */
  attributes: z.array(z.string()),
  series: z.string().nullable(),
  alistEligible: z.boolean(),
  /** null = unknown (seat data comes later). */
  accessibleOnly: z.boolean().nullable(),
  ticketUrl: z.string().nullable(),
});
export type StoredShowtime = z.infer<typeof storedShowtimeSchema>;

export const storedMovieSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().int().nullable(),
  runtimeMin: z.number().int().nullable(),
  rating: z.string().nullable(),
});
export type StoredMovie = z.infer<typeof storedMovieSchema>;

/** sources/<source>.json: one source's whole snapshot. */
export const sourceSnapshotSchema = z.object({
  showtimes: z.array(storedShowtimeSchema),
  movies: z.array(storedMovieSchema),
});
export type SourceSnapshot = z.infer<typeof sourceSnapshotSchema>;

export const showtimesFileSchema = z.object({
  showtimes: z.array(storedShowtimeSchema),
});
export const moviesFileSchema = z.object({
  movies: z.array(storedMovieSchema),
});

export const sourceStatusSchema = z.object({
  status: z.enum(["ok", "partial", "failed"]),
  lastRunAt: z.iso.datetime(),
  /** Last fully successful run; the app's "Updated 2h ago" reads this. */
  lastOkAt: z.iso.datetime().nullable(),
  theatersOk: z.number().int(),
  theatersFailed: z.number().int(),
  showtimes: z.number().int(),
  errors: z.array(z.string()),
});
export type SourceStatus = z.infer<typeof sourceStatusSchema>;

export const statusFileSchema = z.object({
  sources: z.record(z.string(), sourceStatusSchema),
});
export type StatusFile = z.infer<typeof statusFileSchema>;
