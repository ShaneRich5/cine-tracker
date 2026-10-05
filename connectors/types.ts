import type { Format, TheaterGroup } from "../lib/types";
import type { SourceSnapshot, SourceStatus } from "./stored";

/** A theater from connectors/theaters.json. */
export type TheaterRef = {
  id: string;
  name: string;
  group: TheaterGroup;
  chainLabel: string;
  /** Which connector fetches it. */
  source: string;
  /** The chain's own ID for this theater. */
  sourceId: string;
  /** NYC only for now. */
  market: string;
};

/** What every connector's parse step emits, so nothing downstream knows the chain. */
export type NormalizedShowtime = {
  sourceShowtimeId: string;
  /** Raw, as the chain spells it. The runner cleans it. */
  title: string;
  year?: number;
  /** Raw rating, e.g. "PG13". */
  rating?: string;
  runtimeMin?: number;
  /** ISO 8601 in UTC, parsed from the theater's local time. */
  startsAt: string;
  format: Format;
  attributes: string[];
  series?: string;
  alistEligible?: boolean;
  ticketUrl?: string;
};

export type Connector = {
  source: string;
  /** Network only: returns the raw payload for one theater. */
  fetchTheater(theater: TheaterRef): Promise<unknown>;
  /** Pure: raw payload to normalized showtimes. Throws if the payload looks wrong. */
  parse(raw: unknown, theater: TheaterRef): NormalizedShowtime[];
};

export type RunSummary = {
  source: string;
  status: SourceStatus["status"];
  startedAt: string;
  finishedAt: string;
  theatersOk: number;
  theatersFailed: number;
  showtimes: number;
  errors: string[];
};

/**
 * Where the runner keeps its output. The proof of concept writes JSON files
 * (connectors/sinks/json-file.ts); Supabase becomes a second sink later.
 */
export type Sink = {
  /** The source's previous snapshot, used to keep a theater's data when its fetch fails. */
  readSource(source: string): Promise<SourceSnapshot>;
  writeSource(source: string, snapshot: SourceSnapshot): Promise<void>;
  recordRun(run: RunSummary): Promise<void>;
};
