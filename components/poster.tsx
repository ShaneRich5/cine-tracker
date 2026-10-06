import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Movie } from "@/lib/types";

/** A movie's poster: the TMDB image when we have one, else a colored tile. Size it with className. */
export function Poster({
  movie,
  className,
  sizes = "130px",
  showTitle = false,
}: {
  movie: Movie;
  className?: string;
  sizes?: string;
  /** Print the title on the tile when there is no image. */
  showTitle?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-end overflow-hidden border-2 border-ink",
        className,
      )}
      style={{ backgroundColor: movie.posterColor }}
    >
      {movie.posterUrl ? (
        <Image
          src={movie.posterUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        showTitle && (
          <span className="p-2.5 font-display text-lg leading-[1.05] text-white">
            {movie.title}
          </span>
        )
      )}
    </span>
  );
}
