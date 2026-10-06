import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Movie } from "@/lib/types";
import { Poster } from "./poster";

type Entry = { movie: Movie; meta: string };

/**
 * Movie tiles. "grid" is a wrapping poster wall; "list" is a compact row per
 * movie (thumbnail, title, meta) that stays short enough to scan in a sidebar.
 */
export function PosterGrid({
  entries,
  selectedId,
  variant = "grid",
}: {
  entries: Entry[];
  selectedId?: string;
  variant?: "grid" | "list";
}) {
  const list = variant === "list";
  return (
    <ul
      className={
        list
          ? "flex flex-col gap-2.5"
          : "grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3.5"
      }
    >
      {entries.map(({ movie, meta }) => {
        const selected = movie.id === selectedId;
        return (
          <li key={movie.id}>
            <Link
              href={`/movies/${movie.id}`}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "no-underline",
                list
                  ? "flex items-center gap-3 rounded-[14px] p-1.5"
                  : "flex flex-col gap-2",
              )}
            >
              <Poster
                movie={movie}
                showTitle={!list}
                sizes={list ? "56px" : "130px"}
                className={cn(
                  list
                    ? "h-[84px] w-[56px] rounded-[10px]"
                    : "aspect-[2/3] w-full rounded-[14px]",
                  selected && "shadow-selected",
                )}
              />
              {list ? (
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-display text-lg leading-tight">
                    {movie.title}
                  </span>
                  <span className="text-xs font-bold text-muted">{meta}</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-muted">{meta}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
