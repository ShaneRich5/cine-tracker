import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PreferencesForm } from "@/components/preferences-form";
import { MobileTitleHeader } from "@/components/striped-header";
import { getNow } from "@/lib/data";
import { getPrefs } from "@/lib/get-prefs";
import { safeReturnPath } from "@/lib/paths";

export const metadata: Metadata = { title: "Preferences" };

export default async function PreferencesPage(
  props: PageProps<"/preferences">,
) {
  const { from } = await props.searchParams;
  const prefs = await getPrefs();

  return (
    <AppShell
      section="preferences"
      prefs={prefs}
      now={getNow()}
      mobileHeader={
        <MobileTitleHeader
          backHref={safeReturnPath(from) ?? "/"}
          title="Preferences"
        />
      }
    >
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-[38px] leading-none text-accent max-desktop:hidden">
          Preferences
        </h1>
        <PreferencesForm initialPrefs={prefs} variant="page" />
      </div>
    </AppShell>
  );
}
