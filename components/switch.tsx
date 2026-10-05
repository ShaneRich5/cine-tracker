import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** 52×30 ink-bordered switch. The hit area extends past the track to 46px tall. */
export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: Omit<ComponentProps<"button">, "onChange" | "onClick"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative flex h-[30px] w-[52px] shrink-0 cursor-pointer items-center rounded-full border-2 border-ink p-px before:absolute before:inset-x-0 before:-inset-y-2",
        checked ? "justify-end bg-accent" : "justify-start bg-line",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="block size-6 rounded-full border-2 border-ink bg-surface"
      />
    </button>
  );
}
