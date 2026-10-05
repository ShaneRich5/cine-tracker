import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { MovieBrowser } from "@/components/movie-browser";
import { MovieDetail } from "@/components/movie-detail";
import { PosterGrid } from "@/components/poster-grid";
import {
  MobileTitleHeader,
  PreferencesIconLink,
} from "@/components/striped-header";
import {
  getMovies,
  getNow,
  getShowtimes,
  getTheaters,
  getWatchlist,
} from "@/lib/data";
import { getPrefs } from "@/lib/get-prefs";
import { buildTonight, moviesWithShowtimes } from "@/lib/showtimes";
import { formatRuntime } from "@/lib/time";

export const metadata: Metadata = { title: "Movies" };

export default async function MoviesPage() {
  const now = getNow();
  const [prefs, movies, theaters, showtimes, watchlist] = await Promise.all([
    getPrefs(),
    getMovies(),
    getTheaters(),
    getShowtimes(),
    getWatchlist(),
  ]);
  const tonight = buildTonight({ now, movies, showtimes, theaters, prefs });
  const featured = tonight[0]?.movie;
  const thisWeek = moviesWithShowtimes(movies, showtimes);

  return (
    <AppShell
      section="movies"
      prefs={prefs}
      now={now}
      mobileHeader={
        <MobileTitleHeader title="Movies" action={<PreferencesIconLink />} />
      }
    >
      <section aria-labelledby="this-week" className="pt-[18px] desktop:hidden">
        <h2 id="this-week" className="mb-3 font-display text-2xl">
          Playing this week
        </h2>
        <PosterGrid
          entries={thisWeek.map((movie) => ({
            movie,
            meta: `${formatRuntime(movie.runtimeMin)} · ${movie.rating}`,
          }))}
        />
      </section>

      <MovieBrowser
        tonight={tonight}
        selectedId={featured?.id}
        className="max-desktop:hidden"
      >
        {featured && (
          <MovieDetail
            movie={featured}
            now={now}
            prefs={prefs}
            showtimes={showtimes}
            theaters={theaters}
            watchlisted={watchlist.some((w) => w.movieId === featured.id)}
          />
        )}
      </MovieBrowser>
    </AppShell>
  );
}
