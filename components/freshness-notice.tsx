import { TriangleAlert } from "lucide-react";
import type { Freshness } from "@/lib/freshness";
import { formatAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { sticker } from "./sticker-card";

function sourceNames(sources: string[]): string {
  return sources.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ");
}

/** "updated 12m ago", for the header and the mobile page footer. */
export function updatedLabel(freshness: Freshness, now: Date): string | null {
  return freshness.updatedAt
    ? `updated ${formatAgo(freshness.updatedAt, now)}`
    : null;
}

/**
 * Warning shown on every page when the showtimes haven't refreshed in a while
 * or the last fetch failed (the app then still shows the previous snapshot).
 */
export function StaleNotice({
  freshness,
  now,
  className,
}: {
  freshness: Freshness;
  now: Date;
  className?: string;
}) {
  if (!freshness.stale && freshness.failing.length === 0) return null;
  const failing =
    freshness.failing.length > 0
      ? ` The last ${sourceNames(freshness.failing)} fetch didn't fully work.`
      : "";

  return (
    <div
      className={cn(
        sticker,
        "flex items-start gap-2.5 bg-butter px-4 py-3 text-sm",
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-[18px] shrink-0" strokeWidth={2} />
      <p>
        <strong>Showtimes may be out of date.</strong>{" "}
        {freshness.updatedAt
          ? `Last updated ${formatAgo(freshness.updatedAt, now)}.`
          : "They haven't been fetched successfully yet."}
        {failing}
      </p>
    </div>
  );
}
