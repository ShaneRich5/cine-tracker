import { Film, House, MapPin, Users } from "lucide-react";
import Link from "next/link";

export type Section =
  "home" | "movies" | "theaters" | "screenings" | "preferences";

const tabs = [
  { section: "home", href: "/", label: "Home", Icon: House },
  { section: "movies", href: "/movies", label: "Movies", Icon: Film },
  { section: "theaters", href: "/theaters", label: "Theaters", Icon: MapPin },
  {
    section: "screenings",
    href: "/screenings",
    label: "Screenings",
    Icon: Users,
  },
] as const;

/** Mobile bottom tab bar. */
export function TabBar({ section }: { section: Section }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 h-[74px] border-t-[3px] border-ink bg-surface pb-2 desktop:hidden"
    >
      <ul className="grid h-full grid-cols-4">
        {tabs.map(({ section: tab, href, label, Icon }) => (
          <li key={tab}>
            <Link
              href={href}
              aria-current={tab === section ? "page" : undefined}
              className="flex h-full flex-col items-center justify-center gap-[3px] font-display text-xs tracking-[0.02em] text-muted no-underline hover:text-ink aria-[current=page]:text-accent"
            >
              <Icon className="size-[22px]" strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
