import { cookies } from "next/headers";
import { PREFS_COOKIE, parsePrefsCookie, type Prefs } from "./prefs";

/** Reads preferences from the ct_prefs cookie so filters apply on the server render. */
export async function getPrefs(): Promise<Prefs> {
  const cookieStore = await cookies();
  return parsePrefsCookie(cookieStore.get(PREFS_COOKIE)?.value);
}
