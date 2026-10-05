import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { sticker } from "./sticker-card";

/** Placeholder for sections planned for a later build. */
export function ComingSoon({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="pt-[18px] desktop:pt-0">
      <h1 className="mb-4 font-display text-[38px] leading-none text-accent max-desktop:hidden">
        {title}
      </h1>
      <div className={cn(sticker, "max-w-xl p-5")}>
        <h2 className="font-display text-xl">Coming later</h2>
        <p className="mt-1 text-sm text-muted">{children}</p>
      </div>
    </div>
  );
}
