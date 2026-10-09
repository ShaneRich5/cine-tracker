"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Movie } from "@/lib/types";
import { PosterGrid } from "./poster-grid";

/** Lowercase words without accents or punctuation, so "spider man" finds "Spider-Man". */
function words(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function matches(title: string, query: string[]): boolean {
  const titleWords = words(title);
  return query.every((q) => titleWords.some((w) => w.startsWith(q)));
}

/**
 * The desktop sidebar's movie list with a search box above it. The list
 * scrolls on its own and starts scrolled to the selected movie.
 */
export function MovieSearchList({
  entries,
  selectedId,
}: {
  entries: { movie: Movie; meta: string }[];
  selectedId?: string;
}) {
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const queryWords = words(query);
  const shown =
    queryWords.length > 0
      ? entries.filter((e) => matches(e.movie.title, queryWords))
      : entries;

  // Scroll only the list (scrollIntoView could also move the page).
  useEffect(() => {
    const list = listRef.current;
    const selected = list?.querySelector<HTMLElement>("[aria-current=page]");
    if (!list || !selected) return;
    const top = selected.offsetTop; // the list is the offset parent
    if (top + selected.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top - 8;
    }
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-col">
      <label htmlFor={inputId} className="sr-only">
        Search movies playing tonight
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${entries.length} movies`}
        autoComplete="off"
        className="mb-3 h-11 w-full shrink-0 rounded-xl border-2 border-ink bg-surface px-3.5 text-sm font-semibold placeholder:font-normal placeholder:text-muted"
      />
      <div
        ref={listRef}
        className="relative -mr-2 min-h-0 overflow-y-auto overscroll-contain pr-2 pb-1"
      >
        {shown.length > 0 ? (
          <PosterGrid variant="list" selectedId={selectedId} entries={shown} />
        ) : (
          <p className="px-1.5 text-sm text-muted">
            No movies tonight match &ldquo;{query.trim()}&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}
