import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { theaterCountLabel, type TonightEntry } from "@/lib/showtimes";
import { formatClock } from "@/lib/time";
import { MovieSearchList } from "./movie-search-list";

/** Desktop two-column layout: searchable "Playing tonight" list left, movie detail right. */
export function MovieBrowser({
  tonight,
  selectedId,
  className,
  children,
}: {
  tonight: TonightEntry[];
  selectedId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "desktop:grid desktop:grid-cols-[300px_minmax(0,1fr)] desktop:items-start desktop:gap-7",
        className,
      )}
    >
      {/* Short enough to fit under the header before you scroll; sticky after. */}
      <aside
        aria-labelledby="tonight-desktop"
        className="max-desktop:hidden desktop:sticky desktop:top-4 desktop:flex desktop:max-h-[calc(100vh-10rem)] desktop:flex-col"
      >
        <h2
          id="tonight-desktop"
          className="mb-3 shrink-0 font-display text-2xl"
        >
          Playing tonight
        </h2>
        {tonight.length > 0 ? (
          <MovieSearchList
            selectedId={selectedId}
            entries={tonight.map((entry) => ({
              movie: entry.movie,
              meta: `${theaterCountLabel(entry.theaterCount)} · next ${formatClock(entry.upcoming[0].startsAt)}`,
            }))}
          />
        ) : (
          <p className="text-sm text-muted">
            Nothing left tonight at the theaters you follow.
          </p>
        )}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
