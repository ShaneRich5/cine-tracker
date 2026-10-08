// Poster lookup. Needs TMDB_API_KEY (either the v3 API key or the v4 "API Read
// Access Token"; v4 tokens are JWTs, so they start with "eyJ"). Without it
// movies keep their colored placeholder. Responses are cached by Next's fetch
// cache for a week, so a movie is searched once however many pages show it.
import type { Movie } from "./types";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w342";
const WEEK = 60 * 60 * 24 * 7;

type SearchResponse = {
  results?: { id: number; poster_path: string | null }[];
};

async function findPoster(
  title: string,
  token: string,
): Promise<{ tmdbId: number; posterUrl: string | null } | null> {
  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("query", title);
  url.searchParams.set("include_adult", "false");
  const headers: HeadersInit = {};
  if (token.startsWith("eyJ")) headers.Authorization = `Bearer ${token}`;
  else url.searchParams.set("api_key", token);
  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: WEEK },
    });
    if (!res.ok) return null;
    const hit = ((await res.json()) as SearchResponse).results?.[0];
    if (!hit) return null;
    return {
      tmdbId: hit.id,
      posterUrl: hit.poster_path ? `${IMAGE_BASE}${hit.poster_path}` : null,
    };
  } catch {
    return null;
  }
}

/** Adds poster URLs where TMDB has a match. Never throws: no match means no poster. */
export async function withPosters(
  movies: Movie[],
  token = process.env.TMDB_API_KEY,
): Promise<Movie[]> {
  if (!token) return movies;
  return Promise.all(
    movies.map(async (movie) => {
      if (movie.posterUrl) return movie;
      const found = await findPoster(movie.title, token);
      return found ? { ...movie, ...found } : movie;
    }),
  );
}
