import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";
import {
  sourceSnapshotSchema,
  statusFileSchema,
  type SourceSnapshot,
  type StatusFile,
  type StoredMovie,
  type StoredShowtime,
} from "../stored";
import type { RunSummary, Sink } from "../types";

const EMPTY_SNAPSHOT: SourceSnapshot = { showtimes: [], movies: [] };

async function readJson<S extends z.ZodType>(
  file: string,
  schema: S,
): Promise<z.infer<S> | null> {
  try {
    return schema.parse(JSON.parse(await readFile(file, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error(`Could not read ${file}: ${(error as Error).message}`);
  }
}

/** One row per line, so a git diff of the snapshot shows only the rows that changed. */
function rowsToJson(key: string, rows: unknown[]): string {
  if (rows.length === 0) return `{"${key}":[]}\n`;
  return `{"${key}":[\n${rows.map((r) => JSON.stringify(r)).join(",\n")}\n]}\n`;
}

function byStart(a: StoredShowtime, b: StoredShowtime): number {
  return (
    a.startsAt.localeCompare(b.startsAt) ||
    a.theaterId.localeCompare(b.theaterId) ||
    a.id.localeCompare(b.id)
  );
}

/**
 * Keeps each source's snapshot in sources/<source>.json and compiles the
 * showtimes.json and movies.json the app reads. Output is deterministic, so a
 * run that finds nothing new leaves those files byte-for-byte unchanged.
 */
export class JsonFileSink implements Sink {
  constructor(private readonly dir: string) {}

  private file(...parts: string[]) {
    return path.join(this.dir, ...parts);
  }

  async readSource(source: string): Promise<SourceSnapshot> {
    return (
      (await readJson(
        this.file("sources", `${source}.json`),
        sourceSnapshotSchema,
      )) ?? EMPTY_SNAPSHOT
    );
  }

  async writeSource(source: string, snapshot: SourceSnapshot): Promise<void> {
    await mkdir(this.file("sources"), { recursive: true });
    const showtimes = [...snapshot.showtimes].sort(byStart);
    const movies = [...snapshot.movies].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    await writeFile(
      this.file("sources", `${source}.json`),
      `{"showtimes":[\n${showtimes.map((r) => JSON.stringify(r)).join(",\n")}\n],"movies":[\n${movies
        .map((r) => JSON.stringify(r))
        .join(",\n")}\n]}\n`,
    );
    await this.compile();
  }

  async recordRun(run: RunSummary): Promise<void> {
    const file = this.file("status.json");
    const status: StatusFile = (await readJson(file, statusFileSchema)) ?? {
      sources: {},
    };
    const previous = status.sources[run.source];
    status.sources[run.source] = {
      status: run.status,
      lastRunAt: run.finishedAt,
      lastOkAt:
        run.status === "ok" ? run.finishedAt : (previous?.lastOkAt ?? null),
      theatersOk: run.theatersOk,
      theatersFailed: run.theatersFailed,
      showtimes: run.showtimes,
      errors: run.errors,
    };
    await mkdir(this.dir, { recursive: true });
    await writeFile(file, `${JSON.stringify(status, null, 1)}\n`);
  }

  /** Merges every source into the files the app reads. */
  private async compile(): Promise<void> {
    const names = (await readdir(this.file("sources")))
      .filter((n) => n.endsWith(".json"))
      .sort();

    const showtimes: StoredShowtime[] = [];
    const movies = new Map<string, StoredMovie>();
    for (const name of names) {
      const snapshot = await readJson(
        this.file("sources", name),
        sourceSnapshotSchema,
      );
      if (!snapshot) continue;
      showtimes.push(...snapshot.showtimes);
      for (const movie of snapshot.movies) {
        const existing = movies.get(movie.id);
        movies.set(movie.id, {
          ...movie,
          runtimeMin: existing?.runtimeMin ?? movie.runtimeMin,
          rating: existing?.rating ?? movie.rating,
        });
      }
    }

    await writeFile(
      this.file("showtimes.json"),
      rowsToJson("showtimes", showtimes.sort(byStart)),
    );
    await writeFile(
      this.file("movies.json"),
      rowsToJson(
        "movies",
        [...movies.values()].sort((a, b) => a.id.localeCompare(b.id)),
      ),
    );
  }
}
