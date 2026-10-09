import { dayKey } from "../../lib/time";
import type { Connector } from "../types";

// Unofficial: the endpoint behind regmovies.com's theatre pages, as used by
// hobby projects. It is per theatre and per day (date as MM-DD-YYYY).
//
// Not usable yet. Every path on www.regmovies.com, robots.txt included, answers
// an honest non-browser client with HTTP 403 from Cloudflare: a managed
// challenge for curl, an outright "you have been blocked" page for Node's fetch.
// The hobby projects that read it all get past that with browser automation,
// TLS impersonation or paid unblocking proxies, which we don't do. So this only
// fetches (to record exactly how it fails), and there is no parser: there is no
// real payload to write one against.
const FEED = "https://www.regmovies.com/api/getShowtimes";

/** "2026-10-09" -> "10-09-2026" */
function regalDate(key: string): string {
  const [year, month, day] = key.split("-");
  return `${month}-${day}-${year}`;
}

/** Names Cloudflare's bot protection in the error, so status.json says what happened. */
async function describeFailure(res: Response): Promise<string> {
  if (res.headers.get("server") !== "cloudflare") return "";
  const ray = res.headers.get("cf-ray");
  if (res.headers.get("cf-mitigated") === "challenge") {
    return ` (Cloudflare challenge, cf-ray ${ray})`;
  }
  const body = await res.text().catch(() => "");
  if (/you have been blocked/i.test(body)) {
    return ` (blocked by Cloudflare, cf-ray ${ray})`;
  }
  return ` (Cloudflare, cf-ray ${ray})`;
}

export const regal: Connector = {
  source: "regal",
  async fetchTheater(theater) {
    const url = new URL(FEED);
    url.searchParams.set("theatres", theater.sourceId);
    url.searchParams.set("date", regalDate(dayKey(new Date())));
    const res = await fetch(url, {
      headers: {
        "User-Agent": "cine-tracker-poc (personal project)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      throw new Error(
        `Regal ${theater.sourceId}: HTTP ${res.status}${await describeFailure(res)}`,
      );
    }
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("json")) {
      throw new Error(
        `Regal ${theater.sourceId}: expected JSON, got "${type}"`,
      );
    }
    return res.json();
  },
  parse(_raw, theater) {
    throw new Error(
      `Regal parser not written: no real payload captured yet for ${theater.sourceId}`,
    );
  },
};
