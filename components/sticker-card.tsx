import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** The H signature card: 2px ink border, 16px radius, hard 3px ink shadow. */
export const sticker =
  "rounded-2xl border-2 border-ink bg-surface shadow-sticker";

export function StickerCard({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(sticker, className)} {...props} />;
}
