"use server";

import { cookies } from "next/headers";
import {
  PREFS_COOKIE,
  PREFS_MAX_AGE,
  parsePrefs,
  serializePrefs,
} from "@/lib/prefs";

/** Saves preferences to the ct_prefs cookie. The current page re-renders with them. */
export async function savePrefs(input: unknown): Promise<void> {
  const prefs = parsePrefs(input);
  const cookieStore = await cookies();
  cookieStore.set(PREFS_COOKIE, serializePrefs(prefs), {
    path: "/",
    sameSite: "lax",
    maxAge: PREFS_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
