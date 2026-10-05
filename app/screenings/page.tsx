import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import {
  MobileTitleHeader,
  PreferencesIconLink,
} from "@/components/striped-header";
import { getNow } from "@/lib/data";
import { getPrefs } from "@/lib/get-prefs";

export const metadata: Metadata = { title: "Screenings" };

export default async function ScreeningsPage() {
  return (
    <AppShell
      section="screenings"
      prefs={await getPrefs()}
      now={getNow()}
      mobileHeader={
        <MobileTitleHeader
          title="Screenings"
          action={<PreferencesIconLink />}
        />
      }
    >
      <ComingSoon title="Screenings">
        Film clubs, pop-ups and theater rentals hosting their own screenings,
        with RSVP and ticket links.
      </ComingSoon>
    </AppShell>
  );
}
