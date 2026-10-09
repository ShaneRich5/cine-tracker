import type { ReactNode } from "react";
import { getStatus, LOCATION_LABEL } from "@/lib/data";
import { getFreshness } from "@/lib/freshness";
import type { Prefs } from "@/lib/prefs";
import { formatDayLabel } from "@/lib/time";
import { cn } from "@/lib/utils";
import { StaleNotice, updatedLabel } from "./freshness-notice";
import { PrefsPanel, PrefsPanelProvider } from "./prefs-panel";
import { TabBar, type Section } from "./tab-bar";
import { TopNav } from "./top-nav";

/**
 * Page frame. Desktop (900px and up) gets the striped top nav and the
 * preferences panel; mobile gets the page's own header and the bottom tab bar.
 * Both warn when the showtimes are stale.
 */
export async function AppShell({
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
  const status = await getStatus();
  const freshness = status ? getFreshness(status, now) : null;
  const updated = freshness ? updatedLabel(freshness, now) : null;

  return (
    <PrefsPanelProvider>
      <TopNav
        section={section}
        dateLabel={formatDayLabel(now)}
        locationLabel={LOCATION_LABEL}
        updatedLabel={updated}
      />
      <div className="desktop:hidden">{mobileHeader}</div>
      <main
        className={cn(
          "mx-auto w-full max-w-[1200px] px-[18px] desktop:px-6 desktop:pt-5 desktop:pb-12",
          hasTabBar ? "pb-[90px]" : "pb-6",
        )}
      >
        {section !== "preferences" && <PrefsPanel prefs={prefs} />}
        {freshness && (
          <StaleNotice
            freshness={freshness}
            now={now}
            className="mt-3.5 mb-1 desktop:mt-0 desktop:mb-5"
          />
        )}
        {children}
        {updated && (
          <p className="pt-6 text-center text-xs text-muted desktop:hidden">
            Showtimes {updated}
          </p>
        )}
      </main>
      {hasTabBar && <TabBar section={section} />}
    </PrefsPanelProvider>
  );
}
