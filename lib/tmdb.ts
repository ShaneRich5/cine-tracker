// Poster, genre and synopsis lookup. Needs TMDB_API_KEY (either the v3 API key
// or the v4 "API Read Access Token"; v4 tokens are JWTs, so they start with
// "eyJ"). Without it movies keep their colored placeholder. Responses are
// cached by Next's fetch cache for a week, so a title is searched once however
// many pages show it.
import type { Movie } from "./types";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w342";
const WEEK = 60 * 60 * 24 * 7;
/** TMDB allows about 40 requests a second; stay well under it on a cold cache. */
const CONCURRENCY = 8;

const GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-fi",
  10770: "TV movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export type SearchResult = {
  id: number;
  title: string;
  original_title?: string;
  release_date?: string;
  poster_path: string | null;
  overview?: string;
  genre_ids?: number[];
};

type Found = Pick<Movie, "posterUrl" | "genre" | "synopsis"> & {
  tmdbId: number;
};

/** Event wording theaters add after a title: "MOONLIGHT 10th Anniversary Remastered". */
const EVENT_SUFFIX =
  /(?:\s*[-–:]\s*|\s+)(?:\d+(?:st|nd|rd|th) anniversary|remaster(?:ed)?|fan (?:event|screening)|sing-?along|4k|q&a)\b.*$/i;

/**
 * Queries to try, in order: the title without event wording, then the part
 * after the first colon ("HDR By Barco: AVENGERS ENDGAME: ENCORE" becomes
 * "AVENGERS ENDGAME: ENCORE") in case the front is an event or series name.
 */
export function searchQueries(title: string): string[] {
  const strip = (t: string) => t.replace(EVENT_SUFFIX, "").trim();
  const queries = [strip(title)];
  const colon = title.indexOf(":");
  if (colon > 0) queries.push(strip(title.slice(colon + 1)));
  return [...new Set(queries.filter(Boolean))];
}

function normalize(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^the /, "");
}

/** The result whose title matches the query exactly, preferring the given year. */
export function pickExact(
  results: SearchResult[],
  query: string,
  year?: number | null,
): SearchResult | null {
  const q = normalize(query);
  const exact = results.filter(
    (r) =>
      normalize(r.title) === q ||
      (r.original_title !== undefined && normalize(r.original_title) === q),
  );
  if (year) {
    const sameYear = exact.find((r) => r.release_date?.startsWith(`${year}`));
    if (sameYear) return sameYear;
  }
  return exact[0] ?? null;
}

async function search(
  query: string,
  token: string,
  year?: number | null,
): Promise<SearchResult[]> {
  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  if (year) url.searchParams.set("primary_release_year", `${year}`);
  const headers: HeadersInit = {};
  if (token.startsWith("eyJ")) headers.Authorization = `Bearer ${token}`;
  else url.searchParams.set("api_key", token);
  try {
    const res = await fetch(url, { headers, next: { revalidate: WEEK } });
    if (!res.ok) return [];
    return ((await res.json()) as { results?: SearchResult[] }).results ?? [];
  } catch {
    return [];
  }
}

/**
 * Finds a movie on TMDB. A year in the title ("Nosferatu (1922)") is tried
 * first so re-releases don't match the newest remake; without an exact title
 * match we fall back to TMDB's top result.
 */
export async function findMovie(
  title: string,
  year: number | null | undefined,
  token: string,
): Promise<SearchResult | null> {
  for (const query of searchQueries(title)) {
    if (year) {
      const hit = pickExact(await search(query, token, year), query, year);
      if (hit) return hit;
    }
    const results = await search(query, token);
    const hit = pickExact(results, query, year) ?? results[0];
    if (hit) return hit;
  }
  return null;
}

function toFound(result: SearchResult): Found {
  const genre = result.genre_ids
    ?.map((id) => GENRES[id])
    .find((name) => name !== undefined);
  return {
    tmdbId: result.id,
    posterUrl: result.poster_path ? `${IMAGE_BASE}${result.poster_path}` : null,
    genre: genre ?? null,
    synopsis: result.overview?.trim() || null,
  };
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}

/** Adds poster, genre and synopsis where TMDB has a match. Never throws: no match changes nothing. */
export async function withTmdb(
  movies: Movie[],
  token = process.env.TMDB_API_KEY,
): Promise<Movie[]> {
  if (!token) return movies;
  return mapLimit(movies, CONCURRENCY, async (movie) => {
    const result = await findMovie(movie.title, movie.year, token);
    if (!result) return movie;
    const found = toFound(result);
    return {
      ...movie,
      tmdbId: found.tmdbId,
      posterUrl: movie.posterUrl ?? found.posterUrl,
      genre: movie.genre ?? found.genre,
      synopsis: movie.synopsis ?? found.synopsis,
    };
  });
}
