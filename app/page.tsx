import { AppShell } from "@/components/app-shell";
import { MovieBrowser } from "@/components/movie-browser";
import { MovieDetail } from "@/components/movie-detail";
import { MobileHomeHeader } from "@/components/striped-header";
import { TonightList, WatchlistChips } from "@/components/tonight-list";
import {
  getMovies,
  getNow,
  getShowtimes,
  getTheaters,
  LOCATION_LABEL,
} from "@/lib/data";
import { getPrefs } from "@/lib/get-prefs";
import { getWatchlistIds } from "@/lib/get-watchlist";
import { buildTonight } from "@/lib/showtimes";
import { buildWatchlist } from "@/lib/watchlist";
import { formatDayLabel } from "@/lib/time";

export default async function HomePage() {
  const now = getNow();
  const [prefs, movies, theaters, showtimes, watchlist] = await Promise.all([
    getPrefs(),
    getMovies(),
    getTheaters(),
    getShowtimes(),
    getWatchlistIds(),
  ]);
  const tonight = buildTonight({ now, movies, showtimes, theaters, prefs });
  const featured = tonight[0]?.movie;
  const watchlistEntries = buildWatchlist({
    ids: watchlist,
    now,
    movies,
    showtimes,
    theaters,
    prefs,
  });

  return (
    <AppShell
      section="home"
      prefs={prefs}
      now={now}
      mobileHeader={
        <MobileHomeHeader
          dateLabel={formatDayLabel(now)}
          locationLabel={LOCATION_LABEL}
        />
      }
    >
      <div className="desktop:hidden">
        <TonightList entries={tonight} />
        <WatchlistChips entries={watchlistEntries} movies={movies} />
      </div>

      <WatchlistChips
        entries={watchlistEntries}
        movies={movies}
        className="pt-0 pb-5 max-desktop:hidden"
        headingId="watchlist-heading-desktop"
      />

      <MovieBrowser
        tonight={tonight}
        selectedId={featured?.id}
        className="max-desktop:hidden"
      >
        {featured ? (
          <MovieDetail
            movie={featured}
            now={now}
            prefs={prefs}
            showtimes={showtimes}
            theaters={theaters}
            watchlisted={watchlist.includes(featured.id)}
          />
        ) : (
          <h1 className="font-display text-[38px] leading-none text-accent">
            cine-tracker
          </h1>
        )}
      </MovieBrowser>
    </AppShell>
  );
}
