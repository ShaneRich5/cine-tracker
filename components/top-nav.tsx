import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PrefsPanelToggle } from "./prefs-panel";
import { sticker } from "./sticker-card";
import { StripedHeader } from "./striped-header";
import type { Section } from "./tab-bar";

const navPill =
  "flex items-center gap-1.5 rounded-full border-2 border-ink bg-surface px-3.5 py-2 font-display text-base leading-tight text-ink no-underline hover:text-ink";

/** Desktop header: wordmark sticker on the stripes plus nav pills. */
export function TopNav({
  section,
  dateLabel,
  locationLabel,
}: {
  section: Section;
  dateLabel: string;
  locationLabel: string;
}) {
  const links = [
    {
      href: "/",
      label: "Movies",
      active: section === "home" || section === "movies",
    },
    { href: "/theaters", label: "Theaters", active: section === "theaters" },
    {
      href: "/screenings",
      label: "Screenings",
      active: section === "screenings",
    },
  ];
  const prefsIcon = (
    <SlidersHorizontal className="size-[18px]" strokeWidth={2} />
  );

  return (
    <StripedHeader size="desktop" className="max-desktop:hidden">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3.5 px-6 py-[22px]">
        <Link
          href="/"
          className={cn(sticker, "block px-[18px] py-2.5 no-underline")}
        >
          <span className="block font-display text-[34px] leading-none text-accent">
            cine-tracker
          </span>
          <span className="mt-1 block text-xs font-bold">
            {dateLabel} · {locationLabel}
          </span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={link.active ? "page" : undefined}
                  className={cn(navPill, link.active && "bg-butter")}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              {section === "preferences" ? (
                <Link
                  href="/preferences"
                  aria-current="page"
                  className={cn(navPill, "bg-butter")}
                >
                  {prefsIcon}
                  Preferences
                </Link>
              ) : (
                <PrefsPanelToggle className={cn(navPill, "cursor-pointer")}>
                  {prefsIcon}
                  Preferences
                </PrefsPanelToggle>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </StripedHeader>
  );
}
