import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { addDays, dayKey } from "../lib/time";
import { cleanTitle, movieId, normalizeRating } from "./normalize";
import type { SourceSnapshot, StoredMovie, StoredShowtime } from "./stored";
import type {
  Connector,
  NormalizedShowtime,
  RunSummary,
  Sink,
  TheaterRef,
} from "./types";

export type RunOptions = {
  sink: Sink;
  now: Date;
  /** Days to keep, counting today. */
  windowDays: number;
  /** Print what would change; write nothing. */
  dryRun: boolean;
  /** Pause between requests, so we stay polite to unofficial sources. */
  delayMs: number;
  retries: number;
  /** Where to save each raw payload (uploaded as a workflow artifact). */
  rawDir?: string;
  log: (message: string) => void;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  baseDelayMs: number,
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries) throw error;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
}

function toStored(
  n: NormalizedShowtime,
  theater: TheaterRef,
  source: string,
): { showtime: StoredShowtime; movie: StoredMovie } {
  const cleaned = cleanTitle(n.title);
  const year = cleaned.year ?? n.year ?? null;
  const id = movieId(cleaned.title, year);
  const attributes = [
    ...new Set([...n.attributes, ...cleaned.attributes]),
  ].sort();

  return {
    showtime: {
      id: `${source}:${n.sourceShowtimeId}`,
      source,
      sourceTheaterId: theater.sourceId,
      theaterId: theater.id,
      movieId: id,
      startsAt: n.startsAt,
      format: n.format,
      attributes,
      series: n.series ?? null,
      alistEligible: n.alistEligible ?? false,
      accessibleOnly: null,
      ticketUrl: n.ticketUrl ?? null,
    },
    movie: {
      id,
      title: cleaned.title,
      year,
      runtimeMin: n.runtimeMin ?? null,
      rating: normalizeRating(n.rating),
    },
  };
}

function describeChange(previous: StoredShowtime[], next: StoredShowtime[]) {
  const before = new Set(previous.map((s) => s.id));
  const after = new Set(next.map((s) => s.id));
  return {
    added: next.filter((s) => !before.has(s.id)).length,
    removed: previous.filter((s) => !after.has(s.id)).length,
  };
}

/**
 * Runs one connector over its theaters. A theater that fails keeps its previous
 * showtimes, and a run where every theater fails writes nothing, so a broken
 * source can never blank the schedule.
 */
export async function runSource(
  connector: Connector,
  theaters: TheaterRef[],
  options: RunOptions,
): Promise<RunSummary> {
  const { sink, now, log } = options;
  const source = connector.source;
  const startedAt = new Date().toISOString();
  const previous = await sink.readSource(source);

  const firstDay = dayKey(now);
  const lastDay = addDays(firstDay, options.windowDays - 1);

  const fresh: StoredShowtime[] = [];
  const movies = new Map<string, StoredMovie>();
  const failedTheaters = new Set<string>();
  const errors: string[] = [];

  for (const [index, theater] of theaters.entries()) {
    if (index > 0) await sleep(options.delayMs);
    try {
      const raw = await withRetry(
        () => connector.fetchTheater(theater),
        options.retries,
        Math.max(options.delayMs, 1000),
      );
      if (options.rawDir) {
        const file = path.join(
          options.rawDir,
          source,
          `${theater.sourceId}.json`,
        );
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, JSON.stringify(raw));
      }

      for (const n of connector.parse(raw, theater)) {
        const { showtime, movie } = toStored(n, theater, source);
        const day = dayKey(new Date(showtime.startsAt));
        if (day < firstDay || day > lastDay) continue;
        fresh.push(showtime);
        const existing = movies.get(movie.id);
        movies.set(movie.id, {
          ...movie,
          runtimeMin: existing?.runtimeMin ?? movie.runtimeMin,
          rating: existing?.rating ?? movie.rating,
        });
      }
      log(`  ${theater.name}: ok`);
    } catch (error) {
      failedTheaters.add(theater.sourceId);
      const message = `${theater.name}: ${(error as Error).message}`;
      errors.push(message);
      log(`  ${message}`);
    }
  }

  const theatersOk = theaters.length - failedTheaters.size;
  const status: RunSummary["status"] =
    failedTheaters.size === 0 ? "ok" : theatersOk > 0 ? "partial" : "failed";

  // Keep what we had for theaters that failed this run.
  const kept = previous.showtimes.filter((s) =>
    failedTheaters.has(s.sourceTheaterId),
  );
  const keptMovieIds = new Set(kept.map((s) => s.movieId));
  for (const movie of previous.movies) {
    if (keptMovieIds.has(movie.id) && !movies.has(movie.id))
      movies.set(movie.id, movie);
  }
  const snapshot: SourceSnapshot = {
    showtimes: [...fresh, ...kept],
    movies: [...movies.values()],
  };

  const change = describeChange(previous.showtimes, snapshot.showtimes);
  log(
    `${source}: ${status}, ${snapshot.showtimes.length} showtimes (+${change.added} -${change.removed})` +
      (options.dryRun ? " [dry run, nothing written]" : ""),
  );

  const summary: RunSummary = {
    source,
    status,
    startedAt,
    finishedAt: new Date().toISOString(),
    theatersOk,
    theatersFailed: failedTheaters.size,
    showtimes: snapshot.showtimes.length,
    errors,
  };

  if (!options.dryRun) {
    if (status !== "failed") await sink.writeSource(source, snapshot);
    await sink.recordRun(summary);
  }
  return summary;
}

export async function runConnectors(
  connectors: Connector[],
  theaters: TheaterRef[],
  options: RunOptions,
): Promise<RunSummary[]> {
  const summaries: RunSummary[] = [];
  for (const connector of connectors) {
    const mine = theaters.filter((t) => t.source === connector.source);
    if (mine.length === 0) {
      options.log(`${connector.source}: no theaters configured, skipping`);
      continue;
    }
    options.log(`${connector.source}: fetching ${mine.length} theaters`);
    summaries.push(await runSource(connector, mine, options));
  }
  return summaries;
}
