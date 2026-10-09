// Reads the snapshot the connectors write (see connectors/). In production it
// comes from the `data` branch through the GitHub API; locally you can point
// DATA_DIR at a folder `npm run fetch` wrote.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import {
  moviesFileSchema,
  showtimesFileSchema,
  statusFileSchema,
  type StatusFile,
  type StoredMovie,
  type StoredShowtime,
} from "../connectors/stored";
import theaterConfig from "../connectors/theaters.json";
import type { TheaterRef } from "../connectors/types";
import type { Movie, Showtime, Theater } from "./types";

export type LiveConfig =
  | { kind: "dir"; dir: string }
  | { kind: "github"; repo: string; branch: string; token: string };

/** null means no data source is configured, so the app falls back to mock data. */
export function liveConfig(
  env: Record<string, string | undefined> = process.env,
): LiveConfig | null {
  if (env.DATA_DIR) return { kind: "dir", dir: env.DATA_DIR };
  if (env.GITHUB_DATA_REPO && env.GITHUB_DATA_TOKEN) {
    return {
      kind: "github",
      repo: env.GITHUB_DATA_REPO,
      branch: env.GITHUB_DATA_BRANCH || "data",
      token: env.GITHUB_DATA_TOKEN,
    };
  }
  return null;
}

export type LiveSnapshot = {
  showtimes: Showtime[];
  movies: Movie[];
  theaters: Theater[];
  status: StatusFile;
};

const POSTER_COLORS = ["#2E3F7A", "#7A2E2E", "#6B3A55", "#3B5C4A", "#5A4A2E"];

function posterColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return POSTER_COLORS[hash % POSTER_COLORS.length];
}

export function toShowtime(s: StoredShowtime): Showtime {
  return {
    id: s.id,
    movieId: s.movieId,
    theaterId: s.theaterId,
    startsAt: new Date(s.startsAt),
    format: s.format,
    alistEligible: s.alistEligible,
    accessibleOnly: s.accessibleOnly,
    ticketUrl: s.ticketUrl,
  };
}

export function toMovie(m: StoredMovie): Movie {
  return {
    id: m.id,
    tmdbId: null,
    title: m.title,
    year: m.year,
    runtimeMin: m.runtimeMin ?? 0,
    rating: m.rating ?? "NR",
    genre: null,
    posterColor: posterColor(m.id),
  };
}

export const configuredTheaters: Theater[] = (
  theaterConfig as TheaterRef[]
).map((t) => ({
  id: t.id,
  name: t.name,
  group: t.group,
  chainLabel: t.chainLabel,
  distanceMi: null,
}));

async function readText(config: LiveConfig, name: string): Promise<string> {
  if (config.kind === "dir") {
    return readFile(path.join(config.dir, name), "utf8");
  }
  const res = await fetch(
    `https://api.github.com/repos/${config.repo}/contents/${name}?ref=${encodeURIComponent(config.branch)}`,
    {
      headers: {
        Accept: "application/vnd.github.raw+json",
        Authorization: `Bearer ${config.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      // Requests with an Authorization header aren't cached unless we opt in.
      cache: "force-cache",
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) {
    throw new Error(
      `Could not read ${name} from ${config.repo}@${config.branch}: HTTP ${res.status}`,
    );
  }
  return res.text();
}

export async function readSnapshot(config: LiveConfig): Promise<LiveSnapshot> {
  const [showtimes, movies, status] = await Promise.all([
    readText(config, "showtimes.json"),
    readText(config, "movies.json"),
    readText(config, "status.json"),
  ]);
  return {
    showtimes: showtimesFileSchema
      .parse(JSON.parse(showtimes))
      .showtimes.map(toShowtime),
    movies: moviesFileSchema.parse(JSON.parse(movies)).movies.map(toMovie),
    theaters: configuredTheaters,
    status: statusFileSchema.parse(JSON.parse(status)),
  };
}

/** One read per request, shared by every data function a page calls. */
export const loadSnapshot = cache(async (): Promise<LiveSnapshot | null> => {
  const config = liveConfig();
  return config ? readSnapshot(config) : null;
});
