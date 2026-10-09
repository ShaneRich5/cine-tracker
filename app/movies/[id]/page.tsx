import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MovieBrowser } from "@/components/movie-browser";
import { MovieDetail } from "@/components/movie-detail";
import { MobileTitleHeader } from "@/components/striped-header";
import { WatchlistButton } from "@/components/watchlist-button";
import {
  getMovie,
  getMovies,
  getNow,
  getShowtimes,
  getTheaters,
} from "@/lib/data";
import { getPrefs } from "@/lib/get-prefs";
import { getWatchlistIds } from "@/lib/get-watchlist";
import { buildTonight, movieFormats, movieMeta } from "@/lib/showtimes";

export async function generateMetadata(
  props: PageProps<"/movies/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const movie = await getMovie(id);
  return { title: movie?.title ?? "Movie not found" };
}

export default async function MoviePage(props: PageProps<"/movies/[id]">) {
  const { id } = await props.params;
  const { day } = await props.searchParams;
  const movie = await getMovie(id);
  if (!movie) notFound();

  const now = getNow();
  const [prefs, movies, theaters, showtimes, watchlist] = await Promise.all([
    getPrefs(),
    getMovies(),
    getTheaters(),
    getShowtimes(),
    getWatchlistIds(),
  ]);
  const tonight = buildTonight({ now, movies, showtimes, theaters, prefs });

  return (
    <AppShell
      section="movies"
      prefs={prefs}
      now={now}
      mobileHeader={
        <MobileTitleHeader
          backHref="/"
          title={movie.title}
          subtitle={movieMeta(movie, movieFormats(movie.id, showtimes))}
          action={
            <WatchlistButton
              variant="icon"
              movieId={movie.id}
              on={watchlist.includes(movie.id)}
            />
          }
        />
      }
    >
      <MovieBrowser tonight={tonight} selectedId={movie.id}>
        <MovieDetail
          movie={movie}
          day={typeof day === "string" ? day : undefined}
          now={now}
          prefs={prefs}
          showtimes={showtimes}
          theaters={theaters}
          watchlisted={watchlist.includes(movie.id)}
        />
      </MovieBrowser>
    </AppShell>
  );
}
