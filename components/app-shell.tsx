import type { ReactNode } from "react";
import { LOCATION_LABEL } from "@/lib/data";
import type { Prefs } from "@/lib/prefs";
import { formatDayLabel } from "@/lib/time";
import { cn } from "@/lib/utils";
import { PrefsPanel, PrefsPanelProvider } from "./prefs-panel";
import { TabBar, type Section } from "./tab-bar";
import { TopNav } from "./top-nav";

/**
 * Page frame. Desktop (900px and up) gets the striped top nav and the
 * preferences panel; mobile gets the page's own header and the bottom tab bar.
 */
export function AppShell({
  section,
  prefs,
  now,
  mobileHeader,
  children,
}: {
  section: Section;
  prefs: Prefs;
  now: Date;
  mobileHeader: ReactNode;
  children: ReactNode;
}) {
  const hasTabBar = section !== "preferences";

  return (
    <PrefsPanelProvider>
      <TopNav
        section={section}
        dateLabel={formatDayLabel(now)}
        locationLabel={LOCATION_LABEL}
      />
      <div className="desktop:hidden">{mobileHeader}</div>
      <main
        className={cn(
          "mx-auto w-full max-w-[1200px] px-[18px] desktop:px-6 desktop:pt-5 desktop:pb-12",
          hasTabBar ? "pb-[90px]" : "pb-6",
        )}
      >
        {section !== "preferences" && <PrefsPanel prefs={prefs} />}
        {children}
      </main>
      {hasTabBar && <TabBar section={section} />}
    </PrefsPanelProvider>
  );
}
