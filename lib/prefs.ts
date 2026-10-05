import {
  FORMATS,
  THEATER_GROUPS,
  type Format,
  type TheaterGroup,
} from "./types";

export const PREFS_COOKIE = "ct_prefs";
export const PREFS_MAX_AGE = 60 * 60 * 24 * 365;

export const LAYOUTS = ["theater", "time", "timeline"] as const;
export type ShowtimeLayout = (typeof LAYOUTS)[number];

export type Prefs = {
  groups: TheaterGroup[];
  formats: Format[];
  hideAccessibleOnly: boolean;
  layout: ShowtimeLayout;
};

export const DEFAULT_PREFS: Prefs = {
  groups: ["amc", "regal", "alamo", "local"],
  formats: ["imax", "dolby", "70mm"],
  hideAccessibleOnly: true,
  layout: "theater",
};

export const GROUP_OPTIONS: {
  id: TheaterGroup;
  name: string;
  description: string;
  shortDescription: string;
  summaryLabel: string;
}[] = [
  {
    id: "amc",
    name: "AMC",
    description: "Shows A-List eligibility",
    shortDescription: "Shows A-List eligibility",
    summaryLabel: "AMC",
  },
  {
    id: "regal",
    name: "Regal",
    description: "Regal and UA theaters",
    shortDescription: "Regal and UA theaters",
    summaryLabel: "Regal",
  },
  {
    id: "alamo",
    name: "Alamo Drafthouse",
    description: "Dine-in theaters",
    shortDescription: "Dine-in theaters",
    summaryLabel: "Alamo",
  },
  {
    id: "other_chain",
    name: "Other chains",
    description: "Cinemark, Showcase and smaller chains",
    shortDescription: "Cinemark, Showcase and more",
    summaryLabel: "other chains",
  },
  {
    id: "local",
    name: "Local & indie",
    description: "Museum of the Moving Image, Nitehawk, Metrograph",
    shortDescription: "MoMI, Nitehawk, Metrograph",
    summaryLabel: "local",
  },
];

export const LAYOUT_OPTIONS: { id: ShowtimeLayout; label: string }[] = [
  { id: "theater", label: "By theater" },
  { id: "time", label: "Time of day" },
  { id: "timeline", label: "Timeline" },
];

/** Formats offered as preferences (RPX is Regal-only, so it isn't listed). */
export const FORMAT_OPTIONS: Format[] = [
  "imax",
  "dolby",
  "70mm",
  "35mm",
  "3d",
  "standard",
];

function pickList<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T[],
): T[] {
  if (!Array.isArray(value)) return fallback;
  return allowed.filter((item) => value.includes(item));
}

/** Coerces untrusted input (cookie JSON or a server action payload) into Prefs. */
export function parsePrefs(input: unknown): Prefs {
  if (typeof input !== "object" || input === null) return DEFAULT_PREFS;
  const raw = input as Record<string, unknown>;
  return {
    groups: pickList(raw.groups, THEATER_GROUPS, DEFAULT_PREFS.groups),
    formats: pickList(raw.formats, FORMATS, DEFAULT_PREFS.formats),
    hideAccessibleOnly:
      typeof raw.hideAccessibleOnly === "boolean"
        ? raw.hideAccessibleOnly
        : DEFAULT_PREFS.hideAccessibleOnly,
    layout: LAYOUTS.includes(raw.layout as ShowtimeLayout)
      ? (raw.layout as ShowtimeLayout)
      : DEFAULT_PREFS.layout,
  };
}

export function parsePrefsCookie(value: string | undefined): Prefs {
  if (!value) return DEFAULT_PREFS;
  try {
    return parsePrefs(JSON.parse(value));
  } catch {
    return DEFAULT_PREFS;
  }
}

export function serializePrefs(prefs: Prefs): string {
  return JSON.stringify(prefs);
}

/** "AMC, Regal, Alamo, local" for the movie page's filter summary. */
export function groupsSummary(prefs: Prefs): string {
  const labels = GROUP_OPTIONS.filter((g) => prefs.groups.includes(g.id)).map(
    (g) => g.summaryLabel,
  );
  return labels.length > 0 ? labels.join(", ") : "no theater groups";
}
