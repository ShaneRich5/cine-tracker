import type { Connector } from "../types";
import { parseAlamo } from "./parse";

// Unofficial: the feed behind drafthouse.com. No auth, but it can change
// without notice, so keep requests infrequent and the parser strict.
const FEED = "https://feeds.drafthouse.com/adcService/showtimes.svc/calendar";

export const alamo: Connector = {
  source: "alamo",
  async fetchTheater(theater) {
    const res = await fetch(`${FEED}/${theater.sourceId}/`, {
      headers: {
        "User-Agent": "cine-tracker-poc (personal project)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      throw new Error(`Alamo ${theater.sourceId}: HTTP ${res.status}`);
    }
    return res.json();
  },
  parse: parseAlamo,
};
