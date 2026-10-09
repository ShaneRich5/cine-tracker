import type { StatusFile } from "../connectors/stored";

/**
 * The fetch is scheduled hourly, but GitHub delays scheduled runs on quiet
 * repos and in practice they land every 4 to 7 hours. Twelve hours means
 * about two runs went missing.
 */
export const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

export type Freshness = {
  /** The oldest source's last fully successful fetch; null if one never succeeded. */
  updatedAt: Date | null;
  /** Older than STALE_AFTER_MS, or never fetched. */
  stale: boolean;
  /** Sources whose last run failed or only partly worked, e.g. ["alamo"]. */
  failing: string[];
};

/** How current the showtimes are, from the connectors' status file. */
export function getFreshness(status: StatusFile, now: Date): Freshness | null {
  const sources = Object.entries(status.sources);
  if (sources.length === 0) return null;

  let updatedAt: Date | null = new Date(8.64e15);
  for (const [, source] of sources) {
    if (!source.lastOkAt) {
      updatedAt = null;
      break;
    }
    const at = new Date(source.lastOkAt);
    if (at < updatedAt) updatedAt = at;
  }

  return {
    updatedAt,
    stale:
      updatedAt === null ||
      now.getTime() - updatedAt.getTime() > STALE_AFTER_MS,
    failing: sources
      .filter(([, source]) => source.status !== "ok")
      .map(([name]) => name),
  };
}
