import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import {
  MobileTitleHeader,
  PreferencesIconLink,
} from "@/components/striped-header";
import { getNow } from "@/lib/data";
import { getPrefs } from "@/lib/get-prefs";

export const metadata: Metadata = { title: "Theaters" };

export default async function TheatersPage() {
  return (
    <AppShell
      section="theaters"
      prefs={await getPrefs()}
      now={getNow()}
      mobileHeader={
        <MobileTitleHeader title="Theaters" action={<PreferencesIconLink />} />
      }
    >
      <ComingSoon title="Theaters">
        Pick a theater and a date to see everything playing there.
      </ComingSoon>
    </AppShell>
  );
}
