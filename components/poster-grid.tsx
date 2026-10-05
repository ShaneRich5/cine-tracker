import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Movie } from "@/lib/types";

/** Poster tiles. Posters are solid placeholders until TMDB images land. */
export function PosterGrid({
  entries,
  selectedId,
}: {
  entries: { movie: Movie; meta: string }[];
  selectedId?: string;
}) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3.5">
      {entries.map(({ movie, meta }) => {
        const selected = movie.id === selectedId;
        return (
          <li key={movie.id}>
            <Link
              href={`/movies/${movie.id}`}
              aria-current={selected ? "page" : undefined}
              className="flex flex-col gap-2 no-underline"
            >
              <span
                className={cn(
                  "flex h-[170px] items-end rounded-[14px] border-2 border-ink p-2.5",
                  selected && "shadow-selected",
                )}
                style={{ backgroundColor: movie.posterColor }}
              >
                <span className="font-display text-lg leading-[1.05] text-white">
                  {movie.title}
                </span>
              </span>
              <span className="text-xs font-bold text-muted">{meta}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
