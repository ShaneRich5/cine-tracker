import { ChevronLeft, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { sticker } from "./sticker-card";

const stripes = {
  mobile:
    "bg-[repeating-linear-gradient(90deg,var(--color-accent)_0_22px,var(--color-surface)_22px_44px)]",
  desktop:
    "bg-[repeating-linear-gradient(90deg,var(--color-accent)_0_28px,var(--color-surface)_28px_56px)]",
};

/** Red and white awning stripes with a 3px ink bottom border. */
export function StripedHeader({
  size = "mobile",
  className,
  ...props
}: ComponentProps<"header"> & { size?: keyof typeof stripes }) {
  return (
    <header
      className={cn("border-b-[3px] border-ink", stripes[size], className)}
      {...props}
    />
  );
}

export function HeaderIconLink({
  href,
  label,
  large = false,
  className,
  children,
}: {
  href: string;
  label: string;
  large?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        sticker,
        "flex shrink-0 items-center justify-center rounded-xl shadow-sticker-sm",
        large ? "size-12" : "size-11",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function PreferencesIconLink({ className }: { className?: string }) {
  return (
    <HeaderIconLink
      href="/preferences"
      label="Preferences"
      className={className}
    >
      <SlidersHorizontal className="size-[22px]" strokeWidth={1.8} />
    </HeaderIconLink>
  );
}

/** Mobile home: tall stripes with the wordmark sticker in the middle. */
export function MobileHomeHeader({
  dateLabel,
  locationLabel,
}: {
  dateLabel: string;
  locationLabel: string;
}) {
  return (
    <StripedHeader className="relative flex h-[153px] items-center justify-center">
      <div className={cn(sticker, "px-[18px] py-2.5 text-center")}>
        <h1 className="font-display text-[32px] leading-none text-accent">
          cine-tracker
        </h1>
        <p className="mt-1 text-xs font-bold">
          {dateLabel} · {locationLabel}
        </p>
      </div>
      <PreferencesIconLink className="absolute top-2.5 right-2.5" />
    </StripedHeader>
  );
}

/** Mobile inner pages: back button plus a title sticker. */
export function MobileTitleHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <StripedHeader className="flex items-center gap-2 pt-2.5 pr-3 pb-3.5 pl-2.5">
      {backHref && (
        <HeaderIconLink href={backHref} label="Back" large>
          <ChevronLeft className="size-[22px]" strokeWidth={1.8} />
        </HeaderIconLink>
      )}
      <div
        className={cn(
          sticker,
          subtitle ? "min-w-0 flex-1 px-3 py-2" : "px-3.5 py-2",
        )}
      >
        <h1
          className={cn(
            "font-display text-accent",
            subtitle ? "text-[26px] leading-none" : "text-2xl leading-tight",
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-[3px] text-xs font-semibold">{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </StripedHeader>
  );
}
