"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

/** Watchlist toggle. Local state only until watchlists are stored (a later stage). */
export function WatchlistButton({ initialOn }: { initialOn: boolean }) {
  const [on, setOn] = useState(initialOn);
  return (
    <Button
      variant="sticker"
      onClick={() => setOn((v) => !v)}
      className={cn(!on && "bg-surface")}
    >
      {on ? "On watchlist" : "Add to watchlist"}
    </Button>
  );
}
