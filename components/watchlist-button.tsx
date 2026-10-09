"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { setWatchlisted } from "@/app/actions";
import { cn } from "@/lib/utils";
import { sticker } from "./sticker-card";
import { Button } from "./ui/button";

/**
 * Watchlist toggle, saved to the ct_watchlist cookie. "sticker" is the desktop
 * pill with its state in the text; "icon" is the mobile header button.
 */
export function WatchlistButton({
  movieId,
  on,
  variant = "sticker",
  className,
}: {
  movieId: string;
  on: boolean;
  variant?: "sticker" | "icon";
  className?: string;
}) {
  const [optimisticOn, setOptimisticOn] = useOptimistic(on);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !optimisticOn;
    startTransition(async () => {
      setOptimisticOn(next);
      await setWatchlisted(movieId, next);
    });
  }

  if (variant === "icon") {
    const Icon = optimisticOn ? BookmarkCheck : Bookmark;
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label="On watchlist"
        aria-pressed={optimisticOn}
        className={cn(
          sticker,
          "flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl shadow-sticker-sm",
          optimisticOn && "bg-butter",
          className,
        )}
      >
        <Icon className="size-[22px]" strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <Button
      variant="sticker"
      onClick={toggle}
      className={cn(!optimisticOn && "bg-surface", className)}
    >
      {optimisticOn ? "On watchlist" : "Add to watchlist"}
    </Button>
  );
}
